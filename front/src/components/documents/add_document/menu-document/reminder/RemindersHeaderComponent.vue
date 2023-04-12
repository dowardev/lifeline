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
        :value="reminderSegment"
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

<script lang="ts">
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
import { defineComponent } from "vue";

export default defineComponent({
  name: "MenuOptComponent",

  components: {
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSegment,
    IonSegmentButton,
  },

  props: { reminderSegment: { type: String, default: "date-start" } },

  emits: ["closeReminders", "segmentRerminderChange"],

  setup() {
    return {
      closeOutline,
      pageTitle: "Recordatorios",
      saveOutline,
      isPlatform,
    };
  },

  methods: {
    closeReminders() {
      this.$emit("closeReminders");
    },

    changeSegmentReminderValue(params: { value: string }) {
      const value = params.value;
      this.$emit("segmentRerminderChange", value);
    },
  },
});
</script>
