<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <ion-segment
          :value="policieSegment"
          scrollable
          @ion-change="emits('mainOption', $event.target.value as string)"
        >
          <ion-segment-button value="privacy">
            <ion-label>Privacidad</ion-label>
          </ion-segment-button>

          <ion-segment-button value="tc" :disabled="true">
            <ion-label>Términos y condiciones</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-buttons>
    </ion-toolbar>
  </div>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  isPlatform,
} from "@ionic/vue";
import { ref } from "vue";
const modeDesingElements = isPlatform("ios") ? "ios" : ("md" as "ios" | "md");

const emits = defineEmits(["mainOption"]);
// refs
const pageTitle = ref("Politicas");
const policieSegment = ref("privacy");

// methods
const openUrl = (params: { url: string }) => {
  const url = params.url;
  window.open(url, "_blank");
};
</script>

<style scoped>
.important-text {
  font-weight: bold;
}
.card-main-content {
  max-height: 82vh;
  overflow-y: auto;
}

@media only screen and (min-width: 768px) {
  .description {
    display: flex;
    justify-content: center;
  }
}
</style>
