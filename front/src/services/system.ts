import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();
import { toastController } from "@ionic/vue";
import timeZones from "../../public/assets/files/timezones.json";
import { SystemMessage } from "./interfaces";
import { alertCircleOutline } from "ionicons/icons";

export async function getTheme() {
  return await storage.get("darkMode");
}

export async function setTheme(status: boolean | string) {
  await storage.set("darkMode", status);
}
export function toggleTheme(status: boolean) {
  document.body.classList.toggle("dark", status);
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
