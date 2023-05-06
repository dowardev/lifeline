import { defineStore } from "pinia";
import { Schedule } from "../utils/interfaces";

interface RreminderState {
  shedule: Schedule;
}

export const useScheduleStore = defineStore("schedule", {
  state: (): RreminderState => ({
    shedule: {},
  }),

  getters: {
    getSchedule(state) {
      return () => {
        return state.shedule;
      };
    },
  },

  actions: {
    setSchedule(params: { schedule: Schedule }) {
      const schedule = params.schedule;

      this.shedule = schedule;
    },
  },
});
