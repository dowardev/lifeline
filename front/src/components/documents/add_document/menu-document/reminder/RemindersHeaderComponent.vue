<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

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
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  isPlatform,
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
const props = defineProps({
  reminderSegment: { type: String, default: "date-start" },
});

const emitEvent = defineEmits(["closeReminders", "segmentRerminderChange"]);

// 6. Vars and const
const pageTitle = "Recordatorios";

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
const closeReminders = (): void => {
  emitEvent("closeReminders");
};

const changeSegmentReminderValue = (params: { value: string }): void => {
  const value = params.value;
  emitEvent("segmentRerminderChange", value);
};
</script>
