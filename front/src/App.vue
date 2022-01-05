<template>
  <ion-app>
    <ion-split-pane when="md" contentId="menu-content">
      <ion-menu
        contentId="menu-content"
        menuId="firstMenu"
        side="start"
        type="overlay"
        style="--side-max-width: 200px"
      >
        <Menu></Menu>
      </ion-menu>
      <ion-router-outlet Id="menu-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { defineComponent } from "vue";
import Menu from "./views/menu/Menu.vue";
import systemService from "./services/system.vue";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    Menu,
  },
  mounted() {
    this.setTheme();
  },
  methods: {
    async setTheme() {
      let isDarkEnabled = await systemService().getTheme();
      if (isDarkEnabled == "automatic") {
        isDarkEnabled = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      }
      systemService().toggleTheme(isDarkEnabled);
    },
  },
});
</script>
