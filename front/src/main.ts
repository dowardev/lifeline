// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

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
import { seedLocalUser } from './db'

async function bootstrap(): Promise<void> {
  await storage.create();

  await cleanupOrphanedPkceKeys()

  const app = createApp(App).use(IonicVue).use(i18n).use(pinia);

  // 1. Always materialize the local anonymous identity BEFORE mount so the app
  // boots into a usable state even with a clean localStorage and no SSO.
  const authStore = useAuthStore();
  const localUser = authStore.ensureLocalUser();
  await seedLocalUser({ user: localUser }).catch((error) => {
    console.warn('local user seed failed; continuing in anonymous mode', error);
  });

  // 2. Optional SSO init with graceful degradation: if missing or unreachable,
  // the app still mounts in anonymous mode.
  const ssoConfigured = Boolean(import.meta.env.VITE_SSO_URL);
  if (ssoConfigured) {
    try {
      const ssoClient = new SSOClient({
        ssoUrl: import.meta.env.VITE_SSO_URL,
        ssoFrontendUrl: import.meta.env.VITE_SSO_FRONTEND_URL,
        clientId: import.meta.env.VITE_SSO_CLIENT_ID,
        apiBaseUrl: import.meta.env.VITE_API_URL,
      });

      setSSOClient(ssoClient);

      await ssoClient.init();

      ssoClient.onAuthStateChange((state) => {
        const store = useAuthStore();
        if (state.isAuthenticated && state.user) {
          store.setFromSso({
            id: Number(state.user.id),
            name: state.user.name || "",
            user: state.user.user || "",
            email: state.user.email || "",
          });
        } else {
          store.clearAuth();
        }
      });

      await syncFromSso({ ssoClient });
    } catch (error) {
      console.warn("SSO initialization failed; running in anonymous mode.", error);
    }
  }

  const themeController = new ThemeController();
  await themeController.loadTheme().catch(() => {
    // theme is cosmetic; never block boot on it
  });

  app.use(router);
  await router.isReady();
  app.mount("#app");
}

async function syncFromSso(params: { ssoClient: InstanceType<typeof SSOClient> }): Promise<void> {
  const { ssoClient } = params;
  if (!ssoClient.isAuthenticated) return;
  const authUser = await ssoClient.getUser();
  if (authUser) {
    useAuthStore().setFromSso({
      id: Number(authUser.id),
      name: authUser.name || "",
      user: authUser.user || "",
      email: authUser.email || "",
    });
  }
}

bootstrap().catch(console.error);
