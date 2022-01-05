<script lang="ts">
import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();

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
  return {
    getTheme,
    setTheme,
    toggleTheme,
  };
}
</script>
