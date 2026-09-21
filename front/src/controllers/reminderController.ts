// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { RepeatType } from "@/utils/types";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { PendingLocalNotificationSchema } from "@capacitor/local-notifications";
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

/**
 * FNV-1a with 32-bit multiply, folded to a positive 31-bit integer. Non-crypto
 * and stable across runs: the same input always yields the same id, so
 * re-scheduling an external reminder replaces its previous notification
 * instead of piling up a new one. Collisions within a batch are resolved by
 * linear probing (see syncExternalReminders).
 */
function fnv1a31(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Math.imul keeps multiplication in 32-bit space (no float precision loss).
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) & 0x7fffffff;
}

/**
 * The external-report marker travels as an **object** `{ ext: key }`.
 * Non-object `extra` values do not survive the native round-trip: Android reads
 * it via `JSObject.getJSObject` (a string becomes `null`) and iOS does
 * `as? JSObject ?? [:]` (a string becomes `{}`). A string marker would therefore
 * be unrecoverable from `getPending()`, silently disabling reconciliation.
 *
 * The local entity flows keep passing a plain string `extra`; this guard must
 * never classify those as external, so it requires the object shape.
 */
function isExternalMarker(params: { extra: unknown }): boolean {
  const { extra } = params;
  return (
    typeof extra === "object" &&
    extra !== null &&
    typeof (extra as { ext?: unknown }).ext === "string"
  );
}

/** Fire time of a pending notification as epoch ms, or null when unavailable. */
function pendingFireTime(params: {
  schedule?: { at?: Date };
}): number | null {
  const { schedule } = params;
  if (!schedule?.at) return null;
  const time = new Date(schedule.at).getTime();
  return Number.isFinite(time) ? time : null;
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

  /**
   * Schedules local notifications for external (Google/CalDAV/ICS) reminders.
   * This is the app-local counterpart to push/server scheduling: it runs on
   * every device, including degoogled ones, and needs no push infrastructure.
   *
   * Best-effort by design: a denied permission only means no external
   * reminders (no throw, no toast), and a plugin failure is logged without
   * aborting the remaining work.
   */
  async syncExternalReminders(params: {
    items: {
      key: string;
      title: string;
      message: string;
      start: Date;
      offsetsSeconds: number[];
    }[];
  }): Promise<void> {
    const { items } = params;
    const now = Date.now();

    // (1) Build the desired set. Each offset is seconds before `start`, so a
    // larger (more positive) offset fires earlier. Skip past/non-finite fires.
    const desired: {
      key: string;
      title: string;
      body: string;
      fireAt: Date;
      offsetSeconds: number;
    }[] = [];
    for (const item of items ?? []) {
      for (const offsetSeconds of item.offsetsSeconds ?? []) {
        if (!Number.isFinite(offsetSeconds)) continue;
        const fireAt = new Date(item.start.getTime() - offsetSeconds * 1000);
        if (!Number.isFinite(fireAt.getTime())) continue;
        if (fireAt.getTime() <= now) continue;
        desired.push({
          key: item.key,
          title: item.title,
          body: item.message || item.title,
          fireAt,
          offsetSeconds,
        });
      }
    }

    // (2) Canonical order (by key, then offset descending) makes id assignment
    // deterministic for identical input. Collisions probe linearly.
    desired.sort((a, b) =>
      a.key < b.key ? -1 : a.key > b.key ? 1 : b.offsetSeconds - a.offsetSeconds,
    );

    // (3) Fetch pending notifications ONCE per run. Reconciliation and
    // cancellation need no permission, so this runs before any permission
    // query (and even when the desired set is empty).
    const pending = await this.#getPendingSafe();
    const nonExternalPendingIds = new Set<number>();
    const pendingById = new Map<number, PendingLocalNotificationSchema>();
    for (const notification of pending) {
      pendingById.set(notification.id, notification);
      if (!isExternalMarker({ extra: notification.extra })) {
        nonExternalPendingIds.add(notification.id);
      }
    }

    // (4) Deterministic ids, but never an id already owned by a local entity.
    // `nextNotificationId()` returns ~Date.now()*1000 (~1.7e15) while the
    // plugin truncates ids to a 32-bit int on Android, so the local and
    // external id spaces can intersect: without this probe an external
    // notification could silently overwrite an unrelated local one. Changing
    // the local id scheme is out of scope (it would orphan notifications
    // already scheduled on user devices); skipping the occupied id is the
    // narrow fix for this harm.
    const usedIds = new Set<number>();
    const planned = desired.map((entry) => {
      let id = fnv1a31(`${entry.key}|${entry.offsetSeconds}`);
      while (usedIds.has(id) || nonExternalPendingIds.has(id)) {
        id = (id + 1) % 2 ** 31;
      }
      usedIds.add(id);
      return { ...entry, id };
    });

    // (5) Cancel every pending external notification that is no longer
    // desired. The object marker is what makes this reliable: a string marker
    // never round-trips, so this branch would be dead code without it. Local
    // pending notifications are left untouched.
    for (const notification of pending) {
      if (!isExternalMarker({ extra: notification.extra })) continue;
      if (usedIds.has(notification.id)) continue;
      await this.#cancelOne({ id: notification.id });
    }

    // (6) Content comparison is what makes re-scheduling safe. Ids stay stable
    // for identical input, but when the input set changes a probed id can
    // shift; comparing id + title + body + fire time means a shifted id whose
    // content differs is replaced, while an identical run schedules nothing.
    // This also protects the web, where `schedule()` does NOT dedupe by id and
    // re-scheduling the same id would accumulate duplicates.
    const toSchedule = planned.filter((entry) => {
      const existing = pendingById.get(entry.id);
      if (!existing) return true;
      if (!isExternalMarker({ extra: existing.extra })) return true;
      return (
        existing.title !== entry.title ||
        existing.body !== entry.body ||
        pendingFireTime({ schedule: existing.schedule }) !==
          entry.fireAt.getTime()
      );
    });

    // (7) Nothing to schedule means no permission query at all. This is what
    // keeps the launch/foreground sync from prompting for notification
    // permission: the prompting path only lives in the local entity flows.
    if (toSchedule.length === 0) return;

    // (8) Silent permission check. The sync path must never prompt, because it
    // runs on every launch and foreground even when the user has no sources.
    if (!(await this.#checkNotificationsPermissionsSilently())) {
      console.warn(
        "[ReminderController] notification permission denied; external reminders skipped",
      );
      return;
    }

    // (9) Cancel each replaced id first so the web plugin does not keep the old
    // copy alongside the new one (no id dedupe there), then send every
    // notification in ONE schedule call to minimise churn.
    for (const entry of toSchedule) {
      if (pendingById.has(entry.id)) await this.#cancelOne({ id: entry.id });
    }
    await LocalNotifications.schedule({
      notifications: toSchedule.map((entry) => ({
        title: entry.title,
        body: entry.body,
        id: entry.id,
        schedule: { at: entry.fireAt },
        actionTypeId: "",
        extra: { ext: entry.key },
      })),
    }).catch((error) => {
      console.error(
        "[ReminderController] external schedule failed (best-effort):",
        error,
      );
    });
  }

  /** Read pending notifications without ever touching permission. */
  async #getPendingSafe(): Promise<PendingLocalNotificationSchema[]> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications ?? [];
    } catch (error) {
      console.error(
        "[ReminderController] getPending failed (best-effort):",
        error,
      );
      return [];
    }
  }

  /**
   * Silent counterpart of `checkNotificationsPermissions()`: `checkPermissions`
   * never prompts. Used by the background sync path.
   */
  async #checkNotificationsPermissionsSilently(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === "granted";
    } catch (error) {
      console.warn(
        "[ReminderController] permission check failed (best-effort):",
        error,
      );
      return false;
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
