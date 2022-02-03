<template>
  <ion-refresher slot="fixed" @ionRefresh="refreshContent($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <ion-accordion-group>
    <ion-row v-for="event in events" v-bind:key="event" class="center">
      <ion-col size="12" size-md="6">
        <ion-card>
          <ion-accordion :value="Math.random()">
            <ion-card-header slot="header">
              <ion-card-title>{{ event.title }}</ion-card-title>
              <ion-card-subtitle>{{ event.calendar.name }}</ion-card-subtitle>
              <ion-card-subtitle v-if="event.timeStart != ''">
                {{ event.timeStart }}
              </ion-card-subtitle>
              <ion-card-subtitle v-if="event.timeEnd != ''">
                {{ event.timeEnd }}
              </ion-card-subtitle>
            </ion-card-header>

            <ion-list slot="content">
              <ion-item lines="none">
                <ion-button
                  fill="clear"
                  slot="end"
                  @click="updateEvent(event.id)"
                >
                  <ion-icon :icon="createOutline"></ion-icon>
                </ion-button>
                <ion-button
                  fill="clear"
                  color="danger"
                  slot="end"
                  @click="presentAlertRemoveEvent(event.id)"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </ion-list>

            <ion-list-header slot="content">
              <ion-label>Recordatorios</ion-label>
            </ion-list-header>
            <ion-list slot="content" style="padding-left: 10px">
              <div>
                <ion-chip
                  color="primary"
                  v-for="reminder in event.reminders"
                  :key="reminder"
                >
                  {{ reminder }}
                </ion-chip>
              </div>
            </ion-list>

            <ion-list-header slot="content">
              <ion-label>Repetir</ion-label>
            </ion-list-header>
            <ion-list slot="content" style="padding-left: 10px">
              <!-- TODO: mostrar data -->
              <div>
                <ion-chip
                  color="primary"
                  v-for="repeat in event.repeats"
                  :key="repeat"
                >
                  {{ repeat.frequency }}
                </ion-chip>
              </div>
            </ion-list>

            <ion-list-header slot="content">
              <ion-label>Invitados</ion-label>
            </ion-list-header>
            <ion-list slot="content" style="padding-left: 10px">
              <div>
                <ion-chip
                  color="primary"
                  v-for="guest in event.guests"
                  :key="guest"
                >
                  {{ guest }}
                </ion-chip>
              </div>
            </ion-list>

            <ion-list-header slot="content">
              <ion-label>Etiquetas</ion-label>
            </ion-list-header>
            <ion-list slot="content">
              <div style="padding-left: 10px">
                <ion-chip color="primary" v-for="tag in event.tags" :key="tag">
                  {{ tag.name }}
                </ion-chip>
              </div>
            </ion-list>

            <ion-list-header slot="content">
              <ion-label>Notas</ion-label>
            </ion-list-header>
            <ion-list slot="content">
              <ion-item lines="none">
                <ion-label class="ion-text-wrap">{{ event.notes }}</ion-label>
              </ion-item>
            </ion-list>
          </ion-accordion>
        </ion-card>
      </ion-col>
    </ion-row>
  </ion-accordion-group>
</template>

<script lang="ts">
import {
  IonRefresher,
  modalController,
  loadingController,
  toastController,
  alertController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import eventService from "../../services/event.vue";
import { Storage } from "@ionic/storage";
import Event from "./evento/Evento.vue";
import eventBus from "../../EventBus";
import { formatISO, add } from "date-fns";
import { createOutline, trashOutline } from "ionicons/icons";
import userService from "../../services/user.vue";

export default defineComponent({
  name: "Eventos",
  setup() {
    return {
      IonRefresher,
      createOutline,
      trashOutline,
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
      fileTranslate: Array<any>(),
    };
  },
  mounted() {
    this.getEvents();
    this.getFileTranslate();
    eventBus().emitter.on("refresh-events", (response: any) => {
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
      const loading = await this.presentLoading();
      loading.present();

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
        element.guests = JSON.parse(element.guests);
        element.reminders = JSON.parse(element.reminders);
        element.repeats = JSON.parse(element.repeats);
        element.type = "event";
      });

      this.events = events.data;
      loading.dismiss();
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
    async presentLoading() {
      const loading = await loadingController.create({
        cssClass: "my-custom-class",
        message: this.fileTranslate[0].pleaseWait,
      });
      return loading;
    },
    updateEvent(id: number | string) {
      this.$router.push("/event/update/" + id);
    },
    async removeEvent(id: string | number) {
      const loading = await this.presentLoading();
      loading.present();
      eventService()
        .removeEvent(id)
        .then((response: any) => {
          this.getEvents();
          const message = this.fileTranslate[0].removeEvent;
          this.openToast(message, "success");
          loading.dismiss();
        })
        .catch((e) => {
          loading.dismiss();
        });
    },
    async openToast(message: string, color: string) {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
      });
      return toast.present();
    },
    async presentAlertRemoveEvent(id: string | number) {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Borrar evento",
        message: "¿Continuar con el borrado?",

        buttons: [
          {
            text: "Confirmar",
            id: "confirm-button",
            handler: () => {
              this.removeEvent(id);
            },
          },

          {
            text: "Cancelar",
            role: "cancel",
            cssClass: "secondary",
            id: "cancel-button",
            handler: (blah) => {
              console.log("Confirm Cancel:", blah);
            },
          },
        ],
      });
      return alert.present();
    },
    async getFileTranslate() {
      this.fileTranslate = [await userService().translate()];
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
