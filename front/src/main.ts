import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import { IonicVue } from "@ionic/vue";

import "@ionic/vue/css/core.css";
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";
import "./theme/variables.css";

import i18n from "./plugins/i18n/i18n";

import { Storage } from "@ionic/storage";
const storage = new Storage();
export { storage };

import { createPinia } from "pinia";
const pinia = createPinia();
import { db } from "./db";
import { useAuthStore } from "./store/authStore";
import { AuthController } from "./controllers/authController";
import { ThemeController } from "./controllers/themeController";

async function bootstrap(): Promise<void> {
  await storage.create();

  const app = createApp(App).use(IonicVue).use(i18n).use(pinia);

  await loadUser();

  app.use(router);
  await router.isReady();
  app.mount("#app");

  async function loadUser(): Promise<void> {
    const logged = await db.usersLogged.where('user').above('').first();
    if (!logged) return;

    const authStore = useAuthStore();
    authStore.setAuth({
      userData: { id: 0, name: logged.user, user_name: logged.user, email: '' },
      accessToken: logged.token,
    });

    const themeController = new ThemeController();
    await themeController.loadTheme();

    try {
      const authController = new AuthController();
      await authController.loadUser();
    } catch {
      // Offline — keep local state
    }
  }
}

bootstrap().catch(console.error);
