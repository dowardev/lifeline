import { SQLite } from "@/js/sqlite";
import { JeepSqlite } from "jeep-sqlite/dist/components/jeep-sqlite";
customElements.define("jeep-sqlite", JeepSqlite);

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import { IonicVue } from "@ionic/vue";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables */
import "./theme/variables.css";

// apollo
// import apolloClient from "./Apollo";

// i18n
import i18n from "./plugins/i18n/i18n";

// ionic storage
import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();
export { storage };

// pinia
import { createPinia } from "pinia";
const pinia = createPinia();
// import { createApolloProvider } from "@vue/apollo-option";
import { DB } from "./js/db";
import { TempController } from "./js/TempController";
import { UserFactory } from "./js/factory/UserFactory";
import { useUserStore } from "./store/userStore";
import { useEventsStore } from "./store/eventsStore";
import { UserController } from "./js/userController";
import { TokenController } from "./js/tokenController";
import { useSystemStore } from "./store/system";
import { SystemController } from "./js/systemController";
import { ThemeController } from "./js/themeController";
import { User, UserStore } from "./utils/interfaces";

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const app = createApp(App).use(IonicVue).use(i18n).use(pinia);

    const dbc = new DB({
      dbSystem: new SQLite({ dbName: "db_vite" }),
    });
    await dbc.initDB();
    const tmpc = new TempController();
    await tmpc.createTableUsers();
    await tmpc.createTableUsersLogged();
    await tmpc.createTableTokens();
    await tmpc.createTableEvents();
    await tmpc.createTableReminders();

    await loadUser();

    app.use(router);
    router.isReady().then(() => {
      app.mount("#app");
    });
  } catch (err) {
    console.error(err);
  }

  async function loadUser(): Promise<void> {
    const userController = new UserController();
    const user: User | undefined = undefined;

    try {
      const user = await userController.getUserLoggedStored({
        sourceData: "both",
      });

      // update user props
      const userStore = useUserStore();
      userStore.updateUserProps({
        user: {
          id: user.id,
          idSync: user.idSync!,
          name: user.name!,
          userName: user.userName!,
          isAdmin: user.isAdmin,
          rol: user.rol,
          imageProfile: user.imageProfile,
          preferences: { theme: user.preferences!.theme },
        },
      });

      // events
      const eventStore = useEventsStore();
      eventStore.setEvents({ events: user.events ?? [] });
    } catch (error) {
      console.log("user no logged in");
    }

    // userTheme
    const themeController = new ThemeController();
    const userTheme =
      Object.keys(user ?? {}).length == 0 ? "light" : user!.preferences!.theme;
    themeController.applyTheme({
      theme: userTheme,
    });
    themeController.updateThemeSelected({
      theme: userTheme,
    });
  }
});
