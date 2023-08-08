import { toastController } from "@ionic/vue";
import timeZones from "../assets/files/timezones.json";
import { SystemMessage } from "@/utils/interfaces";
import { Clipboard } from "@capacitor/clipboard";
import { Theme, ViewMode } from "@/utils/types";
import axios from "axios";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";
import { useEvent } from "@/composables/useEvent";
import { useSchedule } from "@/composables/useSchedule";
import { storage } from "@/main";

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

export async function getTheme(): Promise<Theme> {
  return await storage.get("theme");
}

export function setTheme(params: { theme: Theme; currentTheme: Theme }) {
  const theme = params.theme;
  const currentTheme = params.currentTheme;

  document.getElementsByTagName("body")[0].classList.remove(currentTheme);
  document.getElementsByTagName("body")[0].classList.add(theme);
}

export async function saveTheme(params: { theme: Theme }): Promise<void> {
  const theme = params.theme;
  await storage.set("theme", theme);
}

export async function openToast(params: {
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

export function getAllTimeZonesNames() {
  return timeZones;
}

// export async function openToastErrror(error: object) {
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
export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function setLanguage(language: string) {
  document.cookie = `language=${language}`;
}

export async function copyToClipboard(params: { phrase: string }) {
  const phrase = params.phrase;

  await Clipboard.write({
    string: phrase,
  });
}

export async function setTasksViewMode(params: { viewMode: ViewMode }) {
  const { viewMode } = params;
  await storage.set("tasksViewMode", viewMode);
}

export async function getTasksViewMode(): Promise<ViewMode> {
  const viewMode = await storage.get("tasksViewMode");
  if (!viewMode) return "list";
  return viewMode;
}

export async function storeWakaTimeApiKey(params: {
  apiKey: string;
}): Promise<void> {
  const { apiKey } = params;
  await storage.set("wakaTimeApiKey", apiKey);
}
export async function getWakaTimeApiKey(): Promise<string> {
  return await storage.get("wakaTimeApiKey");
}

export async function testWakaTimeApiKey(params: {
  apiKey: string;
  date: string;
}): Promise<boolean> {
  const { apiKey, date } = params;

  try {
    const response = await getWakaTimeDurations({ apiKey, date });
    if (response) return true;
    else return false;
  } catch (error) {
    throw error;
  }
}

export async function getWakaTimeDurations(params: {
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

export async function deleteWakaTimeApiKey(): Promise<void> {
  await storage.remove("wakaTimeApiKey");
}

export function graphqlQueryBuilder(params: {
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

export async function deleteData(params: {
  events: boolean;
  schedule: boolean;
}): Promise<void> {
  const { events, schedule } = params;

  if (events) await useEvent().deleteEvents();
  if (schedule) await useSchedule().deleteSchedule();
}
