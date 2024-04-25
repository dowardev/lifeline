import { defineStore } from "pinia";
import { CalendarViewDates } from "@/utils/interfaces";
import { Ref, ref } from "vue";
import { ViewCalendar, CalendarDataStatus } from "@/utils/types";

export const useCalendar = defineStore("calendar", () => {
  const viewDates: Ref<CalendarViewDates> = ref({
    diary: new Date(),
    day: new Date(),
    week: new Date(),
    month: new Date(),
    year: new Date(),
  });
  const calendarModeView: Ref<ViewCalendar> = ref(undefined);
  const dataStatus: Ref<CalendarDataStatus> = ref("loading");

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

  function setDataStatus(params: { status: CalendarDataStatus }): void {
    const { status } = params;
    dataStatus.value = status;
  }

  return {
    calendarModeView,
    dataStatus,
    setDataStatus,
    updateCalendarModeView,
    updateCalendarViewDate,
    updateCalendarViewDates,
    viewDates,
  };
});
