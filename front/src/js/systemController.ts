import { useSystemStore } from "@/store/system";
import { Theme, ViewCalendar, ViewMode } from "@/utils/types";
import {
  Days,
  EventReminderNotification,
  EventReminderRepeat,
  Months,
  SystemMessage,
} from "@/utils/interfaces";
import { SQLite } from "@/js/sqlite";
import { cloneDeep } from "lodash";
import { useEventsStore } from "@/store/eventsStore";
import { TokenService } from "@/services/tokenService";
import { DB } from "./db";
import { UserController } from "./userController";
import { EventController } from "@/js/eventController";
import { ScheduleController } from "@/js/scheduleController";
import { storage } from "@/main";
import { toastController } from "@ionic/core";
import axios from "axios";

export class SystemController {
  // store
  systemStore = useSystemStore();
  eventsStore = useEventsStore();
  dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  tokenService = new TokenService();

  async loadThemeSelected() {
    const theme =
      (await this.getTheme2()) != null ? await this.getTheme2() : "light";
    this.systemStore.setThemeSelected({ theme });
  }

  getTheme() {
    return this.systemStore.getThemeSelected();
  }

  applyTheme(params: { theme: Theme }) {
    const theme = params.theme;
    const currentTheme = this.getTheme();
    this.setTheme({ theme, currentTheme });
    this.setThemeSelected({ theme });
  }

  async updateThemeSelected(params: { theme: Theme }) {
    const theme = params.theme;
    await this.saveTheme({ theme });
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
    await storage.set("tasksViewMode", viewMode);
  }

  async getTasksViewMode(): Promise<ViewMode> {
    const viewMode = await storage.get("tasksViewMode");
    if (!viewMode) return "list";
    return viewMode;
  }

  async storeWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
    const { apiKey } = params;
    await storage.set("wakaTimeApiKey", apiKey);
  }

  getWakaTimeApiKey(): string {
    return this.systemStore.getWakaTimeApiKey;
  }

  async testWakaTimeApiKey(params: {
    apiKey: string;
    date: string;
  }): Promise<boolean> {
    const { apiKey, date } = params;
    try {
      const response = await this.getWakaTimeDurations({ apiKey, date });
      if (response) return true;
      else return false;
    } catch (error) {
      throw error;
    }
  }

  async loadWakaTimeApiKey(): Promise<void> {
    const apiKey = await this.getWakaTimeApiKey2();
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
    const response = await this.getWakaTimeDurations({
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
    await this.deleteWakaTimeApiKey();
    this.systemStore.removeWakaTimeApiKey();
  }

  async openToast(params: SystemMessage): Promise<void> {
    const { color = "dark", message } = params;
    (await this.openToast2({ color, message })).present();
  }

  async openToastFixed(params: SystemMessage): Promise<HTMLIonToastElement> {
    const { color = "dark", message } = params;
    return await this.openToast2({ color, message });
  }

  async deleteAllDataSystem(params: {
    events: boolean;
    schedule: boolean;
    reminders: boolean;
    tokens: boolean;
    users: boolean;
  }): Promise<void> {
    const { events, schedule, reminders, tokens, users } = params;
    const userController = new UserController();
    const eventController = new EventController();
    const schedulecontroller = new ScheduleController();

    if (reminders) await eventController.deleteReminders();
    if (events) await eventController.deleteEvents();
    if (schedule) await schedulecontroller.deleteSchedule();
    if (tokens) await this.tokenService.removeAllTokens();
    if (users) await userController.deleteUsers();
  }

  async deleteUserdata(params: { userId: string }): Promise<void> {
    const { userId } = params;
    const userController = new UserController();
    const eventController = new EventController();

    await eventController.deleteUserEvents({ userId });
    await this.tokenService.removeUserToken({ name: "authToken", userId });
    await userController.deleteUser({ userId });
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

  async getTheme2(): Promise<Theme> {
    return await storage.get("theme");
  }

  setTheme(params: { theme: Theme; currentTheme: Theme }): void {
    const theme = params.theme;
    const currentTheme = params.currentTheme;

    document.getElementsByTagName("body")[0].classList.remove(currentTheme);
    document.getElementsByTagName("body")[0].classList.add(theme);
  }

  async saveTheme(params: { theme: Theme }): Promise<void> {
    const theme = params.theme;
    await storage.set("theme", theme);
  }

  async getWakaTimeApiKey2(): Promise<string> {
    return await storage.get("wakaTimeApiKey");
  }

  async getWakaTimeDurations(params: {
    apiKey: string;
    date: string;
  }): Promise<WakaTimeDuration> {
    const { apiKey, date } = params;

    const response = await axios.request({
      url: "http://127.0.0.1:8000/api/wakatime-durations",
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        apiKey: apiKey,
        date,
      },
    });

    try {
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteWakaTimeApiKey(): Promise<void> {
    await storage.remove("wakaTimeApiKey");
  }

  async openToast2(params: {
    message: string;
    color: string;
  }): Promise<HTMLIonToastElement> {
    const { color, message } = params;

    const toast = await toastController.create({
      message,
      duration: 2000,
      color,
      position: "bottom",
    });
    return toast;
  }
}
