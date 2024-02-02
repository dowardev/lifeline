<template>
  <ion-app v-if="dbOpen">
    <ion-split-pane when="lg" content-id="menu-content">
      <ion-menu
        content-id="menu-content"
        menu-id="mainMenu"
        side="start"
        type="overlay"
        style="--side-max-width: 200px; border-right-width: 0px"
      >
        <MenuComponent></MenuComponent>
      </ion-menu>
      <ion-router-outlet id="menu-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonSplitPane,
  toastController,
} from "@ionic/vue";
import { onMounted } from "vue";
import MenuComponent from "@/components/menu/MenuComponent.vue";
import { setTheme } from "@/services/system";
import { useRoute } from "vue-router";
import { ref } from "vue";

import { useSystem } from "@/composables/useSystem";
import { getUserToken } from "./services/user";
import { useUser } from "./composables/useUser";
import { useEvent } from "./composables/useEvent";
import { useSchedule } from "./composables/useSchedule";

import { dbConnection as dbConnectionService } from "@/services/dbService";

const route = useRoute();
const userComposable = useUser();
const eventComposable = useEvent();
const systemComposable = useSystem();
const scheduleComposable = useSchedule();
const dbOpen = ref(false);

// mounted
onMounted(async () => {
  const db = await dbConnectionService();
  // await useSystem().createTableTokens();
  // await useEvent().createTableEvents();
  // await useEvent().createTableReminders();
  await start();
  dbOpen.value = (await db.isDBOpen()).result == undefined ? false : true;
});

// functions
const start = async (): Promise<void> => {
  loadUserProps();

  // await useDocument().loadUserDocuments();

  await useSystem().loadThemeSelected();
  const theme = useSystem().getTheme();
  setTheme({ theme: theme, currentTheme: theme });
  await useSystem().updateThemeSelected({ theme });

  try {
    // await deleteData();
  } catch (error: any) {
    console.error(error);
  }
};

function loadUserProps(): void {
  const userToken = getUserToken();
  if (userToken != "") {
    useUser().updateUserLoggedProp(true);
    useUser().updateUserToken(userToken);
  }
}

async function deleteData(): Promise<void> {
  await systemComposable.deleteData({
    events: true,
    schedule: true,
    reminders: true,
  });
  // location.reload();
}
</script>
