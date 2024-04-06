import { defineStore } from "pinia";
import { CalendarViewDates } from "@/utils/interfaces";
import { Ref, ref } from "vue";
import { ViewCalendar } from "@/utils/types";

export const useCalendar = defineStore("calendar", () => {
  const viewDates: Ref<CalendarViewDates> = ref({
    diary: new Date(),
    day: new Date(),
    week: new Date(),
    month: new Date(),
    year: new Date(),
  });
  const calendarModeView: Ref<ViewCalendar> = ref(undefined);

  function updateCalendarViewDate(params: {
    date: Date;
    mode: ViewCalendar;
  }): void {
    const { date, mode } = params;
    viewDates.value[mode!] = date;
  }

  function updateCalendarViewDates(params: { dates: CalendarViewDates }): void {
    const { dates } = params;
    viewDates.value = dates;
  }

  function updateCalendarModeView(params: { mode: ViewCalendar }): void {
    const { mode } = params;
    calendarModeView.value = mode;
  }

  return {
    viewDates,
    calendarModeView,
    updateCalendarViewDate,
    updateCalendarViewDates,
    updateCalendarModeView,
  };
});
