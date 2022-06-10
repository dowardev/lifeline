<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="closeModal()">
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
              <p>{{ event?.title }}</p>
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
              <p>{{ event?.timeStart }}</p>
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
              <p>{{ event?.timeEnd }}</p>
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row v-if="event?.reminders.length > 0">
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
            <ion-label class="ion-text-wrap"
              ><h2>Recodartorio</h2>
              <ion-chip
                color="primary"
                v-for="reminder in event?.reminders"
                :key="reminder"
                >{{ reminder }}</ion-chip
              >
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>
      <ion-row v-if="event?.repeats.frecuency != null">
        <ion-col size="12">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
            <ion-label
              ><h2>Repetir</h2>
              <p>{{ event?.repeats.frecuency }}</p>
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
              <p>{{ event?.calendar }}</p>
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
              <p>{{ event?.notes }}</p>
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
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  readerOutline,
  timeOutline,
  repeatOutline,
  layersOutline,
  createOutline,
  alarmOutline,
} from "ionicons/icons";

export default defineComponent({
  name: "EventoPage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
  },
  props: {
    event: { type: Object },
  },
  setup() {
    return {
      chevronBackOutline,
      readerOutline,
      timeOutline,
      repeatOutline,
      layersOutline,
      createOutline,
      alarmOutline,
    };
  },

  methods: {
    editEvent() {
      this.$router.push("/event/update/" + this.event?.id);
    },
    closeModal() {
      modalController.dismiss();
    },
  },
});
</script>
