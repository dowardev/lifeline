<template>
  <ion-app>
    <ion-menu
      contentId="menu-content"
      menuId="firstMenu"
      side="start"
      type="overlay"
    >
      <Menu></Menu>
    </ion-menu>
    <ion-router-outlet Id="menu-content" />
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { defineComponent } from "vue";
import Menu from "./views/menu/Menu.vue";
export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    Menu,
  },
});
</script>
