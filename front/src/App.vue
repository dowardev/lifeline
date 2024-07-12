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

// components
import MenuComponent from "@/components/menu/MenuComponent.vue";

// controllers
import { SystemController } from "@/js/systemController";
import { EventController } from "@/js/eventController";
import { UserController } from "@/js/userController";
const systemController = new SystemController();
const eventController = new EventController();
const userController = new UserController();

const componentLoaded = ref(false);

// mounted
onMounted(async () => {
  await systemController.loadThemeSelected();
  const theme = systemController.getTheme();
  // TODO: use composable instead of service
  systemController.setTheme({ theme: theme, currentTheme: theme });
  await systemController.updateThemeSelected({ theme });

  let user = userController.getUserLogged();
  user = user == null ? {} : userController.getUserLogged();
  if (Object.keys(user).length > 0) {
    try {
    } catch (error: any) {
      console.error(error.message);
    }
    // await useDocument().loadUserDocuments();

    try {
      // await eventController.syncAction({ message: { show: true } });
    } catch (error: any) {
      console.error(error.message);
    }
  }

  try {
    // await deleteData();
  } catch (error: any) {
    console.error(error);
  }
  componentLoaded.value = true;
});

// functions
async function deleteData(): Promise<void> {
  await systemController.deleteAllDataSystem({
    events: true,
    schedule: true,
    reminders: true,
    tokens: true,
    users: true,
  });
  // location.reload();
}
</script>
