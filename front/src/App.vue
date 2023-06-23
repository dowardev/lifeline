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
import { Event } from "@/utils/interfaces";

import { useDocument } from "@/composables/useDocument";
import { useSchedule } from "@/composables/useSchedule";
import { useSystem } from "@/composables/useSystem";
import { getUserToken } from "./services/user";
import { useUser } from "./composables/useUser";
import { useEvent } from "./composables/useEvent";

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
  }
};

async function load(): Promise<void> {
  if (navigator.onLine) {
    const events = (await useEvent().getStoredEvents()) ?? [];
    await pushEvents({ events });
    await Promise.all(
      events.map(async (event) => {
        try {
          await useEvent().updateEvent({ event });
        } catch (error) {
          console.error(error);
        }
      })
    );
    await storeEventsServer();
  }
  // load schedule
  await useSchedule().generateEventsSchedule();

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

async function pushEvents(params: { events: Event[] }): Promise<void> {
  const { events } = params;
  await useEvent().pushEvents({ events });
}

async function storeEventsServer(): Promise<void> {
  const events = (await useEvent().getEventsServer()) ?? [];
  await useEvent().storeEventsServer({ events });
  const eventsRemoved = await useEvent().checkEventRemoved({ events });
  for (const event of eventsRemoved) {
    await useEvent().deleteEvent({ eventId: event.id! });
  }
}
</script>
