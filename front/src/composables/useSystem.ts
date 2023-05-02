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
    const theme =
      (await getThemeService()) != null ? await getThemeService() : "light";
    systemStore.setThemeSelected({ theme });
  }

  function getTheme() {
    return systemStore.getThemeSelected();
  }

  function applyTheme(params: { theme: Theme }) {
    const theme = params.theme;
    const currentTheme = getTheme();
    setThemeService({ theme, currentTheme });
    systemStore.setThemeSelected({ theme });
  }

  async function updateThemeSelected(params: { theme: Theme }) {
    const theme = params.theme;
    await saveThemeService({ theme });
  }

  return {
    loadThemeSelected,
    getTheme,
    applyTheme,
    updateThemeSelected,
  };
};
