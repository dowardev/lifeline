import { storage } from "@/main";

// interface and types
import { ViewCalendar } from "@/utils/types";

export class CalendarService {
  async setCalendarModeView(params: { mode: ViewCalendar }): Promise<void> {
    const { mode } = params;
    await storage.set("calendarModeView", mode);
  }

  async getCalendarModeView(): Promise<ViewCalendar> {
    return (await storage.get("calendarModeView")) ?? "week";
  }
}
