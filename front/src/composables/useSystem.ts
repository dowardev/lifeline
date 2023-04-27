import { userSystemStore } from "@/store/system";
import {
  getTheme as getThemeService,
  setTheme as setThemeService,
  saveTheme as saveThemeService,
} from "@/services/system";
import { Theme } from "@/utils/types";

export const useSystem = () => {
  const systemStore = userSystemStore();

  async function loadThemeSelected() {
    const theme = await getThemeService();
    systemStore.setThemeSelected({ theme });
  }

  function getTheme() {
    return systemStore.getThemeSelected();
  }

  function applyTheme(params: { theme: Theme }) {
    const theme = params.theme;
    systemStore.setThemeSelected({ theme });
    setThemeService({ theme });
  }

  function updateThemeSelected(params: { theme: Theme }) {
    const theme = params.theme;
    saveThemeService({ theme });
  }

  return {
    loadThemeSelected,
    getTheme,
    applyTheme,
    updateThemeSelected,
  };
};
