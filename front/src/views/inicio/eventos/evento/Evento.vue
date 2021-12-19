<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Detalles</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="editEvent()">
            <ion-icon slot="start" :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="readerOutline"></ion-icon>
            <ion-label class="ion-text-wrap"
              ><h2>Titulo</h2>
              <p>{{ event.title }}</p>
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="timeOutline"></ion-icon>
            <ion-label class="ion-text-wrap"
              ><h2>Fecha inicial</h2>
              <p>{{ event.timeStart.dateFormatted }}</p>
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="timeOutline"></ion-icon>
            <ion-label class="ion-text-wrap"
              ><h2>Fecha final</h2>
              <p>{{ event.timeEnd.dateFormatted }}</p>
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
            <ion-label class="ion-text-wrap"
              ><h2>Recodartorio</h2>
              <ion-chip
                color="primary"
                v-for="reminder in event.reminders"
                :key="reminder"
                >{{ reminder }}</ion-chip
              >
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
            <ion-label
              ><h2>Repetir</h2>
              <p>{{ event.repeats.frecuency }}</p>
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="layersOutline"></ion-icon>
            <ion-label
              ><h2>Calendario</h2>
              <p>{{ event.calendar }}</p>
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="readerOutline"></ion-icon>
            <ion-label
              ><h2>Notas</h2>
              <p>{{ event.notes }}</p>
            </ion-label>
          </ion-item>
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
  IonButton,
  alertController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  addOutline,
  readerOutline,
  timeOutline,
  repeatOutline,
  layersOutline,
  documentOutline,
  createOutline,
  saveOutline,
  alarmOutline,
} from "ionicons/icons";
import eventsService from "../../../../services/event.vue";
import userService from "../../../../services/user.vue";
import { Storage } from "@ionic/storage";

export default defineComponent({
  name: "Evento",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
  },
  setup() {
    return {
      chevronBackOutline,
      addOutline,
      readerOutline,
      timeOutline,
      repeatOutline,
      layersOutline,
      documentOutline,
      createOutline,
      saveOutline,
      alarmOutline,
    };
  },
  data() {
    const id = parseInt(this.$route.params.id as string);
    const storage = new Storage();
    storage.create();
    return {
      id,
      event: {
        title: "",
        timeStart: "",
        timeEnd: "",
        reminders: [],
        repeats: [],
        calendar: "",
        notes: "",
      },
      storage,
    };
  },
  mounted() {
    this.getEventLocal();
  },
  methods: {
    editEvent() {
      this.$router.push("/event/update/" + this.id);
    },
    selectTime() {
      this.$router.push("/horario");
    },
    selectRepeat() {
      this.$router.push("/repetir");
    },
    async presentAlertReminder() {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Checkbox",
        inputs: [
          {
            type: "checkbox",
            label: "A tiempo",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "5 minutos antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "15 minutos antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "30 minutos antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "1 hora antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "4 hora antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "1 dia antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "2 dias antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
          {
            type: "checkbox",
            label: "1 semana antes",
            handler: () => {
              console.log("Checkbox 1 selected");
            },
          },
        ],
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
            handler: () => {
              console.log("Confirm Cancel");
            },
          },
          {
            text: "Ok",
            handler: () => {
              console.log("Confirm Ok");
            },
          },
        ],
      });
      return alert.present();
    },
    async presentAlertCalendar() {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Calendario",
        inputs: [
          {
            type: "radio",
            label: "Personal",
            handler: () => {
              console.log("Radio 1 selected");
            },
          },
        ],
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
            handler: () => {
              console.log("Confirm Cancel");
            },
          },
          {
            text: "Ok",
            handler: () => {
              console.log("Confirm Ok");
            },
          },
        ],
      });
      return alert.present();
    },
    async getEventLocal() {
      const event = await eventsService()
        .getEventLocal(this.id)
        .then((response) => {
          return response;
        });

      if (event.length) {
        event.forEach(async (element: any) => {
          this.event.title = element.title;
          this.event.timeStart = element.time_start;
          this.event.timeEnd = element.time_end;
          this.event.reminders = element.reminders;
          this.event.repeats = element.repeats;
          this.event.calendar = element.calendar;
          this.event.notes = element.notes;
        });
      }
    },
  },
});
</script>
