<template>
  <ion-app>
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
import { IonApp, IonRouterOutlet, IonMenu, IonSplitPane } from "@ionic/vue";
import { onMounted } from "vue";
import MenuComponent from "@/components/menu/MenuComponent.vue";
import { setTheme } from "@/services/system";
import { useRoute } from "vue-router";

import { useSystem } from "@/composables/useSystem";
import { getUserToken } from "./services/user";
import { useUser } from "./composables/useUser";
import { useEvent } from "./composables/useEvent";
import { useSchedule } from "./composables/useSchedule";

const route = useRoute();
const userComposable = useUser();
const eventComposable = useEvent();
const systemComposable = useSystem();
const scheduleComposable = useSchedule();

// mounted
onMounted(async () => {
  start();
  await useSystem().createTableTokens();
  await useEvent().createTableEvents();
});

// functions
const start = async (): Promise<void> => {
  loadUserProps();

  // await useDocument().loadUserDocuments();

  await useSystem().loadThemeSelected();
  const theme = useSystem().getTheme();
  setTheme({ theme: theme, currentTheme: theme });
  await useSystem().updateThemeSelected({ theme });

  const toast = await useSystem().openToastFixed({ message: "Sincronizando" });
  if (userComposable.isLogged.value) {
    toast.present();
  }
  try {
    await syncData();
    toast.dismiss();
  } catch (error) {
    toast.dismiss();
    await useSystem().openToast({ message: "Problema al sincronizar" });
    console.error(error);
  }
};

async function syncData(): Promise<void> {
  await deleteData();

  // events
  if (navigator.onLine) {
    await eventComposable.sync();
  }
  await eventComposable.sync();
  await eventComposable.loadEvents();

  // schedule
  const localSchedule = await scheduleComposable.getLocalSchedule();
  const { schedule } = await scheduleComposable.generateSchedules({
    schedule: localSchedule,
  });
  await scheduleComposable.saveScheduleLocal({ schedule });
  await scheduleComposable.loadSchedule();
}

function loadUserProps(): void {
  const userToken = getUserToken();
  if (userToken != "") {
    useUser().updateUserLoggedProp(true);
    useUser().updateUserToken(userToken);
  }
}

async function deleteData(): Promise<void> {
  await systemComposable.deleteData({ events: true, schedule: true });
  // location.reload();
}
</script>
