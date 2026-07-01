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

import { SSOClient } from "@tu-org/sso-client";
import { setSSOClient } from "@/ssoClientAccessor";
import { useAuthStore } from "@/store/authStore";
import { ThemeController } from "./controllers/themeController";
import { cleanupOrphanedPkceKeys } from './utils/sessionStorageCleanup'

async function bootstrap(): Promise<void> {
  await storage.create();

  await cleanupOrphanedPkceKeys()

  const app = createApp(App).use(IonicVue).use(i18n).use(pinia);

  const ssoClient = new SSOClient({
    ssoUrl: import.meta.env.VITE_SSO_URL,
    ssoFrontendUrl: import.meta.env.VITE_SSO_FRONTEND_URL,
    clientId: import.meta.env.VITE_SSO_CLIENT_ID,
    apiBaseUrl: import.meta.env.VITE_API_URL,
  });

  setSSOClient(ssoClient);

  await ssoClient.init();

  ssoClient.onAuthStateChange((state) => {
    const authStore = useAuthStore();
    if (state.isAuthenticated && state.user) {
      authStore.setFromSso({
        id: Number(state.user.id),
        name: state.user.name || "",
        user: state.user.user || "",
        email: state.user.email || "",
      });
    } else {
      authStore.clearAuth();
    }
  });

  await loadUser();

  app.use(router);
  await router.isReady();
  app.mount("#app");

  async function loadUser(): Promise<void> {
    if (!ssoClient.isAuthenticated) return;

    const authStore = useAuthStore();
    const authUser = await ssoClient.getUser();
    if (authUser) {
      authStore.setFromSso({
        id: Number(authUser.id),
        name: authUser.name || "",
        user: authUser.user || "",
        email: authUser.email || "",
      });
    }

    const themeController = new ThemeController();
    await themeController.loadTheme();
  }
}

bootstrap().catch(console.error);
