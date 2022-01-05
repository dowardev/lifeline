<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border">
      <ion-toolbar>
        <ion-title>Modo oscuro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-radio-group v-model="darkOptions.status" @ionChange="setTheme()">
        <ion-item>
          <ion-label>Activado</ion-label>
          <ion-radio slot="start" value="enabled"></ion-radio>
        </ion-item>

        <ion-item>
          <ion-label>Desactivado</ion-label>
          <ion-radio slot="start" value="disabled"></ion-radio>
        </ion-item>

        <ion-item>
          <ion-label>Automatico</ion-label>
          <ion-radio slot="start" value="automatic"></ion-radio>
        </ion-item>
      </ion-radio-group>
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
  IonRadio,
  IonRadioGroup,
} from "@ionic/vue";
import { defineComponent } from "vue";
import systemService from "../../../services/system.vue";

export default defineComponent({
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonRadio,
    IonRadioGroup,
  },
  data() {
    this.getTheme();
    return {
      darkOptions: { status: "disabled" },
    };
  },
  methods: {
    async getTheme() {
      const isDarkEnabled = await systemService().getTheme();
      if (isDarkEnabled) {
        this.darkOptions.status = "enabled";
      }
      if (isDarkEnabled == "false") {
        this.darkOptions.status = "disabled";
      }
      if (isDarkEnabled == "automatic") {
        this.darkOptions.status = "automatic";
      }
    },
    setTheme() {
      let darkMode: string | boolean = false;
      if (this.darkOptions.status == "enabled") {
        darkMode = true;
      }
      if (this.darkOptions.status == "disabled") {
        darkMode = false;
      }
      if (this.darkOptions.status == "automatic") {
        darkMode = "automatic";
      }

      systemService().setTheme(darkMode);
      if (darkMode == "automatic") {
        darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      systemService().toggleTheme(darkMode as boolean);
    },
  },
});
</script>
