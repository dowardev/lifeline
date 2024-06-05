<template>
  <!-- header -->
  <section style="display: flex; justify-content: space-between">
    <div class="calendar-header">
      <span
        class="day-header"
        style="
          color: var(--ion-color-primary);
          line-height: 1;
          margin-right: 16px;
        "
      >
        {{ new Date().getDate() }}
      </span>

      <div style="display: flex; flex-direction: column; align-items: stretch">
        <div style="display: flex">
          <span class="month-header">{{ new Date().getMonth() }}</span>
        </div>
        <div>
          <span class="year-header">{{ new Date().getFullYear() }}</span>
        </div>
      </div>
    </div>

    <div class="center-vertical">
      <ion-button
        fill="clear"
        @click="calendarComponent.openModalAdd({ event: $event })"
        ><ion-icon :icon="addOutline"></ion-icon
      ></ion-button>
    </div>
  </section>

  <!-- content -->
  <section style="height: calc(100dvh - 336px)">
    <CalendarComponent
      ref="calendarComponent"
      :mode-view="'day'"
      :events="events"
      :date="new Date()"
    />
  </section>
</template>

<script setup lang="ts">
import { IonButton } from "@ionic/vue";
import { onMounted, ref, watch } from "vue";
import { addOutline } from "ionicons/icons";

//controllers
import { EventController } from "@/controllers/eventController";
const eventController = new EventController();

// components
import CalendarComponent from "@/components/calendar/CalendarComponent.vue";

// interfaces
import { Event } from "@/utils/interfaces";

//vars
const events = ref([] as Event[]);
const calendarComponent = ref();

watch(
  () => eventController.getEvents(),
  async (response) => {
    events.value = response;
  }
);

onMounted(() => {
  events.value = eventController.getEvents();
});
</script>

<style scoped>
.calendar-section {
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
}

.schedule-table {
  border-collapse: collapse;
  width: 100%;
}

.schedule-table td,
.schedule-table th {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.schedule-table th {
  font-weight: bold;
  position: sticky;
  top: 0px;
  z-index: 2;
}

.schedule-table .hour-column {
  width: 10%;
}

.schedule-table .event-column {
  width: 90%;
}

.schedule-table .event-cell {
  position: relative;
  min-height: 50px;
}

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}

.day-header {
  font-size: 70px;
  font-weight: bold;
}

.month-header {
  font-size: 20px;
}

.year-header {
  font-size: 20px;
}

@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
