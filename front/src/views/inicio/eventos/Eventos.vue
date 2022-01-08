<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createEvent()">
            <ion-icon slot="start" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="refreshContent($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-row>
        <ion-col size="12" v-for="event in events" v-bind:key="event">
          <ion-card class="cardEvent" @click="openEvent(event)">
            <ion-card-header>
              <ion-card-title>{{ event.title }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p style="display: inline-block">{{ event.calendar }}</p>
              <div style="display: inline-block; margin-left: 10px">
                <ion-icon
                  :icon="timerOutline"
                  v-if="event.reminders.length > 0"
                ></ion-icon>
                <ion-icon
                  :icon="repeatOutline"
                  style="margin-left: 6px"
                  v-if="event.repeats.frecuency != null"
                ></ion-icon>
              </div>
              <p>{{ event.timeStart }}</p>
              <p>{{ event.timeStart }}</p>
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
  IonButton,
  IonRefresher,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  addOutline,
  timerOutline,
  repeatOutline,
} from "ionicons/icons";
import { useRoute } from "vue-router";
import eventService from "../../../services/event.vue";
import userService from "../../../services/user.vue";
import { Storage } from "@ionic/storage";
import Event from "./evento/Evento.vue";

export default defineComponent({
  name: "Eventos",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
  },
  setup() {
    const route = useRoute();
    const date = route.params.date as string;
    const titulo = date.replaceAll("-", "/");
    return {
      chevronBackOutline,
      addOutline,
      titulo,
      IonRefresher,
      timerOutline,
      repeatOutline,
    };
  },
  data() {
    const storage = new Storage();
    storage.create();
    return {
      events: [] as Array<any>,
      storage,
    };
  },
  mounted() {
    this.getEvents();
  },
  methods: {
    async openEvent(event: object) {
      const modal = await modalController.create({
        component: Event,
        componentProps: {
          event,
        },
      });
      return modal.present();
    },
    createEvent() {
      this.$router.push({ name: "CreateEvent" });
    },
    async getEvents() {
      const events = await eventService()
        .getEvents()
        .then((response: any) => {
          return response;
        });

      events.data.forEach(async (element: any) => {
        element.timeStart =
          this.formatDate(element.time_start, "P") +
          " " +
          this.formatDate(element.time_start, "pp");
        element.timeEnd =
          this.formatDate(element.time_end, "P") +
          " " +
          this.formatDate(element.time_end, "pp");
        element.type = "event";
        element.repeats.frecuency = await userService().translate(
          element.repeats.frecuency
        );
      });

      this.events = events.data;
      console.log(this.events);
      this.storage.set("events", JSON.stringify(events.data));
    },
    formatDate(date: string, format: string) {
      return eventService().formatDateTime(date, format);
    },
    refreshContent(event: any) {
      setTimeout(async () => {
        this.getEvents();
      }, 2000);
    },
  },
});
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
.cardEvent {
  --background: #e6dbff;
}
.optionselected {
  color: #3880ff;
}
</style>
