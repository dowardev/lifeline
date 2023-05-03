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
            <template v-if="filterEvents.length">
              <div
                v-for="(event, eventIndex) in filterEvents"
                :key="eventIndex"
              >
                <template
                  v-if="new Date(event.reminders!.start).getHours() == parseInt(hour)"
                >
                  <ion-card>
                    <ion-card-header>
                      <ion-card-title>
                        {{ event.name }}
                      </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      {{ format(new Date(event.reminders!.start), "Pp") }}
                    </ion-card-content>
                  </ion-card>
                </template>
              </div>
            </template>
            <template v-else>
              <div class="empty-cell"></div>
            </template>
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
import { Event } from "@/utils/interfaces";

const props = defineProps({
  events: { type: Array as () => Event[], default: () => [] },
});

const currentDate = ref(new Date());
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`
);
const miniCalendar = ref(null);

const filterEvents = computed(() => {
  return props.events.filter((event) => {
    if (
      new Date(event.reminders!.start).getDay() == currentDate.value.getDay() &&
      new Date(event.reminders!.start).getMonth() ==
        currentDate.value.getMonth() &&
      new Date(event.reminders!.start).getFullYear() ==
        currentDate.value.getFullYear()
    )
      return event;
  });
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
  top: 0;
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
