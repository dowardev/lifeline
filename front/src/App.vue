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

// interface
import { Event, Schedule } from "@/utils/interfaces";

import { useDocument } from "@/composables/useDocument";
import { useSchedule } from "@/composables/useSchedule";
import { useSystem } from "@/composables/useSystem";
import { getUserToken } from "./services/user";
import { useUser } from "./composables/useUser";
import { useEvent } from "./composables/useEvent";
import { sync } from "ionicons/icons";
import { updateEvent } from "./services/event";

const route = useRoute();

// mounted
onMounted(() => {
  start();
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
  toast.present();
  try {
    await load();
    toast.dismiss();
  } catch (error) {
    toast.dismiss();
    await useSystem().openToast({ message: "Problema al sincronizar" });
    console.error(error);
  }
};

async function load(): Promise<void> {
  if (navigator.onLine) {
    await syncEvents();
  }
  // load schedule
  // await useSchedule().generateEventsSchedule();

  // load reminders
  const reminders = await useSchedule().generateScheduleReminders();
  await Promise.all(
    reminders.map(async (reminder) => {
      await useSchedule().setReminders({
        id: new Date().getTime(),
        reminder: new Date(reminder.date),
        title: reminder.title,
        message: reminder.message,
      });
    })
  );
  await useSchedule().loadSchedule();
}

function loadUserProps(): void {
  const userToken = getUserToken();
  if (userToken != "") {
    useUser().updateUserLoggedProp(true);
    useUser().updateUserToken(userToken);
  }
}

async function syncEvents(): Promise<void> {
  await useEvent().pushEvents();
  await useEvent().storeEventsServer();
  await removeEvents();
  await updateEvents();
}

async function removeEvents(): Promise<void> {
  const { eventsDeleted } = await useEvent().storeRemoveEventsServer();
  if (eventsDeleted) {
    for (const event of eventsDeleted) {
      let schedule = {} as Schedule;
      schedule = useSchedule().removeElementSchedule({
        id: event.id!,
        schedule,
      });
      await useSchedule().saveSchedule({ schedule });
    }
  }
}

async function updateEvents(): Promise<void> {
  const { eventsUpdated } = await useEvent().storeUpdateEventsServer();
  let schedule = {} as Schedule;
  if (eventsUpdated) {
    for (const event of eventsUpdated) {
      const scheduleElement = useSchedule().generateScheduleElement({
        idElement: event.id!,
        title: event.name!,
        message: event.description,
        startDate: new Date(event.reminders.start),
        endDate: new Date(event.reminders.end),
        type: "Event",
        reminder: event.reminders.notifications!.length > 0 ? true : false,
        repeat: event.reminders.repeat!,
      });

      schedule = useSchedule().removeElementSchedule({
        id: event.id!,
        schedule,
      });
      schedule = useSchedule().generateEventSchedule({
        scheduleElement,
        schedule,
      });
      await useSchedule().saveSchedule({ schedule });
    }
  }
}
</script>
