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
          <ion-button @click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-list>
        <ion-list-header>
          <ion-label>Inicio</ion-label>
        </ion-list-header>
      </ion-list>
      <ion-row>
        <ion-col size="12">
          <ion-datetime
            presentation="date"
            v-model="datetime.start.date"
          ></ion-datetime>
          <ion-datetime
            presentation="time"
            v-model="datetime.start.time"
          ></ion-datetime>
        </ion-col>
      </ion-row>

      <ion-list>
        <ion-list-header>
          <ion-label>Fin</ion-label>
        </ion-list-header>
      </ion-list>
      <ion-row>
        <ion-col size="12">
          <ion-datetime
            presentation="date"
            v-model="datetime.end.date"
          ></ion-datetime>
          <ion-datetime
            presentation="time"
            v-model="datetime.end.time"
          ></ion-datetime>
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
              <ion-button fill="clear" expand="full">Aceptar</ion-button>
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
  toastController,
  IonDatetime,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../../EventBus";
import { add } from "date-fns";

export default defineComponent({
  name: "Horario",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonDatetime,
  },
  setup() {
    return {
      chevronBackOutline,
      saveOutline,
    };
  },
  data() {
    const today = new Date().toLocaleString("sv").replace(" ", "T");
    return {
      datetime: {
        start: {
          date: today,
          time: today,
        },
        end: {
          date: new Date(add(new Date(), { days: 1 }))
            .toLocaleString("sv")
            .replace(" ", "T"),
          time: new Date(add(new Date(), { hours: 1 }))
            .toLocaleString("sv")
            .replace(" ", "T"),
        },
      },
    };
  },
  mounted() {
    eventBus().emitter.on("get-schedule-event", (response: any) => {
      this.datetime.start.date = response.dateTimeStart;
      this.datetime.start.time = response.dateTimeStart;

      this.datetime.end.date = response.dateTimeEnd;
      this.datetime.end.time = response.dateTimeEnd;
    });
  },
  methods: {
    save() {
      const dateStart = new Date(this.datetime.start.date)
        .toISOString()
        .split("T")[0];
      const timeStart = new Date(this.datetime.start.time)
        .toISOString()
        .split("T")[1];

      const dateEnd = new Date(this.datetime.end.date)
        .toISOString()
        .split("T")[0];
      const timeEnd = new Date(this.datetime.end.time)
        .toISOString()
        .split("T")[1];

      const dateTimeStart = dateStart + "T" + timeStart;
      const dateTimeEnd = dateEnd + "T" + timeEnd;
      if (dateTimeStart <= dateTimeEnd) {
        eventBus().emitter.emit("set-schedule-event", {
          dateTimeStart,
          dateTimeEnd,
        });
        this.$router.go(-1);
      } else {
        this.openToast("Compruebe las fechas seleccionadas", "danger");
      }
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
