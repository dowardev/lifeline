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
// 1. Imports (ionic/vue/ionicons)
import { IonContent, isPlatform, IonPage } from "@ionic/vue";
import { ref } from "vue";

// 2. Controllers / Composables
// (none)

// 3. Components
import RemindreHeader from "./RemindersHeaderComponent.vue";
import ReminderContent from "./RemindersContentComponent.vue";

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
const emitEvent = defineEmits(["closeReminders"]);

// 6. Vars and const
const contentDesktop = ref();
const contentMobile = ref();

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
</script>
