<template>
  <ion-page>
    <ion-header :translucent="true" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button @click="$router.push({ name: 'AdminEvent' })"
            ><ion-icon :icon="addOutline"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="3">
          <section>
            <div style="display: flex; justify-content: space-around">
              <div class="ion-padding">
                <ion-input
                  label="Tarea"
                  label-placement="floating"
                  fill="outline"
                ></ion-input>
              </div>

              <div style="display: flex; align-items: center">
                <ion-button fill="clear"
                  ><ion-icon :icon="addOutline"></ion-icon
                ></ion-button>
              </div>
            </div>

            <div style="height: 80vh; overflow: auto; overflow-x: auto">
              <div v-for="(task, indexTask) in todo" :key="indexTask">
                <ion-item
                  :ref="`item-todo-${new Date().getTime()}`"
                  lines="none"
                  button
                  @mouseenter="showButtonsOptionTODO = indexTask"
                  @mouseleave="showButtonsOptionTODO = -1"
                >
                  <ion-label>{{ task.title }}</ion-label>

                  <ion-button
                    v-if="showButtonsOptionTODO === indexTask"
                    fill="clear"
                    ><ion-icon :icon="createOutline"></ion-icon
                  ></ion-button>

                  <ion-button
                    v-if="showButtonsOptionTODO === indexTask"
                    fill="clear"
                    color="danger"
                    ><ion-icon :icon="trashOutline"></ion-icon
                  ></ion-button>
                </ion-item>
              </div>
            </div>
          </section>
        </ion-col>

        <!-- table -->
        <ion-col size="9" class="ion-padding">
          <div style="height: 90vh; overflow: auto; overflow-x: auto">
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
                    <div>
                      <div v-for="date in dates[day.toLowerCase()]" :key="date">
                        <template
                          v-if="
                            new Date(date.start).getHours() === parseInt(hour)
                          "
                        >
                          <ion-card class="card-event">
                            <ion-card-header>
                              <ion-card-title>{{ date.title }}</ion-card-title>
                            </ion-card-header>

                            <ion-card-content>{{
                              format(new Date(date.start), "Pp")
                            }}</ion-card-content>
                          </ion-card>
                        </template>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
  IonInput,
  IonLabel,
  IonButton,
  IonItem,
} from "@ionic/vue";
import { defineComponent, ref } from "vue";
import { useReminders } from "../../composables/useReminders";
import { useDocument } from "../../composables/useDocument";
import { format } from "date-fns";
import { addOutline, createOutline, trashOutline } from "ionicons/icons";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
    IonLabel,
    IonButton,
    IonItem,
  },

  setup() {
    const showButtonsOptionTODO = ref(-1);
    return {
      pageTitle: "Inicio",
      format,
      addOutline,
      trashOutline,
      createOutline,
      showButtonsOptionTODO,
      daysOfWeek: [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
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
      todo: [
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
        { title: "Terminar proyecto" },
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
      const result = dates.reduce((acc: any, dateObj: any) => {
        const date = new Date(dateObj.start);
        const dayOfWeekIndex = date.getDay();
        const dayOfWeek = daysOfWeek[dayOfWeekIndex];
        const newDateObj = { start: dateObj.start, title: dateObj.title };
        acc[dayOfWeek].push(newDateObj);
        return acc;
      }, initialAcc);
      // console.log(dates,result)
      return result;
    },
  },
});
</script>

<style scoped>
table.schedule-table {
  border-collapse: collapse;
}

table.schedule-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

table.schedule-table td:first-child {
  position: sticky;
  left: 0;
}

table.schedule-table td:not(:first-child) {
  position: relative;
  width: 150px; /* ancho fijo para las demás columnas */
}

table.schedule-table th {
  font-weight: bold;
  border: none !important;
  position: sticky;
  top: 0;
  background-color: var(--ion-background-color);
  z-index: 2;
}

table.schedule-table tr td:first-child,
table.schedule-table th:first-child {
  border: none !important;
  z-index: 3;
  background-color: var(--ion-background-color);
}

ion-content {
  overflow: hidden;
}

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}

ion-content {
  --offset-bottom: auto !important;
  --overflow: hidden;
  overflow: auto;
}
ion-content::-webkit-scrollbar {
  display: none;
}
</style>
