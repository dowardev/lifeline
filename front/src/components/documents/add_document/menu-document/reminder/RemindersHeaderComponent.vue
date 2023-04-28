<template>
  <ion-header mode="ios" class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeReminders()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <ion-button @click="closeReminders()">
          <ion-icon :icon="saveOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <ion-toolbar>
      <ion-segment
        :mode="isPlatform('ios') ? 'ios' : 'md'"
        :value="props.reminderSegment"
        @ion-change="
          changeSegmentReminderValue({ value: $event.detail.value as string })
        "
      >
        <ion-segment-button value="date-start">Inicio</ion-segment-button>
        <ion-segment-button value="date-end">Final</ion-segment-button>
        <ion-segment-button value="reminders">Recordatorios</ion-segment-button>
      </ion-segment>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSegment,
  IonSegmentButton,
  isPlatform,
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";

const props = defineProps({
  reminderSegment: { type: String, default: "date-start" },
});

const emitEvent = defineEmits(["closeReminders", "segmentRerminderChange"]);

const pageTitle = "Recordatorios";

// functions
const closeReminders = () => {
  emitEvent("closeReminders");
};

const changeSegmentReminderValue = (params: { value: string }) => {
  const value = params.value;
  emitEvent("segmentRerminderChange", value);
};
</script>
