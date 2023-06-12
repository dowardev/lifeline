import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();
import { toastController } from "@ionic/vue";
import timeZones from "../assets/files/timezones.json";
import { SystemMessage } from "@/utils/interfaces";
import { Clipboard } from "@capacitor/clipboard";
import { Theme, ViewMode } from "@/utils/types";
import axios from "axios";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";
import { useQuery } from "@vue/apollo-composable";

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

export async function openToast(params: SystemMessage) {
  const color = params.color != undefined ? params.color : "dark";

  const toast = await toastController.create({
    message: params.message,
    duration: 2000,
    color,
    position: "bottom",
  });
  return toast.present();
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
        query GetUser {
          userAuth {
           ...${fragment}
          }
        }
        ${name}
      `;
  return query;
}

export function executeGrapQuery(params: {
  query: any;
  options: { refetch: boolean };
}): Promise<any> {
  const { query, options } = params;
  const { refetch, onResult, onError } = useQuery(query, null, {
    fetchPolicy: "cache-first",
  });

  return new Promise(async (resolve, reject) => {
    try {
      if (options.refetch) await refetch();
    } catch (error) {
      reject(error);
    }

    onResult((response) => resolve(response));

    onError((error) => {
      reject(error);
    });
  });
}
