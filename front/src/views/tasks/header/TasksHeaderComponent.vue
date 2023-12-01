<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </div>
</template>

<script setup lang="ts">
import { IonTitle, IonToolbar, IonButtons } from "@ionic/vue";

const pageTitle = "Tareas";
</script>

<style scoped>
.background1-main-section {
  background: var(--ion-background-color);
}
.background2-main-section {
  background: var(--ion-color-step-50);
}
.card-main-content {
  max-height: 81vh;
  overflow-y: auto;
}
@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
