import { toastController } from "@ionic/vue";
import timeZones from "../assets/files/timezones.json";
import { SystemMessage } from "@/utils/interfaces";
import { Clipboard } from "@capacitor/clipboard";
import { Theme, ViewCalendar, ViewMode } from "@/utils/types";
import axios from "axios";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";
import { storage } from "@/main";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";

import { EventController } from "@/controllers/eventController";
import { ScheduleController } from "@/controllers/scheduleController";

interface WakaTimeDuration {
  data: {
    time: number;
    project: string;
    duration: number;
    color: null;
  }[];
  branches: string[];
  start: string;
  end: string;
  timezone: string;
}

export class SystemService {
  eventController = new EventController();
  scheduleController = new ScheduleController();

  async getTheme(): Promise<Theme> {
    return await storage.get("theme");
  }

  setTheme(params: { theme: Theme; currentTheme: Theme }) {
    const theme = params.theme;
    const currentTheme = params.currentTheme;

    document.getElementsByTagName("body")[0].classList.remove(currentTheme);
    document.getElementsByTagName("body")[0].classList.add(theme);
  }

  async saveTheme(params: { theme: Theme }): Promise<void> {
    const theme = params.theme;
    await storage.set("theme", theme);
  }

  async openToast(params: {
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

  getAllTimeZonesNames() {
    return timeZones;
  }

  //  async  openToastErrror(error: object) {
  //   const toast = await toastController.create({
  //     header: "Ocurrio un error",
  //     message: "¿Quieres reportar el error?",
  //     icon: alertCircleOutline,
  //     position: "bottom",
  //     color: "danger",
  //     buttons: [
  //       {
  //         text: "Reportar",
  //         handler: () => {
  //           openModalFeedback({ error, type: "error" });
  //         },
  //       },
  //       {
  //         icon: closeOutline,
  //         role: "cancel",
  //         handler: () => {
  //           // console.log("Cancel clicked");
  //         },
  //       },
  //     ],
  //   });
  //   await toast.present();
  // }
  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  setLanguage(language: string) {
    document.cookie = `language=${language}`;
  }

  async copyToClipboard(params: { phrase: string }) {
    const phrase = params.phrase;

    await Clipboard.write({
      string: phrase,
    });
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
  async getWakaTimeApiKey(): Promise<string> {
    return await storage.get("wakaTimeApiKey");
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

  graphqlQueryBuilder(params: {
    name: DocumentNode;
    fragment: string;
  }): DocumentNode {
    const { name, fragment } = params;

    const query = gql`
        query GetUse {
          userAuth {
           ...${fragment}
          }
        }
        ${name}
      `;
    return query;
  }

  async deleteData(params: {
    events: boolean;
    schedule: boolean;
    reminders: boolean;
    db: SQLiteDBConnection;
  }): Promise<void> {
    const { events, schedule } = params;
    if (events) await this.eventController.deleteReminders();
    if (events) await this.eventController.deleteEvents();
    if (schedule) await this.scheduleController.deleteSchedule();
  }
}
