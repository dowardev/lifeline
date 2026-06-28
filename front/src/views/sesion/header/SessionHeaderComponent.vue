<template>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-menu-button
        menu="main-menu"
        :smode="modeDesingElements"
      ></ion-menu-button>
    </ion-buttons>

    <ion-title v-if="isPlatform('desktop') || isPlatform('tablet')">
      {{ props.pageTitle }}
    </ion-title>

    <ion-buttons slot="end">
      <ion-segment
        :value="props.mainSegment"
        :mode="modeDesingElements"
        scrollable
        class="main-section"
        @ion-change="emits('mainSegment', $event.detail.value as string)"
      >
        <ion-segment-button value="login">
          <ion-label>Iniciar sesión</ion-label>
        </ion-segment-button>

        <ion-segment-button value="signup">
          <ion-label>Registrar</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-buttons>
  </ion-toolbar>
</template>

<script setup lang="ts">
import {
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonLabel,
  isPlatform,
  IonSegment,
  IonSegmentButton,
} from "@ionic/vue";

// vars
const props = defineProps({
  mainSegment: { type: String, default: "login", required: true },
  pageTitle: { type: String, required: true, default: "Iniciar sesión" },
});
const emits = defineEmits(["mainSegment"]);
const modeDesingElements = isPlatform("ios") ? "ios" : "md";
</script>

