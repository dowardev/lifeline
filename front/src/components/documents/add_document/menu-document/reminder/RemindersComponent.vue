<template>
  <!-- dektop -->
  <RemindreHeader
    v-if="isPlatform('desktop')"
    @close-reminders="closeReminders()"
    @segment-rerminder-change="
      contentDesktop.changeSegmentReminderValue({ value: $event })
    "
  />

  <ion-content
    v-if="isPlatform('desktop')"
    class="ion-padding-start ion-padding-end ion-padding-bottom"
  >
    <ReminderContent ref="contentDesktop" />
  </ion-content>

  <!-- mobile -->
  <ion-page v-if="!isPlatform('desktop')">
    <RemindreHeader
      @close-reminders="closeReminders()"
      @segment-rerminder-change="
        contentMobile.changeSegmentReminderValue({ value: $event })
      "
    />

    <ion-content class="ion-padding-start ion-padding-end ion-padding-bottom">
      <ReminderContent ref="contentMobile" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, isPlatform, IonPage } from "@ionic/vue";
import { ref } from "vue";
import RemindreHeader from "./RemindersHeaderComponent.vue";
import ReminderContent from "./RemindersContentComponent.vue";

const emitEvent = defineEmits(["closeReminders"]);

// ref
const contentDesktop = ref();
const contentMobile = ref();

// funtions
const closeReminders = () => {
  emitEvent("closeReminders");
};
</script>
