<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-button id="trigger-button">Click to open popover</ion-button>
      <ion-popover trigger="trigger-button">
        <ion-content>Popover Content</ion-content>
      </ion-popover>
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
  IonToggle,
  IonPopover,
} from "@ionic/vue";
import { defineComponent, ref } from "vue";

export default defineComponent({
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonPopover,
  },
  data() {
    // // Use matchMedia to check the user preference
    // const prefersDark = window.matchMedia("(prefers-color-scheme: light)");
    //
    // toggleDarkTheme(prefersDark.matches);
    //
    // // Listen for changes to the prefers-color-scheme media query
    // prefersDark.addListener((mediaQuery) =>
    //   toggleDarkTheme(mediaQuery.matches)
    // );
    //
    // // Add or remove the "dark" class based on if the media query matches
    // function toggleDarkTheme(shouldAdd: any) {
    //   document.body.classList.toggle("dark", shouldAdd);
    // }
    return { check: true };
  },
  methods: {
    prueba() {
      document.body.classList.toggle("dark", this.check);
    },
  },
});
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
