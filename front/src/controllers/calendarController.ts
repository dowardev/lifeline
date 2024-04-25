import { useCalendar } from "@/store/calendarStore";
import { storage } from "@/main";

// services
import { CalendarService } from "@/services/calendar";

// types and interface
import { CalendarViewDates } from "@/utils/interfaces";
import { ViewCalendar, CalendarDataStatus } from "@/utils/types";

export class CalendarController {
  private calendarStore = useCalendar();
  private CalendarService = new CalendarService();

  setCurrentDates(params: { dates: CalendarViewDates }): void {
    const { dates } = params;
    this.calendarStore.updateCalendarViewDates({ dates });
  }

  setCalendarModeView(params: { mode: ViewCalendar }): void {
    const { mode } = params;
    this.calendarStore.updateCalendarModeView({ mode });
  }

  getCurrentDate(params: { mode: ViewCalendar }): Date {
    const { mode } = params;
    return this.calendarStore.viewDates[mode!];
  }

  setCurrentDate(params: { date: Date; mode: ViewCalendar }): void {
    const { date, mode } = params;
    this.calendarStore.updateCalendarViewDate({ date, mode });
  }

  async setCurrentDateStored(params: {
    date: Date;
    mode: ViewCalendar;
  }): Promise<Date> {
    const { date, mode } = params;
    const currentDates =
      JSON.parse(await storage.get("calendarViewDates")) ??
      ({
        diary: new Date(),
        day: new Date(),
        week: new Date(),
        month: new Date(),
        year: new Date(),
      } as CalendarViewDates);

    currentDates[mode!] = date;
    return await storage.set("calendarViewDates", JSON.stringify(currentDates));
  }

  async setStoredCalendarModeView(params: {
    mode: ViewCalendar;
  }): Promise<void> {
    const { mode } = params;
    await this.CalendarService.setCalendarModeView({ mode });
  }

  async getStoredCalendarModeView(): Promise<ViewCalendar> {
    return await this.CalendarService.getCalendarModeView();
  }

  getCalendarModeView(): ViewCalendar {
    return this.calendarStore.calendarModeView;
  }

  getCalendarDataStatus(): CalendarDataStatus {
    return this.calendarStore.dataStatus;
  }

  setCalendarDataStatus(params: { status: CalendarDataStatus }): void {
    const { status } = params;
    this.calendarStore.setDataStatus({ status });
  }
}
