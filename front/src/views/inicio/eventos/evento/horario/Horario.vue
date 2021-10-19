<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Seleccionar horario</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="save">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-list>
            <ion-list-header>
              <ion-label>Inicio</ion-label>
            </ion-list-header>
            <ion-row>
              <ion-col size="4">
                <ion-item>
                  <ion-select
                    v-model="start.yearSelected"
                    @ionChange="generateDaysStart()"
                  >
                    <ion-select-option
                      v-for="years in years"
                      :key="years"
                      :value="years"
                      >{{ years }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select
                    v-model="start.monthSelected"
                    @ionChange="generateDaysStart()"
                  >
                    <ion-select-option
                      v-for="month in monthNames"
                      :key="month"
                      :value="month.position"
                      >{{ month.name }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select
                    v-model="start.daySelected"
                    @ionChange="generateDaysStart()"
                  >
                    <ion-select-option
                      v-for="day in start.days"
                      :key="day"
                      :value="day"
                      >{{ day }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="4">
                <ion-item>
                  <ion-select v-model="start.hourSelected">
                    <ion-select-option
                      v-for="hour in hours"
                      :key="hour"
                      :value="hour"
                      >{{ hour }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select v-model="start.minuteSelected">
                    <ion-select-option
                      v-for="minute in minutes"
                      :key="minute"
                      :value="minute"
                    >
                      <p v-if="minute == 0">00</p>
                      <p v-if="minute != 0">{{ minute }}</p></ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select v-model="start.amSelected">
                    <ion-select-option
                      v-for="item in am"
                      :key="item"
                      :value="item"
                      >{{ item }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>Fin</ion-label>
            </ion-list-header>
            <ion-row>
              <ion-col size="4">
                <ion-item>
                  <ion-select
                    v-model="end.yearSelected"
                    @ionChange="generateDaysEnd()"
                  >
                    <ion-select-option
                      v-for="years in years"
                      :key="years"
                      :value="years"
                      >{{ years }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select
                    v-model="end.monthSelected"
                    @ionChange="generateDaysEnd()"
                  >
                    <ion-select-option
                      v-for="month in monthNames"
                      :key="month"
                      :value="month.position"
                      >{{ month.name }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select
                    v-model="end.daySelected"
                    @ionChange="generateDaysEnd()"
                  >
                    <ion-select-option
                      v-for="day in end.days"
                      :key="day"
                      :value="day"
                      >{{ day }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="4">
                <ion-item>
                  <ion-select v-model="end.hourSelected">
                    <ion-select-option
                      v-for="hour in hours"
                      :key="hour"
                      :value="hour"
                      >{{ hour }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select v-model="end.minuteSelected">
                    <ion-select-option
                      v-for="minute in minutes"
                      :key="minute"
                      :value="minute"
                    >
                      <p v-if="minute == 0">00</p>
                      <p v-if="minute != 0">{{ minute }}</p></ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="4">
                <ion-item>
                  <ion-select v-model="end.amSelected">
                    <ion-select-option
                      v-for="item in am"
                      :key="item"
                      :value="item"
                      >{{ item }}</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12">
          <ion-card>
            <ion-card-header>
              Para que puedas decidir mejor a continuacion se mostraran los
              eventos, tareas y notas a los cuales se les ahiga asignado un
              recordatorio
            </ion-card-header>
            <ion-card-content>
              <ion-item lines="none">
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>No volver a mostrar</ion-label>
              </ion-item>
              <ion-button fill="clear" expand="full"> Aceptar </ion-button>
            </ion-card-content>
          </ion-card>
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
  IonSelect,
  IonSelectOption,
  toastController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../../EventBus";
export default defineComponent({
  name: "Horario",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const minutes = [0];
    for (let i = 1; i <= 60; i++) {
      minutes.push(i);
    }
    const am = ["am", "pm"];
    const monthNames = [
      { position: 1, name: "Enero", value: "enero" },
      { position: 2, name: "Febrero", value: "febrero" },
      { position: 3, name: "Marzo", value: "marzo" },
      { position: 4, name: "Abril", value: "abril" },
      { position: 5, name: "Mayo", value: "mayo" },
      { position: 6, name: "Junio", value: "junio" },
      { position: 7, name: "Julio", value: "julio" },
      { position: 8, name: "Agosto", value: "agosto" },
      { position: 9, name: "Septiembre", value: "septiembre" },
      { position: 10, name: "Octubre", value: "octubre" },
      { position: 11, name: "Noviembre", value: "noviembre" },
      { position: 12, name: "Diciembre", value: "diciembre" },
    ];
    return {
      chevronBackOutline,
      hours,
      minutes,
      am,
      saveOutline,
      monthNames,
      years: [0],
    };
  },
  data() {
    return {
      start: {
        hourSelected: 0,
        minuteSelected: 0,
        amSelected: "am",
        yearSelected: 0,
        monthSelected: {} as any,
        daySelected: 0,
        days: [0],
      },
      end: {
        hourSelected: 0,
        minuteSelected: 0,
        amSelected: "am",
        yearSelected: 0,
        monthSelected: {} as any,
        daySelected: 0,
        days: [0],
      },
    };
  },
  mounted() {
    eventBus().emitter.on("get-schedule-event", (response: any) => {
      let d = new Date(response.timeStart);
      this.start.amSelected = d.getHours() >= 12 ? "pm" : "am";
      this.start.daySelected = d.getDate();
      this.start.hourSelected = d.getHours() % 12 || 12;
      this.start.minuteSelected = d.getMinutes();
      this.start.monthSelected = d.getMonth();
      this.start.yearSelected = d.getFullYear();

      d = new Date(response.timeEnd);
      this.end.amSelected = d.getHours() >= 12 ? "pm" : "am";
      this.end.daySelected = d.getDate();
      this.end.hourSelected = d.getHours() % 12 || 12;
      this.end.minuteSelected = d.getMinutes();
      this.end.monthSelected = d.getMonth();
      this.end.yearSelected = d.getFullYear();
      this.loadDate();
    });
  },
  methods: {
    save() {
      const start =
        this.start.yearSelected +
        "/" +
        this.start.monthSelected +
        "/" +
        this.start.daySelected +
        " " +
        this.start.hourSelected +
        ":" +
        this.start.minuteSelected +
        " " +
        this.start.amSelected;
      const timeStart=new Date(start).getTime()

      const end =
        this.end.yearSelected +
        "/" +
        this.end.monthSelected +
        "/" +
        this.end.daySelected +
        " " +
        this.end.hourSelected +
        ":" +
        this.end.minuteSelected +
        " " +
        this.end.amSelected;
      const timeEnd=new Date(end).getTime()

      if (timeStart <= timeEnd) {
        eventBus().emitter.emit("set-schedule-event", {
          start,
          end,
        });
        this.$router.go(-1);
      } else {
        this.openToast("Compruebe las fechas seleccionadas", "danger");
      }
    },
    generateYears() {
      const max = this.start.yearSelected + 11;
      const years = [];
      for (let i = this.start.yearSelected; i < max; i++) {
        years.push(i);
      }
      this.years = years;
    },
    generateDaysStart() {
      const days = [];
      const daysInMonth = new Date(
        this.start.yearSelected,
        this.start.monthSelected,
        0
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      this.start.days = days;
    },
    generateDaysEnd() {
      const days = [];
      const daysInMonth = new Date(
        this.end.yearSelected,
        this.end.monthSelected,
        0
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      this.end.days = days;
    },
    loadDate() {
      this.generateYears();
      this.generateDaysStart();
      this.generateDaysEnd();
    },
    async openToast(message: string, color: string) {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
      });
      return toast.present();
    },
  },
});
</script>
