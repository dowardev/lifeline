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
        <ion-item lines="none"
          ><ion-label>{{ theme }}</ion-label>
          <ion-button
            fill="clear"
            @click="previewTheme({ name: theme as Theme })"
            ><ion-icon :icon="eyeOutline"></ion-icon
          ></ion-button>

          <ion-button fill="clear" @click="applyTheme({ name: theme as Theme })"
            ><ion-icon :icon="checkmarkOutline"></ion-icon></ion-button
        ></ion-item>
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
import {
  checkmarkOutline,
  chevronBackOutline,
  eyeOutline,
} from "ionicons/icons";
import { Theme } from "@/utils/types";
import { useSystem } from "@/composables/useSystem";

const availableThemes: Theme[] = ["light", "nord", "gruvbox"];

const pageTitle = "Selector de tema";
let themeSelected = "";

// funtions
const closeModal = () => {
  modalController.dismiss();
};

const previewTheme = (params: { name: Theme }) => {
  const theme = params.name;
  themeSelected = themeSelected;

  document.body.classList.add(theme);
  themeSelected = theme;
  if (themeSelected != "")
    document.getElementsByTagName("body")[0].classList.remove(themeSelected);
};

const applyTheme = async (params: { name: Theme }) => {
  const theme = params.name;
  useSystem().applyTheme({ theme });
  useSystem().updateThemeSelected({ theme });
};
</script>
