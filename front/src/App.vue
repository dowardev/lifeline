<template>
  <ion-app v-if="componentLoaded" style="margin-bottom: 16px">
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
import { ref } from "vue";
import { endOfMonth, startOfMonth } from "date-fns";

// components
import MenuComponent from "@/components/menu/MenuComponent.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { UserController } from "@/controllers/userController";
import { CalendarController } from "./controllers/calendarController";
const systemController = new SystemController();
const eventController = new EventController();
const userController = new UserController();
const calendarController = new CalendarController();

// services
import { SystemService } from "./services/system";
import { UserService } from "./services/user";

const systemService = new SystemService();
const userService = new UserService();

const componentLoaded = ref(false);

// mounted
onMounted(async () => {
  await systemController.createTableTokens();
  await eventController.createTableEvents();
  await eventController.createTableReminders();

  await systemController.loadThemeSelected();
  const theme = systemController.getTheme();
  // TODO: use composable instead of service
  systemService.setTheme({ theme: theme, currentTheme: theme });
  await systemController.updateThemeSelected({ theme });

  let status = false;
  try {
    await loadUserProps();
    status = true;
  } catch (error: any) {
    console.error(error);
  }
  // await useDocument().loadUserDocuments();

  try {
    if (status) await eventController.syncAction({ message: { show: true } });
  } catch (error: any) {
    console.error(error);
  }

  try {
    // await deleteData();
  } catch (error: any) {
    console.error(error);
  }
  componentLoaded.value = true;
});

// functions
async function loadUserProps(): Promise<void> {
  let userToken = null;
  try {
    userToken = await userController.getUserToken();
    if (!userToken) throw new Error("Token not found");
    userController.updateUserLoggedProp({ isLogged: true });
    userController.updateUserTokenProp(userToken);
  } catch (error: any) {
    throw new Error(error);
  }
}

async function deleteData(): Promise<void> {
  await systemController.deleteData({
    events: true,
    schedule: true,
    reminders: true,
  });
  // location.reload();
}
</script>
