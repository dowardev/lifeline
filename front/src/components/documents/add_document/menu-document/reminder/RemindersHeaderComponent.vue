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
  </ion-header>
</template>

<script lang="ts">
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
} from "@ionic/vue";
import {
  closeOutline,
  saveOutline,
} from "ionicons/icons";
import { defineComponent, } from "vue";

export default defineComponent({
  name: "MenuOptComponent",

  components: {
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
  },

  emits: ["closeReminders"],

  setup() {
    return {
      closeOutline,
      pageTitle: "Recordatorios",
      saveOutline,
    };
  },

  methods: {
    openPopoverReminderStart(ev: Event) {
      this.popoverReminderStartEvent = ev;
      this.popoverReminderStartOpen = true;
    },

    openPopoverReminderEnd(ev: Event) {
      this.popoverReminderEndEvent = ev;
      this.popoverReminderEndOpen = true;
    },

    closeReminders() {
      this.$emit("closeReminders");
    },
  },
});
</script>
