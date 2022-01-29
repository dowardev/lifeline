<template>
  <ion-refresher slot="fixed" @ionRefresh="refreshContent($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <ion-row v-for="event in events" v-bind:key="event" class="center">
    <ion-col size="12" size-lg="6">
      <ion-card class="cardEvent" @click="openEvent(event)">
        <ion-card-content>
          <ion-card-title>{{ event.title }}</ion-card-title>
          <ion-card-subtitle>{{ event.calendar }}</ion-card-subtitle>
          <p v-if="event.timeStart != ''">{{ event.timeStart }}</p>
          <p v-if="event.timeEnd != ''">{{ event.timeEnd }}</p>
        </ion-card-content>
      </ion-card>
    </ion-col>
  </ion-row>
</template>

<script lang="ts">
import { IonRefresher, modalController } from "@ionic/vue";
import { defineComponent } from "vue";
import eventService from "../../services/event.vue";
import { Storage } from "@ionic/storage";
import Event from "./evento/Evento.vue";
import eventBus from "../../EventBus";
import { formatISO, add } from "date-fns";

export default defineComponent({
  name: "Eventos",
  setup() {
    return {
      IonRefresher,
    };
  },
  data() {
    const date = formatISO(new Date()).split("T")[0];
    const storage = new Storage();

    storage.create();
    return {
      events: [] as Array<any>,
      storage,
      date,
    };
  },
  mounted() {
    this.getEvents();
    eventBus().emitter.on("new-element", (response: any) => {
      this.getEvents();
    });
    eventBus().emitter.on("select-day", (response: any) => {
      this.date = response.date.split("T")[0];
      this.getEvents();
    });
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
      const dateEnd = formatISO(
        new Date(
          add(new Date(this.date), {
            days: 2,
          })
        )
      ).split("T")[0];
      const events = await eventService()
        .getEvents(this.date, dateEnd)
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
      });

      this.events = events.data;
      this.storage.set("events", JSON.stringify(events.data));
    },
    formatDate(date: string, format: string) {
      if (date == null) {
        return "";
      }
      return eventService().formatDateTime(date, format);
    },
    refreshContent(event: any) {
      setTimeout(async () => {
        this.getEvents();
      }, 200);
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
