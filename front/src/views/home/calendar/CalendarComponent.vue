<template>
  <!-- calendar -->
  <section class="calendar-section">
    <section style="display: flex; justify-content: space-between">
      <div class="calendar-header">
        <div class="day-header-container">
          <span class="day-header" style="color: var(--ion-color-primary)">{{
            new Date().getDate()
          }}</span>
        </div>

        <div
          style="display: flex; flex-direction: column; align-items: stretch"
        >
          <div style="display: flex">
            <span class="month-header">{{ new Date().getMonth() }}</span>
          </div>
          <div>
            <span class="year-header">{{ new Date().getFullYear() }}</span>
          </div>
        </div>
      </div>

      <div class="center-vertical">
        <ion-button id="modal-add-event" fill="clear"
          ><ion-icon :icon="addOutline"></ion-icon
        ></ion-button>
      </div>
    </section>

    <section class="calendar-body">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="hour-column">Hora</th>
            <th class="event-column">Eventos</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="hour in hours" :key="hour">
            <td class="hour-cell">{{ hour }}</td>
            <td class="event-cell">
              <div
                v-for="event in filteredEvents({ hour: parseInt(hour) })"
                :key="event.id"
              >
                <ion-card class="card-event">
                  <ion-card-header>
                    <ion-card-title>{{ event.title }}</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    {{ format(new Date(event.date), "Pp") }}
                  </ion-card-content>
                </ion-card>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>

  <!-- popovers -->
  <!-- popover reminders -->
  <ion-popover
    style="--width: 22rem"
    trigger="popoverDateSelector"
    trigger-action="click"
  >
    <ion-datetime
      ref="miniCalendar"
      presentation="date"
      @ion-change="
        currentDate = format(new Date($event.target.value as any), 'P') as any
      "
    >
      <ion-buttons slot="buttons">
        <ion-button color="danger" @click="(miniCalendar as any).$el.reset()"
          >Reiniciar</ion-button
        >
      </ion-buttons>
    </ion-datetime>
  </ion-popover>
  <!-- end popovers -->

  <!-- modals -->
  <ion-modal
    ref="modalAddEvent"
    trigger="modal-add-event"
    class="modal-event"
    :backdrop-dismiss="false"
  >
    <AdminEventComponent />
  </ion-modal>
</template>

<script setup lang="ts">
import { IonDatetime, IonPopover } from "@ionic/vue";
import { computed, ref } from "vue";
import { format } from "date-fns";
import { ScheduleElement } from "@/utils/interfaces";
import { useSchedule } from "@/composables/useSchedule";
import { addOutline } from "ionicons/icons";

// components
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";

const currentDate = ref(new Date());
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`
);
const miniCalendar = ref(null);

// computed
const generateSchedule = computed(() => {
  const schedule = useSchedule().getSchedule();
  if (!schedule) return [];

  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const day = currentDate.value.getDate();

  const events = schedule[year]?.[month]?.[day];
  if (!events) return [];
  return events;
});

// functions
function filteredEvents(params: { hour: number }): ScheduleElement[] {
  return generateSchedule.value.filter((event) => {
    const eventHour = new Date(event.date).getHours();
    if (eventHour === params.hour) {
      return true;
    }
    return false;
  });
}
</script>

<style scoped>
.calendar-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-header {
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
}

.calendar-body {
  flex: 1;
  overflow: auto;
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

.day-header-container {
  padding-right: 16px;
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
