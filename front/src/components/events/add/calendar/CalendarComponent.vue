<template>
  <!-- date selector -->
  <section class="center ion-padding-bottom">
    <ion-item lines="full">
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
  </section>

  <!-- calendar -->
  <section>
    <table class="schedule-table">
      <thead>
        <tr>
          <th>Hora</th>
          <th>Eventos</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="hour in hours" :key="hour">
          <td>{{ hour }}</td>
          <td>
            <ion-card>
              <ion-card-header>
                <ion-card-title>Visita al doctor</ion-card-title>
              </ion-card-header>

              <ion-card-content>{{
                format(new Date(), "Pp")
              }}</ion-card-content>
            </ion-card>
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
      presentation="date"
      @ion-change="
        currentDate = format(new Date($event.target.value as any), 'P') as any
      "
    ></ion-datetime>
  </ion-popover>
</template>

<script setup lang="ts">
import { IonDatetime, IonPopover } from "@ionic/vue";
import { defineComponent, ref } from "vue";
import { add, format, subDays } from "date-fns";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";

const currentDate = ref(new Date());
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`
);

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

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}
</style>
