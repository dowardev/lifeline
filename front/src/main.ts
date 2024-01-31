import { dbConnection as dbConnectionService } from "@/services/dbService";
const db = await dbConnectionService();
import { useSystem } from "./composables/useSystem";
import { useEvent } from "./composables/useEvent";

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
import apolloClient from "./Apollo";
import { provide, h } from "vue";
import { DefaultApolloClient } from "@vue/apollo-composable";

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

const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },
  render: () => h(App),
})
  .use(IonicVue)
  .use(i18n)
  .use(pinia)
  .use(router);

router.isReady().then(() => {
  app.mount("#app");
});

if ((await db.isDBOpen()).result) {
  await useSystem().createTableTokens();
  await useEvent().createTableEvents();
  await useEvent().createTableReminders();
}
