<template>
  <ion-app v-if="componentLoaded">
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

// components
import MenuComponent from "@/components/menu/MenuComponent.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { UserController } from "@/controllers/userController";
const systemController = new SystemController();
const eventController = new EventController();
const userController = new UserController();

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
  await start();
  componentLoaded.value = true;
});

// functions
const start = async (): Promise<void> => {
  loadUserProps();

  // await useDocument().loadUserDocuments();

  await systemController.loadThemeSelected();
  const theme = systemController.getTheme();
  // TODO: use composable instead of service
  systemService.setTheme({ theme: theme, currentTheme: theme });
  await systemController.updateThemeSelected({ theme });

  try {
    // await deleteData();
  } catch (error: any) {
    console.error(error);
  }
};

function loadUserProps(): void {
  const userToken = userService.getUserToken();
  if (userToken != "") {
    userController.updateUserLoggedProp(true);
    userController.updateUserTokenProp(userToken);
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
