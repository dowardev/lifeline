import { useSystemStore } from "@/store/system";
import {
  getTheme as getThemeService,
  setTheme as setThemeService,
  saveTheme as saveThemeService,
  setTasksViewMode as setTasksViewModeService,
  getTasksViewMode as getTasksViewModeService,
  storeWakaTimeApiKey as storeWakaTimeApiKeyService,
  getWakaTimeApiKey as getWakaTimeApiKeyService,
  testWakaTimeApiKey as testWakaTimeApiKeyService,
  getWakaTimeDurations as getWakaTimeDurationsService,
  deleteWakaTimeApiKey as deleteWakaTimeApiKeyService,
  openToast as openToastService,
  deleteData as deleteDataService,
} from "@/services/system";
import { Theme, ViewMode } from "@/utils/types";
import {
  Days,
  EventReminderNotification,
  EventReminderRepeat,
  Months,
  SystemMessage,
} from "@/utils/interfaces";
import {
  createTable as createTableService,
  dbConnection as dbConnectionService,
} from "@/services/dbService";

export const useSystem = () => {
  const systemStore = useSystemStore();

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

  function translateDay(params: { dayName: keyof Days }) {
    const dayName = params.dayName;

    const days: Days = {
      monday: "lunes",
      tuesday: "martes",
      wednesday: "miércoles",
      thursday: "jueves",
      friday: "viernes",
      saturday: "sábado",
      sunday: "domingo",
    };
    return days[dayName];
  }

  function translateEventReminderRepeat(params: {
    typeRepeat: keyof EventReminderRepeat;
  }) {
    const typeRepeat = params.typeRepeat;

    const typesRepeat: EventReminderRepeat = {
      unique: "unico",
      daily: "diario",
      weekly: "semanal",
      monthly: "mensual",
      annually: "anual",
    };
    return typesRepeat[typeRepeat];
  }

  function translateEventReminderNotification(params: {
    notificationName: keyof EventReminderNotification;
  }) {
    const notificationName = params.notificationName;

    const notificationsName: EventReminderNotification = {
      just: "A tiempo",
      "5mb": "5 minutos antes",
      "10mb": "10 minutos antes",
      "15mb": "15 minutos antes",
      "30mb": "30 minutos antes",
      "1hb": "1 hora antes",
      "2hb": "2 hora antes",
      "1db": "1 dia antes",
      "2db": "2 dia antes",
      "1wb": "1 semana antes",
      "1mtb": "1 mes antes",
    };
    return notificationsName[notificationName];
  }

  function translateMonth(params: { monthName: keyof Months }) {
    const monthName = params.monthName;

    const months: Months = {
      january: "enero",
      february: "febrero",
      march: "marzo",
      april: "abril",
      may: "mayo",
      june: "junio",
      july: "julio",
      august: "agosto",
      september: "septiembre",
      october: "octubre",
      november: "noviembre",
      december: "diciembre",
    };
    return months[monthName];
  }

  async function setTasksViewMode(params: { viewMode: ViewMode }) {
    const { viewMode } = params;
    await setTasksViewModeService({ viewMode });
  }

  async function getTasksViewMode(): Promise<ViewMode> {
    return await getTasksViewModeService();
  }

  async function storeWakaTimeApiKey(params: {
    apiKey: string;
  }): Promise<void> {
    const { apiKey } = params;
    await storeWakaTimeApiKeyService({ apiKey });
  }

  function getWakaTimeApiKey(): string {
    return systemStore.getWakaTimeApiKey;
  }

  async function testWakaTimeApiKey(params: {
    apiKey: string;
    date: string;
  }): Promise<boolean> {
    const { apiKey, date } = params;
    return await testWakaTimeApiKeyService({ apiKey, date });
  }

  async function loadWakaTimeApiKey(): Promise<void> {
    const apiKey = await getWakaTimeApiKeyService();
    systemStore.setWakaTimeApiKey({ apiKey });
  }

  async function loadWakaTimeToday(params: { apiKey: string }) {
    // const { apiKey } = params;
    // const response = await getWakaTimeDurations({ apiKey });
    // console.log(response);
  }

  async function getWakaTimeDayTotal(params: {
    apiKey: string;
    date: string;
  }): Promise<number> {
    const { apiKey, date } = params;
    const response = await getWakaTimeDurationsService({ apiKey, date });
    let sum = 0;
    response.data.forEach((element) => {
      sum += element.duration;
    });
    return sum;
  }

  async function clearWakaTimeApiKey(): Promise<void> {
    await deleteWakaTimeApiKeyService();
    systemStore.removeWakaTimeApiKey();
  }

  async function openToast(params: SystemMessage): Promise<void> {
    const { color = "dark", message } = params;
    (await openToastService({ color, message })).present();
  }

  async function openToastFixed(
    params: SystemMessage
  ): Promise<HTMLIonToastElement> {
    const { color = "dark", message } = params;
    return await openToastService({ color, message });
  }

  async function deleteData(params: {
    events: boolean;
    schedule: boolean;
  }): Promise<void> {
    const { events, schedule } = params;
    const db = await dbConnectionService();
    await db.open();
    await deleteDataService({ events, schedule, db });
    await db.close();
  }

  async function createTableTokens(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS Tokens
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      token TEXT
    );`;
    await createTable({ query });
  }

  async function createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await dbConnectionService();
      await db.open();
      await createTableService({ query, db });
      await db.close();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  return {
    applyTheme,
    clearWakaTimeApiKey,
    createTableTokens,
    deleteData,
    getTasksViewMode,
    getTheme,
    getWakaTimeApiKey,
    getWakaTimeDayTotal,
    loadThemeSelected,
    loadWakaTimeApiKey,
    loadWakaTimeToday,
    openToast,
    openToastFixed,
    setTasksViewMode,
    storeWakaTimeApiKey,
    testWakaTimeApiKey,
    translateDay,
    translateEventReminderNotification,
    translateEventReminderRepeat,
    translateMonth,
    updateThemeSelected,
  };
};
