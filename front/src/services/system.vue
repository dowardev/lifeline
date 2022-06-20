<script lang="ts">
import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();
import { toastController } from "@ionic/vue";
import timeZones from "../../public/assets/files/timezones.json";
import { SystemMessage } from "./interfaces.vue";

export default function () {
  async function getTheme() {
    return await storage.get("darkMode");
  }
  async function setTheme(status: boolean | string) {
    await storage.set("darkMode", status);
  }
  function toggleTheme(status: boolean) {
    document.body.classList.toggle("dark", status);
  }
  async function openToast(params: SystemMessage) {
    const color = params.color != undefined ? params.color : "dark";

    const toast = await toastController.create({
      message: params.message,
      duration: 2000,
      color,
      position: "bottom",
    });
    return toast.present();
  }

  function getAllTimeZonesNames() {
    return timeZones;
  }
  return {
    getTheme,
    setTheme,
    toggleTheme,
    openToast,
    getAllTimeZonesNames,
  };
}
</script>
