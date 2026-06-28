import { useCalendarStore, type ViewCalendar, type CalendarDataStatus } from "@/store/calendarStore";
import { storage } from "@/main";

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
}
