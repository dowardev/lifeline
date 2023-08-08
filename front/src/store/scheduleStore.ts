import { defineStore } from "pinia";
import { Schedule } from "../utils/interfaces";
import { ref, watch } from "vue";
import { storeSchedule } from "@/services/schedule";
import { useSchedule } from "@/composables/useSchedule";

export const useScheduleStore = defineStore("schedule", () => {
  const schedule = ref({} as Schedule);
  const scheduleComposable = useSchedule();

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
