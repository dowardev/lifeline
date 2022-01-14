<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="firstMenu" mode="md"></ion-menu-button>
        </ion-buttons>
        <ion-title>Inicio</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="openModalCalendar()">
            <ion-icon :icon="calendarOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar class="ion-no-border" :translucent="true">
        <ion-segment v-model="mainSegment">
          <ion-segment-button value="calendar">
            <ion-label>Calendario</ion-label>
          </ion-segment-button>
          <ion-segment-button value="notes" disabled>
            <ion-label>Otros</ion-label>
          </ion-segment-button>
          <ion-segment-button value="khanban" disabled>
            <ion-label>Otros</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <section>
        <Eventos v-if="mainSegment == 'calendar'"></Eventos>
      </section>

      <section v-if="mainSegment == 'notes'">
        <ion-row>
          <ion-col size="12"> </ion-col>
        </ion-row>
      </section>

      <section v-if="mainSegment == 'khanban'">
        <ion-row>
          <ion-col size="12"> </ion-col>
        </ion-row>
      </section>
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
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { calendarOutline, documentTextOutline } from "ionicons/icons";
import Calendar from "../calendar/Calendar.vue";
import Eventos from "../eventos/Eventos.vue";

export default defineComponent({
  name: "Inicio",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonTitle,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonButton,
    Eventos,
  },
  setup() {
    return { calendarOutline, documentTextOutline };
  },
  data() {
    return { mainSegment: "calendar" };
  },
  methods: {
    async openModalCalendar() {
      const modal = await modalController.create({
        component: Calendar,
        componentProps: {
          title: "New Title",
        },
      });
      return modal.present();
    },
  },
});
</script>
