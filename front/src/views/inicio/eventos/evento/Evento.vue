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
          <ion-button v-if="buttonEdit == true" v-on:click="editEvent()">
            <ion-icon slot="start" :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button v-if="buttonEdit == false" v-on:click="saveEvent()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none" v-if="buttonEdit == true">
            <ion-icon slot="start" :icon="readerOutline"></ion-icon>
            <ion-label class="ion-text-wrap">{{ title }}</ion-label>
          </ion-item>
          <ion-item v-if="buttonEdit == false">
            <ion-icon slot="start" :icon="readerOutline"></ion-icon>
            <ion-label position="floating">Titulo</ion-label>
            <ion-input type="text" v-model="title"></ion-input>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none" v-if="buttonEdit == true">
            <ion-icon slot="start" :icon="timeOutline"></ion-icon>
            <ion-label class="ion-text-wrap">{{ time }}</ion-label>
          </ion-item>
          <ion-item v-if="buttonEdit == false" button v-on:click="selectTime()">
            <ion-icon slot="start" :icon="timeOutline"></ion-icon>
            <ion-label position="floating">Horario</ion-label>
            <ion-input type="text" v-model="time"></ion-input>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none" v-if="buttonEdit == true">
            <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
            <ion-label class="ion-text-wrap">{{ reminder }}</ion-label>
          </ion-item>
          <ion-item
            v-if="buttonEdit == false"
            button
            v-on:click="presentAlertReminder()"
          >
            <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
            <ion-label position="floating">Recodartorios</ion-label>
            <ion-input type="text" v-model="reminder"></ion-input>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none" v-if="buttonEdit == true">
            <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
            <ion-label>{{ repeat }}</ion-label>
          </ion-item>
          <ion-item
            v-if="buttonEdit == false"
            button
            v-on:click="selectRepeat()"
          >
            <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
            <ion-label position="floating">Repetir</ion-label>
            <ion-input type="text" v-model="repeat"></ion-input>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none" v-if="buttonEdit == true">
            <ion-icon slot="start" :icon="layersOutline"></ion-icon>
            <ion-label>{{ calendar }}</ion-label>
          </ion-item>
          <ion-item
            v-if="buttonEdit == false"
            button
            v-on:click="presentAlertCalendar()"
          >
            <ion-icon slot="start" :icon="layersOutline"></ion-icon>
            <ion-label position="floating">Calendario</ion-label>
            <ion-input type="text" v-model="calendar"></ion-input>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="12">
          <ion-item lines="none" v-if="buttonEdit == true">
            <ion-label class="ion-text-wrap">{{ notes }}</ion-label>
          </ion-item>
          <ion-item v-if="buttonEdit == false">
            <ion-icon slot="start" :icon="readerOutline"></ion-icon>
            <ion-label position="floating">Notas</ion-label>
            <ion-textarea
              type="text"
              v-model="notes"
              autoGrow
              :rows="4"
            ></ion-textarea>
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
  IonInput,
  IonTextarea,
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
export default defineComponent({
  name: "Evento",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInput,
    IonTextarea,
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
      title: "Hacer tarea",
      time: " 9:00 a.m. - 10:00 a.m.",
      reminder: "5 mn antes",
      repeat: "L-M-M-D",
      notes:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      calendar: "personal",
    };
  },
  data() {
    return { buttonEdit: true };
  },
  methods: {
    editEvent() {
      this.buttonEdit = !this.buttonEdit;
    },
    saveEvent() {
      this.buttonEdit = !this.buttonEdit;
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
  },
});
</script>
