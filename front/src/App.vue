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
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonSplitPane,
  isPlatform,
} from "@ionic/vue";
import { nextTick, onMounted, watch } from "vue";
import MenuComponent from "@/components/menu/MenuComponent.vue";
import { setTheme } from "@/services/system";
import { useRoute } from "vue-router";

import { useDocument } from "@/composables/useDocument";
import { useSchedule } from "@/composables/useSchedule";
import { useSystem } from "@/composables/useSystem";

const route = useRoute();

if (isPlatform("desktop")) {
  watch(route, (newValue, oldValue) => {
    nextTick(() => {
      const elementos = document.querySelectorAll(".split-pane-main .ion-page");

      elementos.forEach(function (elemento) {
        elemento.classList.add("component-container");
      });
    });
  });
}

// mounted
onMounted(() => {
  start();
  if (isPlatform("desktop")) {
    nextTick(() => {
      const elementos = document.querySelectorAll(".split-pane-main .ion-page");

      elementos.forEach(function (elemento) {
        elemento.classList.add("component-container");
      });
    });
  }
});

// functions
const start = async () => {
  await useDocument().loadUserDocuments();

  await useSystem().loadThemeSelected();
  const theme = useSystem().getTheme();
  setTheme({ theme: theme, currentTheme: theme });
  await useSystem().updateThemeSelected({ theme });

  // const schedule = useSchedule().getSchedule();
  // if (!schedule) await useSchedule().generateEventsSchedule();
  await useSchedule().generateEventsSchedule()
  await useSchedule().loadSchedule();
};
</script>
