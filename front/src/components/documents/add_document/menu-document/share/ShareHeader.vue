<template>
  <ion-header mode="ios" class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeShare()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { IonHeader, IonTitle, IonToolbar, IonButton } from "@ionic/vue";
import { closeOutline } from "ionicons/icons";

const emitEvent = defineEmits(["closeShare"]);

const pageTitle = "Compartir";

// functions
const closeShare = () => {
  emitEvent("closeShare");
};
</script>
