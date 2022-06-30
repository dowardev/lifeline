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
        <MenuComponent></MenuComponent>
      </ion-menu>
      <ion-router-outlet Id="menu-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { defineComponent } from "vue";
import MenuComponent from "./views/menu/Menu.vue";
import {
  getTheme as getThemeService,
  toggleTheme as toggleThemeService,
} from "./services/system";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    MenuComponent,
  },

  mounted() {
    this.setTheme();
  },

  methods: {
    async setTheme() {
      let isDarkEnabled = await getThemeService();
      if (isDarkEnabled == "automatic") {
        isDarkEnabled = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      }
      toggleThemeService(isDarkEnabled);
    },
  },
});
</script>
