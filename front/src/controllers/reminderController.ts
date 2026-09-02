// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { RepeatType } from "@/utils/types";
import { LocalNotifications } from "@capacitor/local-notifications";
import { add, sub, Duration } from "date-fns";
import { normalizeOffsetCodes, offsetToDuration } from "@/utils/reminders";

/**
 * Scheduling is best-effort with respect to OS notification permission
 * (FR-11/FR-38): the entity create/update/delete MUST still persist when the
 * user denies permission. Callers catch this error and continue persistence.
 */
export class NotificationPermissionError extends Error {
  constructor(message = "Notification permission denied") {
    super(message);
    this.name = "NotificationPermissionError";
  }
}

/** Hard bound for repeat-occurrence expansion (FR-17). */
const MAX_OCCURRENCES = 2000;

interface RepeatParams {
  frecuency: number;
  type: RepeatType | "unique" | string;
  daysWeek?: string[];
}

const WEEK_DAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Centralized scheduling/cancellation for events, tasks and notes (FR-7..FR-11).
 * All create/update/delete flows route through this controller; nothing else
 * schedules or cancels Capacitor local notifications. Single source of offset
 * vocabulary: utils/reminders.ts (FR-1).
 */
// Module-level monotonic counter so ids stay unique across every ReminderController
// instance (fresh instances are per call site and must not reset the counter).
let notificationBase = 0;
let notificationCounter = 0;

function nextNotificationId(): number {
  const base = Date.now() * 1_000;
  if (base === notificationBase) {
    notificationCounter += 1;
  } else {
    notificationBase = base;
    notificationCounter = 0;
  }
  return base + notificationCounter;
}

export class ReminderController {
  async #assertPermission(): Promise<void> {
    const granted = await this.checkNotificationsPermissions();
    if (!granted) throw new NotificationPermissionError();
  }

  async #scheduleOne(params: {
    title: string;
    message: string;
    at: Date;
    extraInfo: string | number;
  }): Promise<number> {
    const { title, message, at, extraInfo } = params;
    const id = nextNotificationId();
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body: message,
          id,
          schedule: { at },
          actionTypeId: "",
          extra: String(extraInfo),
        },
      ],
    }).catch((error) => {
      console.error(
        "[ReminderController] schedule failed (best-effort):",
        error,
      );
    });
    return id;
  }

  async #cancelOne(params: { id: number }): Promise<void> {
    const { id } = params;
    try {
      // Capacitor LocalNotifications.cancel is a safe no-op for ids that were
      // never scheduled on this device (FR-10/FR-36).
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error) {
      console.error("[ReminderController] cancel failed (safe no-op):", error);
    }
  }

  #scheduleCore(params: {
    title: string;
    message: string;
    extraInfo: string | number;
    occurrences: Date[];
    notifications: string[];
    existingIds: number[];
  }): Promise<number[]> {
    const {
      title,
      message,
      extraInfo,
      occurrences,
      notifications,
      existingIds,
    } = params;
    const targets = this.#computeTargets({ occurrences, notifications });
    return this.#scheduleTargets({
      title,
      message,
      extraInfo,
      targets,
      existingIds,
    });
  }

  async #scheduleTargets(params: {
    title: string;
    message: string;
    extraInfo: string | number;
    targets: Date[];
    existingIds: number[];
  }): Promise<number[]> {
    const { title, message, extraInfo, targets, existingIds } = params;
    // (1) pre-check permission once per save; denial throws NotificationPermissionError
    //     BEFORE cancelling anything so callers can persist cleanly (FR-11/FR-38).
    await this.#assertPermission();
    // (2) cancel-then-schedule: cancel previously scheduled ids (FR-13/FR-22/FR-28).
    for (const existingId of existingIds ?? []) {
      if (Number.isFinite(existingId))
        await this.#cancelOne({ id: existingId });
    }
    // (4) schedule every target; ids are batch-unique within the save.
    const ids: number[] = [];
    for (const at of targets) {
      ids.push(await this.#scheduleOne({ title, message, at, extraInfo }));
    }
    return ids;
  }

  /**
   * Expand repeat occurrences, bounded to MAX_OCCURRENCES (FR-17).
   * - weekly with non-empty daysWeek enumerates day-by-day and keeps only the
   *   chosen weekday names (FR-16/FR-18);
   * - non-weekly repeats advance start + n * unit(frecuency) while ≤ end;
   * - 'unique' or unknown repeat types yield the single start occurrence.
   */
  #expandOccurrences(params: {
    start: Date;
    end: Date;
    repeat: RepeatParams;
  }): Date[] {
    const { start, end, repeat } = params;
    const safeFrecuency = Math.max(1, repeat?.frecuency ?? 1);
    const repeatType = repeat?.type;
    const daysWeek = repeat?.daysWeek ?? [];

    const current = new Date(start.getTime());
    current.setMilliseconds(0);
    current.setSeconds(0);

    if (repeatType === "weekly" && daysWeek.length > 0) {
      const allowedDays = new Set(
        daysWeek.map((day) => WEEK_DAYS[String(day).toLowerCase()] ?? -1),
      );
      const dates: Date[] = [];
      // Week index = whole weeks elapsed from a fixed epoch (midnight anchor).
      // Using DAYS-from-epoch (not day-of-month) keeps a monotonic global week
      // counter that does NOT reset at month boundaries, so "Cada N semanas"
      // stays correct even when a recurrence crosses a month.
      const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const weekIndex = (d: Date): number =>
        Math.floor((d.getTime() - Date.UTC(2000, 0, 1)) / WEEK_MS);
      const firstWeek = weekIndex(start);
      while (current <= end && dates.length < MAX_OCCURRENCES) {
        const currentWeek = weekIndex(current);
        if (
          (currentWeek - firstWeek) % safeFrecuency === 0 &&
          allowedDays.has(current.getDay())
        ) {
          dates.push(new Date(current.getTime()));
        }
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }

    const repeatUnit: Record<string, keyof Duration> = {
      daily: "days",
      weekly: "weeks",
      monthly: "months",
      annually: "years",
    };
    const unit = repeatType ? repeatUnit[repeatType] : undefined;

    if (!unit) {
      // single-due-date paths (task/note) and 'unique' events: one occurrence
      return [new Date(current.getTime())];
    }

    const dates: Date[] = [];
    while (current <= end && dates.length < MAX_OCCURRENCES) {
      dates.push(new Date(current.getTime()));
      const next = add(current, { [unit]: safeFrecuency } as Duration);
      current.setTime(next.getTime());
    }
    return dates;
  }

  /**
   * occurrences × notifications → fire times (occurrence − offset), skipping
   * any fire time already in the past (FR-19/FR-39). date-fns sub/add clamp
   * month edges deterministically (Jan 31 − 1 month → Dec 31, FR-40/AC-26).
   */
  #computeTargets(params: {
    occurrences: Date[];
    notifications: string[];
  }): Date[] {
    const { occurrences, notifications } = params;
    const canonicalNotifications = normalizeOffsetCodes(notifications ?? []);
    const now = Date.now();
    const targets: Date[] = [];
    for (const occurrence of occurrences) {
      for (const code of canonicalNotifications) {
        const duration = offsetToDuration(code);
        const fire =
          duration === null
            ? new Date(occurrence.getTime())
            : sub(occurrence, duration);
        if (fire.getTime() <= now) continue;
        targets.push(fire);
      }
    }
    return targets;
  }

  async scheduleEventReminders(params: {
    entityId: number | string;
    title: string;
    message: string;
    start: Date;
    end: Date;
    repeat: RepeatParams;
    notifications: string[];
    existingIds: number[];
  }): Promise<{ ids: number[] }> {
    const {
      entityId,
      title,
      message,
      start,
      end,
      repeat,
      notifications,
      existingIds,
    } = params;
    const occurrences = this.#expandOccurrences({ start, end, repeat });
    const ids = await this.#scheduleCore({
      title,
      message,
      extraInfo: entityId,
      occurrences,
      notifications: notifications ?? [],
      existingIds: existingIds ?? [],
    });
    return { ids };
  }

  async cancelEventReminders(params: { ids: number[] }): Promise<void> {
    for (const id of params.ids ?? []) {
      if (Number.isFinite(id)) await this.#cancelOne({ id });
    }
  }

  async scheduleTaskReminders(params: {
    taskId: number | string;
    title: string;
    message: string;
    dueDate: Date;
    notifications: string[];
    existingIds: number[];
  }): Promise<{ ids: number[] }> {
    const { taskId, title, message, dueDate, notifications, existingIds } =
      params;
    const ids = await this.#scheduleCore({
      title,
      message,
      extraInfo: taskId,
      occurrences: [dueDate],
      notifications: notifications ?? [],
      existingIds: existingIds ?? [],
    });
    return { ids };
  }

  async cancelTaskReminders(params: { ids: number[] }): Promise<void> {
    for (const id of params.ids ?? []) {
      if (Number.isFinite(id)) await this.#cancelOne({ id });
    }
  }

  async scheduleNoteReminders(params: {
    noteId: number | string;
    title: string;
    message: string;
    reminderDate: Date;
    notifications?: string[];
    existingIds: number[];
  }): Promise<{ ids: number[] }> {
    const { noteId, title, message, reminderDate, notifications, existingIds } =
      params;
    // Notes expose an exact datetime UI; the shared dictionary models it as
    // at_time → fire exactly at the reminder datetime (D2/FR-5/FR-27).
    const safeNotifications =
      notifications && notifications.length > 0 ? notifications : ["at_time"];
    const ids = await this.#scheduleCore({
      title,
      message,
      extraInfo: noteId,
      occurrences: [reminderDate],
      notifications: safeNotifications,
      existingIds: existingIds ?? [],
    });
    return { ids };
  }

  async cancelNoteReminders(params: { ids: number[] }): Promise<void> {
    for (const id of params.ids ?? []) {
      if (Number.isFinite(id)) await this.#cancelOne({ id });
    }
  }

  async checkNotificationsPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display == "granted") {
      return true;
    } else {
      return false;
    }
  }
}
