<template>
  <ion-row style="height: 100%; overflow: auto">
    <ion-col size="12" style="height: 100%">
      <CalendarComponent
        ref="calendarComponent"
        :mode-view="calendarController.getCalendarModeView()"
        :events="events"
        :date="
          calendarController.getCurrentDate({
            mode: calendarController.getCalendarModeView(),
          })
        "
      />
    </ion-col>
  </ion-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { watch } from "vue";
// interfaces
import { Event } from "@/utils/interfaces";

// components
import CalendarComponent from "@/components/calendar/CalendarComponent.vue";

// controllers
import { EventController } from "@/js/eventController";
import { CalendarController } from "@/js/calendarController";
const eventController = new EventController();
const calendarController = new CalendarController();

// vars
const events = ref([] as Event[]);
const calendarComponent = ref();

// watch
// watch events
watch(
  () => eventController.getEvents(),
  async (response) => {
    events.value = response;
  },
);

// mounted
onMounted(() => {
  events.value = eventController.getEvents();
});

defineExpose({ openModalAdd, reschedule });

// functions
/**
 * Delete event
 *
 * params {Object} params
 * @param {Number} params.eventId sssssss
 */

function openModalAdd(params: { event: Event }): void {
  const { event } = params;
  calendarComponent.value.openModalAdd({ event });
}

function reschedule(): void {
  calendarComponent.value.reschedule();
}
</script>

<style scoped>
@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
