import { defineStore } from "pinia";
import { Schedule } from "../utils/interfaces";
import { ref, watch } from "vue";

export const useScheduleStore = defineStore("schedule", () => {
  const schedule = ref({} as Schedule);

  function getSchedule(): any {
    return schedule.value;
  }

  function setSchedule(params: { schedule: Schedule }): void {
    const { schedule: scheduleData } = params;
    schedule.value = scheduleData;
  }

  // watch(
  //   () => schedule.value,
  //   async (newValue, oldValue) => {
  //     await scheduleComposable.saveSchedule({ schedule: newValue });
  //   },
  //   { deep: true },
  // );

  return { schedule, getSchedule, setSchedule };
});
