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
import { TokenController } from "@/js/tokenController";
import { DB } from "./db";
import { UserController } from "./userController";
import { EventController } from "@/js/eventController";
import { ScheduleController } from "@/js/scheduleController";
import { storage } from "@/main";
import axios from "axios";
import { toastController } from "@ionic/vue";

export class SystemController {
  // store
  // systemStore = useSystemStore();
  // eventsStore = useEventsStore();
  dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });

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

  async openToast(params: SystemMessage): Promise<void> {
    const { color = "dark", message } = params;
    try {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: "bottom",
      });

      await toast.present();
    } catch (error) {
      throw error;
    }
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
    const tokenController = new TokenController();

    if (reminders) await eventController.deleteReminders();
    if (events) await eventController.deleteEvents();
    if (schedule) await schedulecontroller.deleteSchedule();
    if (tokens) await tokenController.removeAllTokens();
    if (users) await userController.deleteUsers();
  }

  async deleteUserdata(params: { userId: string }): Promise<void> {
    const { userId } = params;
    const userController = new UserController();
    const eventController = new EventController();
    const tokenController = new TokenController();

    await eventController.deleteUserEvents({ userId });
    await tokenController.removeUserToken({ name: "authToken", userId });
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
