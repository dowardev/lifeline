<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-row>
        <ion-col size="12" class="ion-padding">
          <table class="schedule-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="day in daysOfWeek" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="hour in hoursOfDay" :key="hour">
                <td>{{ hour }}</td>
                <td v-for="day in daysOfWeek" :key="day">
                  <ul>
                    <li v-for="date in dates[day.toLowerCase()]" :key="date">
                      <template
                        v-if="
                          new Date(date.start).getHours() === parseInt(hour)
                        "
                      >
                        <ion-card>
                          <ion-card-header>
                            <ion-card-title>{{ date.title }}</ion-card-title>
                          </ion-card-header>

                          <ion-card-content>{{
                            format(new Date(date.start), "Pp")
                          }}</ion-card-content>
                        </ion-card>
                      </template>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </ion-col>
      </ion-row>
    </ion-content>
  </ion-page>
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
import { useReminders } from "../../composables/useReminders";
import { useDocument } from "../../composables/useDocument";
import { format } from "date-fns";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
  },

  setup() {
    return {
      pageTitle: "Inicio",
      format,
    };
  },

  data() {
    return {
      daysOfWeek: [
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
        "domingo",
      ],
      hoursOfDay: [
        "00:00",
        "01:00",
        "02:00",
        "03:00",
        "04:00",
        "05:00",
        "06:00",
        "07:00",
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
        "22:00",
        "23:00",
      ],
    };
  },

  computed: {
    dates() {
      const response = useReminders().getReminders();

      const dates = response?.map((element) => {
        return { start: element.date.start, title: "Prueba" };
      });
      if (!dates) return;

      const daysOfWeek = this.daysOfWeek;
      const initialAcc: any = {};
      for (const day of daysOfWeek) {
        initialAcc[day] = [];
      }
      return dates.reduce((acc: any, dateObj: any) => {
        const date = new Date(dateObj.start);
        const dayOfWeekIndex = date.getDay();
        const dayOfWeek = daysOfWeek[dayOfWeekIndex];
        const newDateObj = { start: dateObj.start, title: dateObj.title };
        acc[dayOfWeek].push(newDateObj);
        return acc;
      }, initialAcc);
    },
  },

  mounted() {
    this.start();
  },

  methods: {
    async start() {
      await useDocument().loadUserDocuments();
      useReminders().loadReminders();
    },
  },
});
</script>

<style scoped>
.schedule-table {
  border-collapse: collapse;
  width: 100%;
}

.schedule-table th,
.schedule-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.schedule-table th {
  font-weight: bold;
  border: none !important;
}

.schedule-table tr td:first-child,
.schedule-table th:first-child {
  border: none !important;
}

ul,
ol {
  list-style: none;
}

ion-card {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}
</style>
