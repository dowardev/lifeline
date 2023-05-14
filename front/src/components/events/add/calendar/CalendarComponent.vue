<template>
  <!-- calendar -->
  <section>
    <table class="schedule-table">
      <thead>
        <tr>
          <th>Hora</th>
          <th>
            <div class="center">
              <ion-item lines="none">
                <ion-button fill="clear" @click="previousDay()"
                  ><ion-icon :icon="chevronBackOutline"></ion-icon
                ></ion-button>

                <ion-button id="popoverDateSelector" fill="clear">{{
                  format(new Date(currentDate), "P")
                }}</ion-button>

                <ion-button fill="clear" @click="nextDay()"
                  ><ion-icon :icon="chevronForwardOutline"></ion-icon
                ></ion-button>
              </ion-item>
            </div>

            <div>Eventos</div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="hour in hours" :key="hour">
          <td>{{ hour }}</td>
          <td>
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
</template>

<script setup lang="ts">
import { IonDatetime, IonPopover } from "@ionic/vue";
import { computed, ref } from "vue";
import { add, format, subDays } from "date-fns";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { Event, ScheduleElement } from "@/utils/interfaces";
import { useSchedule } from "@/composables/useSchedule";

const props = defineProps({
  events: { type: Array as () => Event[], default: () => [] },
});

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
const nextDay = () => {
  const date = currentDate;
  currentDate.value = add(new Date(date.value), {
    days: 1,
  });
};

const previousDay = () => {
  const date = currentDate;
  currentDate.value = subDays(new Date(date.value), 1);
};

function filteredEvents(params: { hour: number }) {
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
table.schedule-table {
  border-collapse: collapse;
}

table.schedule-table td {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

table.schedule-table th {
  font-weight: bold;
  border: none;
  position: sticky;
  top: -16px;
  background-color: var(--ion-background-color);
  z-index: 2;
}

table.schedule-table tr td:first-child,
table.schedule-table th:first-child {
  border: none;
  background-color: var(--ion-background-color);
}

table.schedule-table td:nth-child(2) {
  min-width: 100%;
}

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}
</style>
