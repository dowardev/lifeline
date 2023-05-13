import { userSystemStore } from "@/store/system";
import {
  getTheme as getThemeService,
  setTheme as setThemeService,
  saveTheme as saveThemeService,
} from "@/services/system";
import { Theme } from "@/utils/types";
import {
  Days,
  EventReminderNotification,
  EventReminderRepeat,
  Months,
} from "@/utils/interfaces";

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

  return {
    loadThemeSelected,
    getTheme,
    applyTheme,
    updateThemeSelected,
    translateDay,
    translateEventReminderRepeat,
    translateEventReminderNotification,
    translateMonth,
  };
};
