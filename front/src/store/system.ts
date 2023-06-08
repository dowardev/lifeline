import { defineStore } from "pinia";
import { System } from "../utils/interfaces";
import { Theme } from "@/utils/types";

interface SystemState {
  system: System;
}

export const useSystemStore = defineStore("system", {
  state: (): SystemState => ({
    system: {
      theme: { selected: "light" },
      wakaTime: { wakaTimeApiKey: "", today: { time: "" } },
    },
  }),

  getters: {
    getThemeSelected(state) {
      return () => {
        return state.system.theme.selected;
      };
    },

    getWakaTimeApiKey(state): string {
      return state.system.wakaTime.wakaTimeApiKey;
    },

    getWakaTimeToday(state) {
      return state.system.wakaTime.today.time;
    },
  },

  actions: {
    setThemeSelected(params: { theme: Theme }) {
      const theme = params.theme;
      this.system.theme.selected = theme;
    },

    setWakaTimeApiKey(params: { apiKey: string }) {
      const { apiKey: apikey } = params;
      this.system.wakaTime.wakaTimeApiKey = apikey;
    },

    setWakaTimeTodayTime(params: { time: string }) {
      const { time } = params;
      this.system.wakaTime.today.time = time;
    },

    removeWakaTimeApiKey() {
      this.system.wakaTime.wakaTimeApiKey = "";
    },
  },
});
