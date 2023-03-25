<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div @contextmenu.prevent="openPopover" @press='openPopover'>
        Haz clic derecho aquí para abrir el popover
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import MenuComponent from "./MenuComponent.vue";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
  },

  setup() {
    return {
      pageTitle: "Home",
    };
  },
  methods: {
    async openPopover(ev: Event) {
      const popover = await popoverController.create({
        component: MenuComponent,
        event: ev,
        showBackdrop:false
      });
      await popover.present();
    },
  },
});
</script>
