<template>
  <ion-refresher slot="fixed" @ion-refresh="refreshContent($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <ion-accordion-group :multiple="true">
    <ion-list v-for="(event, name) in formatEvents" :key="name">
      <ion-list-header>{{ formatTimeLine(name) }}</ion-list-header>
      <ion-row v-for="dataEvent in event" :key="dataEvent" class="center">
        <ion-col size="12" size-md="10" size-lg="6">
          <ion-card>
            <ion-accordion :value="Math.random()">
              <ion-card-header slot="header">
                <ion-card-title v-if="dataEvent.title == 'no title'">{{
                  capitalizeFirstLetter($t("message.noTitle"))
                }}</ion-card-title>
                <ion-card-title v-if="dataEvent.title != 'no title'">{{
                  dataEvent.title
                }}</ion-card-title>
                <ion-card-subtitle>{{
                  dataEvent.calendar.name
                }}</ion-card-subtitle>
                <ion-card-subtitle v-if="dataEvent.timeStart != ''">
                  {{ dataEvent.timeStart }}
                </ion-card-subtitle>
                <ion-card-subtitle v-if="dataEvent.timeStart != ''">
                  {{ dataEvent.timeEnd }}
                </ion-card-subtitle>
              </ion-card-header>

              <!-- action buttons -->
              <section slot="content">
                <ion-list>
                  <ion-item lines="none">
                    <ion-button
                      slot="end"
                      fill="clear"
                      @click="updateEvent(dataEvent.id)"
                    >
                      <ion-icon :icon="createOutline"></ion-icon>
                    </ion-button>
                    <ion-button
                      slot="end"
                      fill="clear"
                      color="danger"
                      @click="presentAlertRemoveEvent(dataEvent.id)"
                    >
                      <ion-icon :icon="trashOutline"></ion-icon>
                    </ion-button>
                  </ion-item>
                </ion-list>
              </section>

              <!-- time zone -->
              <section slot="content">
                <ion-list>
                  <ion-list-header>
                    <ion-label>{{
                      capitalizeFirstLetter($t("message.timeZone"))
                    }}</ion-label>
                  </ion-list-header>
                  <ion-item lines="full">
                    <ion-label>{{ dataEvent.timeZone }}</ion-label>
                  </ion-item>
                </ion-list>
              </section>

              <!-- reminders -->
              <section v-if="dataEvent.reminders.length > 0" slot="content">
                <ion-list>
                  <ion-list-header>
                    <ion-label>{{
                      capitalizeFirstLetter($tc("message.reminder", 2))
                    }}</ion-label>
                  </ion-list-header>

                  <div
                    style="overflow-x: scroll"
                    class="ion-padding-start ion-padding-end"
                  >
                    <div style="display: inline-flex">
                      <ion-chip
                        v-for="reminder in dataEvent.reminders"
                        :key="reminder"
                        color="primary"
                        style="text-align: center"
                      >
                        {{ tranlateRemindrers(reminder) }}
                      </ion-chip>
                    </div>
                  </div>
                </ion-list>
                <hr style="border-top: 1px solid rgb(222 222 222)" />
              </section>

              <!-- Repeats -->
              <section slot="content">
                <ion-list>
                  <ion-list-header>
                    <ion-label>{{
                      capitalizeFirstLetter($t("message.repeat"))
                    }}</ion-label>
                  </ion-list-header>
                  <ion-item lines="full">
                    <ion-label>{{
                      capitalizeFirstLetter(
                        $t(`message.${dataEvent.repeats.frequency}`)
                      )
                    }}</ion-label>
                  </ion-item>
                </ion-list>
              </section>

              <!-- guests -->
              <section v-if="dataEvent.guests.length > 0" slot="content">
                <ion-list>
                  <ion-list-header>
                    <ion-label>{{
                      capitalizeFirstLetter($tc("message.guest", 2))
                    }}</ion-label>
                  </ion-list-header>
                  <div
                    style="overflow-x: scroll"
                    class="ion-padding-start ion-padding-end"
                  >
                    <div style="display: inline-flex">
                      <ion-chip
                        v-for="guest in dataEvent.guests"
                        :key="guest"
                        color="primary"
                      >
                        {{ guest }}
                      </ion-chip>
                    </div>
                  </div>
                </ion-list>
              </section>

              <!-- tags -->
              <section v-if="dataEvent.tags.length > 0" slot="content">
                <ion-list>
                  <ion-list-header>
                    <ion-label>{{
                      capitalizeFirstLetter($tc("message.tag", 2))
                    }}</ion-label>
                  </ion-list-header>
                  <div
                    style="overflow-x: scroll"
                    class="ion-padding-start ion-padding-end"
                  >
                    <div style="display: inline-flex">
                      <ion-chip
                        v-for="tag in dataEvent.tags"
                        :key="tag"
                        color="primary"
                      >
                        {{ tag.name }}
                      </ion-chip>
                    </div>
                  </div>
                </ion-list>
                <hr style="border-top: 1px solid rgb(222 222 222)" />
              </section>

              <!-- notes -->
              <section
                v-if="dataEvent.notes && dataEvent.notes.length > 0"
                slot="content"
              >
                <ion-list>
                  <ion-list-header>
                    <ion-label>{{
                      capitalizeFirstLetter($tc("message.note", 2))
                    }}</ion-label>
                  </ion-list-header>
                  <div class="ion-padding-start ion-padding-end">
                    <ion-label class="ion-text-wrap">{{
                      dataEvent.notes
                    }}</ion-label>
                  </div>
                </ion-list>
              </section>
            </ion-accordion>
          </ion-card>
        </ion-col>
      </ion-row>
    </ion-list>
  </ion-accordion-group>
</template>

<script lang="ts">
import {
  IonRefresher,
  modalController,
  loadingController,
  toastController,
  alertController,
  IonList,
  IonListHeader,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  getEvents as getEventsService,
  removeEvent as removeEventService,
  formatDateTime as formatDateTimeService,
} from "../../services/event";
import { Storage } from "@ionic/storage";
import EventComponent from "./evento/Evento.vue";
// import eventBus from "../../EventBus";
import { formatISO, add } from "date-fns";
import { createOutline, trashOutline } from "ionicons/icons";
// import userService from "../../services/user";
import {
  zonedTimeToUtc,
  utcToZonedTime,
  format,
  formatInTimeZone,
} from "date-fns-tz";
import { USER_EVENTS } from "../../services/graphql";
import { capitalizeFirstLetter } from "../../services/system";
import { useEventsStore } from "../../store/eventsStore";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "EventosPage",
  setup() {
    const eventsStore = useEventsStore();
    const { events } = storeToRefs(eventsStore);
    return {
      IonRefresher,
      createOutline,
      trashOutline,
      IonList,
      IonListHeader,
      capitalizeFirstLetter: capitalizeFirstLetter,
      format: format,
      events,
      eventsStore,
    };
  },

  data() {
    const date = formatISO(new Date()).split("T")[0];
    const storage = new Storage();

    storage.create();
    return {
      storage,
      date,
      fileTranslate: Array<any>(),
    };
  },

  computed: {
    formatTimeLine() {
      return (hour: string | number) =>
        format(new Date("1/1/1, " + hour + ":00"), "p");
    },
    formatEvents() {
      const events = JSON.parse(JSON.stringify(this.events));
      events.forEach((element: any) => {
        element.title = element.title != "" ? element.title : "no title";

        const timeStart = formatISO(new Date(element.timeStart));
        element.timeStart = format(
          utcToZonedTime(timeStart, element.timeZone),
          "Pp"
        );

        const timeEnd = formatISO(new Date(element.timeEnd));
        element.timeEnd = format(
          utcToZonedTime(timeEnd, element.timeZone),
          "Pp"
        );

        element.hour = format(new Date(timeStart), "H");
      });

      return events.reduce((accumulator: any, arrayItem: any) => {
        let hour = arrayItem.hour;
        if (accumulator[hour] == null) accumulator[hour] = [];
        accumulator[hour].push(arrayItem);
        return accumulator;
      }, {});
    },
  },

  mounted() {
    this.getEvents();
    // this.getFileTranslate().then((response) => {
    //   this.getEvents();
    // });
    // eventBus().emitter.on("refresh-events", (response: any) => {
    //   this.getEvents();
    // });
    // eventBus().emitter.on("select-day", (response: any) => {
    //   this.date = response.date.split("T")[0];
    //   this.getEvents();
    // });
  },

  methods: {
    async openEvent(event: object) {
      const modal = await modalController.create({
        component: EventComponent,
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
      // const loading = await this.presentLoading();
      // loading.present();

      const dateStart = this.date;
      const dateEnd = formatISO(
        new Date(
          add(new Date(this.date), {
            days: 2,
          })
        )
      ).split("T")[0];

      let events = [] as any;
      try {
        events = await getEventsService({
          dateStart,
          dateEnd,
          graphql: {
            name: USER_EVENTS,
            fragment: "Events",
          },
        });
      } catch (error) {
        console.error(error);
      }
      events = JSON.parse(JSON.stringify(events));
      this.eventsStore.getEvents(events);
    },

    formatDate(date: string | Date, format: string) {
      if (date == null) {
        return "";
      }
      return formatDateTimeService(date, format);
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
      removeEventService(id)
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

    tranlateRemindrers(reminder: string): string {
      if (reminder == "just")
        return this.capitalizeFirstLetter(this.$t("message.inTime"));
      if (reminder == "5mnb") return "5 " + this.$tc("message.minuteBefore", 2);
      if (reminder == "15mnb")
        return "15 " + this.$tc("message.minuteBefore", 2);
      if (reminder == "30mnb")
        return "30 " + this.$tc("message.minuteBefore", 2);
      if (reminder == "1hrb") return "1 " + this.$tc("message.hourBefore", 2);
      if (reminder == "4hrb") return "4 " + this.$tc("message.hourBefore", 2);
      if (reminder == "1db") return "1 " + this.$tc("message.dayBefore", 2);
      if (reminder == "2db") return "2 " + this.$tc("message.dayBefore", 2);
      if (reminder == "1sb") return "1 " + this.$tc("message.weekBefore", 2);
      return reminder;
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
