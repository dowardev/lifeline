<template>
  <ion-header mode="ios" class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon :icon="chevronBackOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <p class="ion-padding-start">Elije el que mas te guste</p>

    <!-- theme selector -->
    <ion-row v-for="(theme, index) in availableThemes" :key="index">
      <ion-col size="12">
        <ion-item
          lines="none"
          button
          @click="applyTheme({ name: theme as Theme })"
          ><ion-label>{{ theme }}</ion-label>
          <ion-icon
            v-if="currentTheme == theme"
            :icon="checkmarkOutline"
          ></ion-icon>
        </ion-item>
      </ion-col>
    </ion-row>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  modalController,
} from "@ionic/vue";
import { checkmarkOutline, chevronBackOutline } from "ionicons/icons";
import { Theme } from "@/utils/types";
import { onMounted, ref } from "vue";

const availableThemes: Theme[] = ["light", "nord", "gruvbox", "cherry"];
const pageTitle = "Selector de tema";
const currentTheme = ref("" as Theme);

// controllers
import { SystemController } from "@/controllers/systemController";
const systemController = new SystemController();

onMounted(() => {
  currentTheme.value = systemController.getTheme();
});

// funtions
const closeModal = () => {
  modalController.dismiss();
};

async function applyTheme(params: { name: Theme }) {
  const theme = params.name;
  systemController.applyTheme({ theme });
  await systemController.updateThemeSelected({ theme });
  currentTheme.value = theme;
}
</script>
