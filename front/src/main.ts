import { DBService } from "@/services/dbService";
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

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const dbs = new DBService();
    await dbs.init();
    await dbs.dbConnection();
    (await dbs.dbConnection()).open();

    // const apolloProvider = createApolloProvider({
    //   defaultClient: apolloClient,
    // });

    // const app = createApp({
    //   setup() {
    //     provide(DefaultApolloClient, apolloClient);
    //   },
    //
    //   render: () => h(App),
    // })
    //   .use(apolloProvider)
    //   .use(IonicVue)
    //   .use(i18n)
    //   .use(pinia)
    //   .use(router);
    // router.isReady().then(() => {
    //   app.mount("#app");
    // });

    const app = createApp(App).use(IonicVue).use(i18n).use(pinia).use(router);
    router.isReady().then(() => {
      app.mount("#app");
    });
  } catch (err) {
    console.log(`Error: ${err}`);
    throw new Error(`Error: ${err}`);
  }
});
