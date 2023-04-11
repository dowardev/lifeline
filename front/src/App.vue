<template>
  <ion-app>
    <ion-split-pane when="md" content-id="menu-content">
      <ion-menu
        contenta-id="menu-content"
        menu-id="firstMenu"
        side="start"
        type="overlay"
        style="--side-max-width: 200px"
      >
        <MenuComponent></MenuComponent>
      </ion-menu>
      <ion-router-outlet id="menu-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet, IonMenu, IonSplitPane } from "@ionic/vue";
import { defineComponent } from "vue";
import MenuComponent from "@/components/menu/Menu.vue";
import { getTheme, setTheme } from "@/services/system";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    MenuComponent,
    IonMenu,
    IonSplitPane,
  },

  mounted() {
    getTheme().then((response) => {
      const theme = response;
      setTheme({ theme: theme });
    });
  },
});
</script>
