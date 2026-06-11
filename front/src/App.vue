<template>
  <ion-app style="margin-bottom: 16px">
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
import messages from "./utils/messages.json";
import { endOfMonth, startOfMonth } from "date-fns";

// components
import MenuComponent from "@/components/menu/MenuComponent.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { AuthController } from "@/controllers/authController";
import { CalendarController } from "@/controllers/calendarController";
const systemController = new SystemController();
const eventController = new EventController();
const userController = new AuthController();
const calendarController = new CalendarController();

// const componentLoaded = ref(false);

// mounted
onMounted(async () => {
  // sync calendar
  try {
    await systemController.openToast({
      message: messages.syncStart,
    });

    const userController = new AuthController();
    await userController.loadUser();

    await systemController.openToast({
      message: messages.syncEnd,
    });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: messages.syncError,
    });
  }

  try {
    // await deleteData();
  } catch (error: any) {
    console.error(error);
  }
});

// functions
</script>
