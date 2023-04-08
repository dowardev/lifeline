<template>
  <RemindreHeader @close-reminders="closeReminders()" />

  <ion-content v-if="isPlatform('desktop')">
    <ReminderContent />
  </ion-content>

  <ion-page v-if="isPlatform('mobile') || isPlatform('mobileweb')" id="prueba">
    <RemindreHeader @close-reminders="closeReminders()" />

    <ion-content>
      <ReminderContent />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, isPlatform, IonPage } from "@ionic/vue";
import { defineComponent } from "vue";
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
    return {
      isPlatform,
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
