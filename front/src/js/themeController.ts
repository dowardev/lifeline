import { useSystemStore } from "@/store/system";
import { Theme } from "@/utils/types";
import { getDB } from "./dbInstance";

export class ThemeController {
  dbc = getDB();

  /**
   * This function retrieves the currently selected theme from the system store.
   *
   * @returns {Theme} The currently selected theme.
   */
  getTheme(): Theme {
    const systemStore = useSystemStore();
    return systemStore.getThemeSelected();
  }

  /**
   * This function applies a new theme to the system.
   *
   * @param {Object} params - The parameters for the function.
   * @param {Theme} params.theme - The new theme to be applied.
   *
   * @returns {void}
   */
  applyTheme(params: { theme: Theme }): void {
    const theme = params.theme;
    const systemStore = useSystemStore();
    const currentTheme = this.getTheme();

    document.getElementsByTagName("body")[0].classList.remove(currentTheme);
    document.getElementsByTagName("body")[0].classList.add(theme);

    systemStore.setThemeSelected({ theme });
  }

  /**
   * This method saves the user's theme preference in the database.
   *
   * @param params - An object containing the theme and user ID.
   * @param params.theme - The theme to be saved. It should be of type Theme.
   * @param params.userID - The ID of the user whose theme preference is to be saved.
   * @returns A Promise that resolves when the theme has been successfully saved.
   */
  async saveTheme(params: { theme: Theme; userID: string }): Promise<void> {
    const { theme, userID } = params;
    await this.dbc.updateData({
      query: `UPDATE users SET theme = ? WHERE id = ${userID}`,
      values: [theme],
    });
  }

  /**
   * This method updates the selected theme in the system store.
   *
   * @param params - An object containing the theme to be updated.
   * @param params.theme - The theme to be set. It should be of type Theme.
   *
   * This method does not return anything.
   */
  updateThemeSelected(params: { theme: Theme }): void {
    const { theme } = params;
    const systemStore = useSystemStore();
    systemStore.setThemeSelected({ theme });
  }
}
