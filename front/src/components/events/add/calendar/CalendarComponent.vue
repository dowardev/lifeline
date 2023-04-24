<template>
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

            <ion-card-content>{{ format(new Date(), "Pp") }}</ion-card-content>
          </ion-card>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { format } from "date-fns";

export default defineComponent({
  name: "CalendarComponent",
  setup() {
    return {
      pageTitle: "Calendario",
      hours: Array.from(
        { length: 24 },
        (_, i) => `${i.toString().padStart(2, "0")}:00`
      ),
      events: {},
      format,
    };
  },
});
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

/* table { */
/*   width: 100%; */
/*   border-collapse: collapse; */
/*   font-family: Arial, sans-serif; */
/* } */
/**/
/* th, */
/* td { */
/*   padding: 8px; */
/*   text-align: left; */
/*   border-bottom: 1px solid #ddd; */
/* } */
/**/
/* th { */
/*   font-weight: bold; */
/* } */
</style>
