<template>
  <ion-app>
    <ion-split-pane when="md" content-id="menu-content">
      <ion-menu
        contenta-id="menu-content"
        menu-id="firstMenu"
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

<script lang="ts">
import { IonApp, IonRouterOutlet, IonMenu, IonSplitPane } from "@ionic/vue";
import { defineComponent } from "vue";
import MenuComponent from "@/components/menu/Menu.vue";
import { setTheme } from "@/services/system";
import { useDocument } from "@/composables/useDocument";
import { useReminders } from "@/composables/useReminders";
import { useSystem } from "@/composables/useSystem";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
    IonRouterOutlet,
    MenuComponent,
    IonMenu,
    IonSplitPane,
  },

  watch: {
    $route(to, from) {
      this.$nextTick(() => {
        const elementos = document.querySelectorAll(
          ".split-pane-main .ion-page"
        );

        elementos.forEach(function (elemento) {
          elemento.classList.add("component-container");
        });
      });
    },
  },

  mounted() {
    this.start();
    this.$nextTick(() => {
      const ionPage = this.$el.querySelector(".split-pane-main .ion-page");
      if (ionPage) {
        ionPage.classList.add("component-container");
      }
    });
  },

  methods: {
    async start() {
      await useDocument().loadUserDocuments();
      useReminders().loadReminders();

      await useSystem().loadThemeSelected();
      const theme = useSystem().getTheme();
      setTheme({ theme: theme });
    },
  },
});
</script>
