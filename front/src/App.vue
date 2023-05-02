<template>
  <ion-app>
    <ion-split-pane when="md" content-id="menu-content">
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
import { useDocument } from "@/composables/useDocument";
import { useReminders } from "@/composables/useReminders";
import { useSystem } from "@/composables/useSystem";
import { useRoute } from "vue-router";

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

// functions
const start = async () => {
  await useDocument().loadUserDocuments();
  useReminders().loadReminders();

  await useSystem().loadThemeSelected();
  const theme = useSystem().getTheme();
  setTheme({ theme: theme });
};

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
</script>
