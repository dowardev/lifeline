// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { useCalendarStore, type ViewCalendar, type CalendarDataStatus, type CalendarItem } from "@/store/calendarStore";
import { calendarService } from "@/services/calendarService";
import { storage } from "@/main";

/**
 * LBDS-231 - CalendarController is intentionally NOT migrated to the
 * `createRepository` pattern. The "calendar" entity in this app is not a
 * server-side resource users create and edit (calendars live on the user
 * record and are managed server-side). What this controller actually owns
 * is UI state for the calendar surface: the current view mode, the
 * current date, and a coarse upload/download status flag. None of those
 * need an outbox or an offline Dexie mirror - they are derived locally
 * and persisted to `storage` (Ionic Storage) for reload resilience.
 *
 * Events that belong to a calendar are handled by `EventController`,
 * which IS on the offline-first path.
 */
export class CalendarController {
  private get store(): ReturnType<typeof useCalendarStore> {
    return useCalendarStore()
  }

  setCurrentDates(params: { dates: { day: Date } }): void {
    const { dates } = params;
    const viewDates = {
      date: dates.day?.toISOString?.() ?? "",
      day: dates.day?.getDate?.() ?? 0,
      month: (dates.day?.getMonth?.() ?? 0) + 1,
      year: dates.day?.getFullYear?.() ?? 0,
    };
    this.store.setViewDates({ viewDates });
  }

  setCalendarModeView(params: { mode: ViewCalendar }): void {
    const { mode } = params;
    this.store.setCalendarModeView({ mode });
    storage.set("calendarModeView", mode);
  }

  getCurrentDate(_params: { mode: ViewCalendar }): Date {
    const dateStr = this.store.viewDates.date;
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  setCurrentDate(params: { date: Date; mode: ViewCalendar }): void {
    const { date } = params;
    if (isNaN(date.getTime())) return;
    const currentViewDates = this.store.viewDates;
    this.store.setViewDates({
      viewDates: {
        ...currentViewDates,
        date: date.toISOString(),
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      },
    });
  }

  async setCurrentDateStored(params: {
    date: Date;
    mode: ViewCalendar;
  }): Promise<Date> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { date, mode } = params;
      const currentDates =
        JSON.parse(await storage.get("calendarViewDates")) ??
        ({
          diary: new Date(),
          day: new Date(),
          week: new Date(),
        });

      currentDates[mode!] = date;
      return await storage.set("calendarViewDates", JSON.stringify(currentDates));
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async setStoredCalendarModeView(params: {
    mode: ViewCalendar;
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { mode } = params;
      await storage.set("calendarModeView", mode);
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async getStoredCalendarModeView(): Promise<ViewCalendar> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      return (await storage.get("calendarModeView")) ?? "day";
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  getCalendarModeView(): ViewCalendar {
    return this.store.calendarModeView;
  }

  getViewDates(): object {
    return this.store.viewDates
  }

  getCalendarDataStatus(): CalendarDataStatus {
    return this.store.dataStatus;
  }

  setCalendarDataStatus(params: { status: CalendarDataStatus }): void {
    const { status } = params;
    this.store.setDataStatus({ dataStatus: status });
  }

  /**
   * LBDS-298 - fetches the user's calendar list (id, name, default) from
   * `GET /api/v1/calendars` and populates the store. Components that need
   * the list (event create/update picker) call this once on enter and
   * then read `store.calendars` / `store.defaultCalendar` reactively.
   *
   * The endpoint already filters to `auth()->id()` server-side, so the
   * returned list never crosses user boundaries even if the caller's
   * token is wrong.
   */
  async getCalendars(): Promise<CalendarItem[]> {
    return await this.store.getCalendars();
  }

  getCalendarList(): CalendarItem[] {
    return this.store.calendars;
  }

  /**
   * LBDS-298 - the calendar flagged `default: 1` on the server, or
   * the first row if none is flagged. `null` when the user has zero
   * calendars. The picker uses this on create to pre-select a row.
   */
  getDefaultCalendar(): CalendarItem | null {
    return this.store.defaultCalendar;
  }

  /**
   * LBDS-292 - creates a calendar owned by the account. The new calendar
   * is never the default: the protected default is provisioned by the
   * server and cannot be replaced.
   */
  async createCalendar(params: { name: string }): Promise<CalendarItem[]> {
    await calendarService.createCalendar({ name: params.name });
    return await this.store.getCalendars();
  }

  /**
   * LBDS-292 - renames a calendar the user created. The server rejects
   * the request with 403 for the protected default calendar.
   */
  async renameCalendar(params: { id: number; name: string }): Promise<CalendarItem[]> {
    await calendarService.updateCalendar({ id: params.id, name: params.name });
    return await this.store.getCalendars();
  }

  /**
   * LBDS-292 - deletes a calendar the user created, with one of the two
   * strategies the API expresses: the events are destroyed with the
   * calendar, or they are moved to another local calendar first.
   */
  async deleteCalendar(params: {
    id: number;
    strategy: "delete_events" | "move";
    destinationCalendarId?: number;
  }): Promise<CalendarItem[]> {
    await calendarService.deleteCalendar({
      id: params.id,
      strategy: params.strategy,
      destinationCalendarId: params.destinationCalendarId,
    });
    return await this.store.getCalendars();
  }
}
