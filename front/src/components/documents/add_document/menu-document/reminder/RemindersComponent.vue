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

<script lang="ts">
import { IonContent, isPlatform, IonPage } from "@ionic/vue";
import { defineComponent, ref } from "vue";
import RemindreHeader from "./RemindersHeaderComponent.vue";
import ReminderContent from "./RemindersContentComponent.vue";

export default defineComponent({
  name: "MenuOptComponent",

  components: {
    IonContent,
    RemindreHeader,
    ReminderContent,
    IonPage,
  },

  emits: ["closeReminders"],

  setup() {
    const contentDesktop = ref();
    const contentMobile = ref();
    return {
      isPlatform,
      contentDesktop,
      contentMobile,
    };
  },

  computed: {
    generateCalendar() {
      const hours = [];
      for (let i = 0; i < 24; i++) {
        hours.push({
          hour: i,
        });
      }
      return hours;
    },
  },

  methods: {
    closeReminders() {
      this.$emit("closeReminders");
    },
  },
});
</script>
