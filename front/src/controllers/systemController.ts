import { useSystemStore } from "@/store/system";
import { Theme, ViewCalendar, ViewMode } from "@/utils/types";
import {
  Days,
  EventReminderNotification,
  EventReminderRepeat,
  Months,
  SystemMessage,
} from "@/utils/interfaces";
import { DBService } from "@/services/dbService";
import { SystemService } from "@/services/system";
import { cloneDeep } from "lodash";
import { useEventsStore } from "@/store/eventsStore";
import { UserService } from "@/services/user";
import { EventService } from "@/services/event";
import { TokenService } from "@/services/tokenService";
import { ScheduleService } from "@/services/schedule";
import { DBCOntroller } from "./DBController";

export class SystemController {
  // store
  systemStore = useSystemStore();
  eventsStore = useEventsStore();
  // services
  dbc = new DBCOntroller({
    dbService: new DBService({ dbName: "db_vite" }),
  });
  systemService = new SystemService();
  userService = new UserService();
  eventService = new EventService();
  tokenService = new TokenService();
  scheduleService = new ScheduleService();

  async loadThemeSelected() {
    const theme =
      (await this.systemService.getTheme()) != null
        ? await this.systemService.getTheme()
        : "light";
    this.systemStore.setThemeSelected({ theme });
  }

  getTheme() {
    return this.systemStore.getThemeSelected();
  }

  applyTheme(params: { theme: Theme }) {
    const theme = params.theme;
    const currentTheme = this.getTheme();
    this.systemService.setTheme({ theme, currentTheme });
    this.systemStore.setThemeSelected({ theme });
  }

  async updateThemeSelected(params: { theme: Theme }) {
    const theme = params.theme;
    await this.systemService.saveTheme({ theme });
  }

  translateDay(params: { dayName: keyof Days }) {
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

  translateEventReminderRepeat(params: {
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

  translateEventReminderNotification(params: {
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

  translateMonth(params: { monthName: keyof Months }) {
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

  async setTasksViewMode(params: { viewMode: ViewMode }) {
    const { viewMode } = params;
    await this.systemService.setTasksViewMode({ viewMode });
  }

  async getTasksViewMode(): Promise<ViewMode> {
    return await this.systemService.getTasksViewMode();
  }

  async storeWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
    const { apiKey } = params;
    await this.systemService.storeWakaTimeApiKey({ apiKey });
  }

  getWakaTimeApiKey(): string {
    return this.systemStore.getWakaTimeApiKey;
  }

  async testWakaTimeApiKey(params: {
    apiKey: string;
    date: string;
  }): Promise<boolean> {
    const { apiKey, date } = params;
    return await this.systemService.testWakaTimeApiKey({ apiKey, date });
  }

  async loadWakaTimeApiKey(): Promise<void> {
    const apiKey = await this.systemService.getWakaTimeApiKey();
    this.systemStore.setWakaTimeApiKey({ apiKey });
  }

  async loadWakaTimeToday(params: { apiKey: string }) {
    // const { apiKey } = params;
    // const response = await getWakaTimeDurations({ apiKey });
    // console.log(response);
  }

  async getWakaTimeDayTotal(params: {
    apiKey: string;
    date: string;
  }): Promise<number> {
    const { apiKey, date } = params;
    const response = await this.systemService.getWakaTimeDurations({
      apiKey,
      date,
    });
    let sum = 0;
    response.data.forEach((element) => {
      sum += element.duration;
    });
    return sum;
  }

  async clearWakaTimeApiKey(): Promise<void> {
    await this.systemService.deleteWakaTimeApiKey();
    this.systemStore.removeWakaTimeApiKey();
  }

  async openToast(params: SystemMessage): Promise<void> {
    const { color = "dark", message } = params;
    (await this.systemService.openToast({ color, message })).present();
  }

  async openToastFixed(params: SystemMessage): Promise<HTMLIonToastElement> {
    const { color = "dark", message } = params;
    return await this.systemService.openToast({ color, message });
  }

  async deleteAllDataSystem(params: {
    events: boolean;
    schedule: boolean;
    reminders: boolean;
    tokens: boolean;
    users: boolean;
  }): Promise<void> {
    const { events, schedule, reminders, tokens, users } = params;
    if (reminders) await this.eventService.deleteReminders();
    if (events) await this.eventService.deleteEvents();
    if (schedule) await this.scheduleService.deleteSchedule();
    if (tokens) await this.tokenService.removeTokens();
    if (users) await this.userService.deleteUsers();
  }

  async deleteUserdata(params: { userId: string }): Promise<void> {
    const { userId } = params;
    await this.eventService.deleteUserEvents({ userId });
    await this.tokenService.removeToken({ name: "authToken", userId });
    await this.userService.deleteUser({ userId });
  }

  // async createTableTokens(): Promise<void> {
  //   const query = `CREATE TABLE IF NOT EXISTS Tokens
  //   (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT,
  //     token TEXT,
  //     user_id INTEGER REFERENCES Users(id)
  //   );`;
  //   await this.dbc.createTable({ query });
  // }

  cloneObjet(params: { obj: any }): any {
    const { obj } = params;
    return cloneDeep(obj);
  }

  // async createTableUsersLogged(): Promise<void> {
  //   const query = `CREATE TABLE IF NOT EXISTS users_logged
  //   (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     user_id INTEGER REFERENCES users(id),
  //     status INTEGER
  //   );`;
  //   await this.dbc.createTable({ query });
  // }

  // TODO: move to controller
  async insertUserLogged(params: { userId: string }): Promise<void> {
    const { userId } = params;
    const values = [userId, 1];
    const fields = ["user_id", "status"];
    await this.dbc.insertData({ tableName: "users_logged", values, fields });
    await this.dbc.getData({ query: "SELECT * FROM users_logged" });
  }
}
