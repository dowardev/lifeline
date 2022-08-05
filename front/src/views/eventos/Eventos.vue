<template>
  <ion-refresher slot="fixed" @ion-refresh="refreshContent($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <ion-accordion-group>
    <ion-row v-for="event in events" :key="event" class="center">
      <ion-col size="12" size-md="10" size-lg="6">
        <ion-card>
          <ion-accordion :value="Math.random()">
            <ion-card-header slot="header">
              <ion-card-title v-if="event.title == 'no title'">{{
                capitalizeFirstLetter($t("message.noTitle"))
              }}</ion-card-title>
              <ion-card-title v-if="event.title != 'no title'">{{
                event.title
              }}</ion-card-title>
              <ion-card-subtitle>{{ event.calendar.name }}</ion-card-subtitle>
              <ion-card-subtitle v-if="event.timeStart != ''">
                {{ event.timeStart }}
              </ion-card-subtitle>
              <ion-card-subtitle v-if="event.timeStart != ''">
                {{ event.timeEnd }}
              </ion-card-subtitle>
            </ion-card-header>

            <!-- action buttons -->
            <section slot="content">
              <ion-list>
                <ion-item lines="none">
                  <ion-button
                    slot="end"
                    fill="clear"
                    @click="updateEvent(event.id)"
                  >
                    <ion-icon :icon="createOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    slot="end"
                    fill="clear"
                    color="danger"
                    @click="presentAlertRemoveEvent(event.id)"
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
                  <ion-label>{{ event.timeZone }}</ion-label>
                </ion-item>
              </ion-list>
            </section>

            <!-- Reminders -->
            <section v-if="event.reminders.length > 0" slot="content">
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
                      v-for="reminder in event.reminders"
                      :key="reminder"
                      color="primary"
                    >
                      {{ reminder }}
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
                      $t(`message.${event.repeats.frequency}`)
                    )
                  }}</ion-label>
                </ion-item>
              </ion-list>
            </section>

            <!-- guests -->
            <section v-if="event.guests.length > 0" slot="content">
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
                      v-for="guest in event.guests"
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
            <section v-if="event.tags.length > 0" slot="content">
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
                      v-for="tag in event.tags"
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
              v-if="event.notes && event.notes.length > 0"
              slot="content"
            >
              <ion-list>
                <ion-list-header>
                  <ion-label>{{
                    capitalizeFirstLetter($tc("message.note", 2))
                  }}</ion-label>
                </ion-list-header>
                <div class="ion-padding-start ion-padding-end">
                  <ion-label class="ion-text-wrap">{{ event.notes }}</ion-label>
                </div>
              </ion-list>
            </section>
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

export default defineComponent({
  name: "EventosPage",
  setup() {
    return {
      IonRefresher,
      createOutline,
      trashOutline,
      IonList,
      IonListHeader,
      capitalizeFirstLetter: capitalizeFirstLetter,
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
      events.forEach((item: any) => {
        item.timeStart = item.time_start;
        delete item.time_start;
        item.timeEnd = item.time_end;
        delete item.time_end;
        item.timeZone = item.time_zone;
        delete item.time_zone;
      });

      events.forEach(async (element: any) => {
        const timeStart = formatISO(new Date(element.timeStart + "Z"));
        element.timeStart = format(
          utcToZonedTime(timeStart, element.timeZone),
          "Pp"
        );

        const timeEnd = formatISO(new Date(element.timeEnd + "Z"));
        element.timeEnd = format(
          utcToZonedTime(timeEnd, element.timeZone),
          "Pp"
        );

        // if (
        //   Intl.DateTimeFormat().resolvedOptions().timeZone == element.time_zone
        // ) {
        //   element.timeStart =
        //     this.formatDate(element.time_start, "P") +
        //     " " +
        //     this.formatDate(element.time_start + "Z", "pp");
        //   element.timeEnd =
        //     this.formatDate(element.time_end, "P") +
        //     " " +
        //     this.formatDate(element.time_end + "Z", "pp");
        // } else {
        //   const formatStart = utcToZonedTime(
        //     new Date(element.time_start + "Z"),
        //     element.time_zone
        //   );
        //   element.timeStart =
        //     this.formatDate(formatStart, "P") +
        //     " " +
        //     this.formatDate(formatStart, "pp");
        //   const formatEnd = utcToZonedTime(
        //     new Date(element.time_end + "Z"),
        //     element.time_zone
        //   );
        //   element.timeEnd =
        //     this.formatDate(formatEnd, "P") +
        //     " " +
        //     this.formatDate(formatEnd, "pp");
        // }

        element.guests = JSON.parse(element.guests);
        element.reminders = JSON.parse(element.reminders);
        element.repeats = JSON.parse(element.repeats);
        element.tags = JSON.parse(element.tags);
        // element.type = "event";
      });

      this.events = events;
      this.storage.set("events", JSON.stringify(events));
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
    // async getFileTranslate() {
    //   this.fileTranslate = [await userService().translate()];
    // },
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
