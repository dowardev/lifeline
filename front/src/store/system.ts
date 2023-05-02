import { defineStore } from "pinia";
import { System } from "../utils/interfaces";
import { Theme } from "@/utils/types";

interface SystemState {
  system: System;
}

export const userSystemStore = defineStore("system", {
  state: (): SystemState => ({
    system: { theme: { selected: "light" } },
  }),

  getters: {
    getThemeSelected(state) {
      return () => {
        return state.system.theme.selected;
      };
    },
  },

  actions: {
    setThemeSelected(params: { theme: Theme }) {
      const theme = params.theme;
      this.system.theme.selected = theme;
    },
  },
});
