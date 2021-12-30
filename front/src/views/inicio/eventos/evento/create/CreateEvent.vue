<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">

      <ion-row>
        <ion-col size="12">
          <ion-list>
            <ion-item lines="none">
              <ion-icon slot="start" :icon="readerOutline"></ion-icon>
              <ion-label position="floating">Titulo</ion-label>
              <ion-input type="text" v-model="title"></ion-input>
            </ion-item>
            <small
              class="error ion-padding"
              v-if="errors.titleEmpty.show == true"
              >{{ errors.titleEmpty.message }}</small
            >

            <ion-item lines="none" button v-on:click="selectTime()">
              <ion-icon slot="start" :icon="timeOutline"></ion-icon>
              <ion-label>
                <h2>Horario</h2>
                <p>
                  {{
                    formatDateTime(datetime.start, "P") +
                    " " +
                    formatDateTime(datetime.start, "p")
                  }}
                </p>
                <p>
                  {{
                    formatDateTime(datetime.end, "P") +
                    " " +
                    formatDateTime(datetime.end, "p")
                  }}
                </p>
              </ion-label>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectReminders()">
              <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
              <ion-label>
                <h2>Recordatorio(s)</h2>
                <div
                  v-for="reminder in reminders"
                  :key="reminder"
                  style="display: inline-block"
                >
                  <ion-chip color="primary">
                    <ion-label>{{ reminder }}</ion-label>
                  </ion-chip>
                </div>
              </ion-label>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectRepeat()">
              <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
              <ion-label
                ><h2>Repetir</h2>
                <p>{{ repeats.frecuencyName }}</p></ion-label
              >
            </ion-item>

            <ion-item lines="none">
              <ion-icon slot="start" :icon="layersOutline"></ion-icon>
              <ion-label position="floating">Calendario</ion-label>
              <ion-select
                :interface-options="customAlertOptions"
                interface="alert"
                ok-text="Aceptar"
                cancel-text="Cancelar"
                v-model="calendar"
              >
                <ion-select-option value="personal">Personal</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item lines="none">
              <ion-icon slot="start" :icon="readerOutline"></ion-icon>
              <ion-label position="floating">Notas</ion-label>
              <ion-textarea
                type="text"
                v-model="notes"
                autoGrow
                :rows="4"
              ></ion-textarea>
            </ion-item>
          </ion-list>
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
  IonSelect,
  IonSelectOption,
  toastController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  readerOutline,
  timeOutline,
  repeatOutline,
  layersOutline,
  saveOutline,
  alarmOutline,
} from "ionicons/icons";
import eventBus from "../../../../../EventBus";
import eventsService from "../../../../../services/event.vue";
import userService from "../../../../../services/user.vue";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";

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
    IonSelect,
  },
  setup() {
    const customAlertOptions: any = {
      header: "Calendario",
    };
    return {
      chevronBackOutline,
      readerOutline,
      timeOutline,
      repeatOutline,
      layersOutline,
      saveOutline,
      alarmOutline,
      IonInput,
      IonSelectOption,
    };
  },
  data() {
    const pageTitle = "Agregar evento";
    const storage = new Storage();
    storage.create();
    const today = new Date().toLocaleString("sv").replace(" ", "T");
    return {
      buttonEdit: true,
      pageTitle,
      event: {
        id: 0,
        title: "",
        repeats: {
          frecuency: "",
          data: [],
        },
        reminders: [],
        calendar: "",
        notes: "",
      },
      reminders: [],
      title: "",
      datetime: {
        start: today,
        end: new Date(add(new Date(), { days: 1 }))
          .toLocaleString("sv")
          .replace(" ", "T"),
      },
      repeats: {
        frecuencyName: "",
        frecuency: "",
        data: {},
      },
      notes: "",
      calendar: "",
      errors: {
        titleEmpty: { message: "Campo requerido", show: false },
      },
      storage,
    };
  },
  mounted() {
    if (this.$route.params.id) {
      this.pageTitle = "Actualizar evento";
      this.getEventLocal(parseInt(this.$route.params.id as string));
    }
    eventBus().emitter.on("set-schedule-event", (response: any) => {
      this.datetime.start = response.dateTimeStart;
      this.datetime.end = response.dateTimeEnd;
    });
    eventBus().emitter.on("set-reminder-event", (response: any) => {
      this.reminders = response.reminders;
    });
    eventBus().emitter.on("set-repeat-event", async (response: any) => {
      this.repeats.frecuencyName = await userService().translate(
        response.frecuency
      );
      this.repeats.frecuency = response.frecuency;
      this.repeats.data = response.data;
    });
    eventBus().emitter.on("update-event", async (response: any) => {
      console.log(response.event);
      this.event = response.event;
      this.pageTitle = "Actualizar evento";
      //  this.getEvent();
    });
  },
  methods: {
    editEvent() {
      this.buttonEdit = !this.buttonEdit;
    },
    selectTime() {
      this.$router.push("/horario");
      setTimeout(() => {
        eventBus().emitter.emit("get-schedule-event", {
          dateTimeStart: this.datetime.start,
          dateTimeEnd: this.datetime.end,
        });
      }, 300);
    },
    selectRepeat() {
      this.$router.push("/repetir");
      setTimeout(() => {
        eventBus().emitter.emit("get-repeat-event", {
          reminders: JSON.parse(JSON.stringify(this.repeats)),
        });
      }, 300);
    },
    selectReminders() {
      this.$router.push("/recordatorios");
      setTimeout(() => {
        eventBus().emitter.emit("get-reminder-event", {
          reminders: JSON.parse(JSON.stringify(this.reminders)),
        });
      }, 300);
    },
    save() {
      /*
      const error = this.errorsValidation();
      if (error == false) return;
*/
      const title = this.title;
      const dateTime = {
        start: {
          date: new Date(this.datetime.start).toISOString().split("T")[0],
          time: new Date(this.datetime.start).toISOString().split("T")[1],
        },
        end: {
          date: new Date(this.datetime.end).toISOString().split("T")[0],
          time: new Date(this.datetime.end).toISOString().split("T")[1],
        },
      };
      const reminders = this.reminders;
      const repeats = {
        frecuency: this.repeats.frecuency,
        data: this.repeats.data,
      };
      const calendar = this.calendar;
      const notes = this.notes;

      if (this.$route.params.id) {
        eventsService()
          .updateEvent(
            parseInt(this.$route.params.id as string),
            title,
            JSON.stringify(dateTime),
            JSON.stringify(reminders),
            JSON.stringify(repeats),
            calendar,
            notes
          )
          .then(async (response) => {
            const message = await userService()
              .translate("updateEvent")
              .then((response) => {
                return response;
              });
            eventBus().emitter.emit("update-event-success");
            this.$router.go(-1);
            this.openToast(message, "success");
          });
      } else {
        eventsService()
          .createEvent(
            title,
            JSON.stringify(dateTime),
            JSON.stringify(reminders),
            JSON.stringify(repeats),
            calendar,
            notes
          )
          .then(async (response) => {
            const message = await userService()
              .translate("saveEvent")
              .then((response) => {
                return response;
              });
            // this.$router.go(-1);
            this.openToast(message, "success");
          });
      }
    },
    errorsValidation() {
      let error = true;
      if (this.title == "") {
        this.errors.titleEmpty.show = true;
        error = false;
      } else {
        this.errors.titleEmpty.show = false;
        error = true;
      }
      return error;
    },
    async getEventLocal(id: number) {
      const event = await eventsService()
        .getEventLocal(id)
        .then((response) => {
          return response;
        });

      if (event.length) {
        event.forEach(async (element: any) => {
          this.title = element.title;

          // let date = this.formatDate(element.time_start);
          // this.timeStart.text = date.dateFormatted;
          // this.timeStart.value = element.time_start;
          // date = this.formatDate(element.time_end);
          // this.timeEnd.text = date.dateFormatted;
          // this.timeEnd.value = element.time_start;

          this.reminders = element.reminders;

          element.repeats.frecuencyName = await userService().translate(
            element.repeats.frecuency
          );
          this.repeats = element.repeats;

          this.calendar = element.calendar;

          this.notes = element.notes;
        });
      }
    },
    formatDateTime(date: string, typeFormat: string) {
      return eventsService().formatDateTime(date, typeFormat);
    },
    async openToast(message: string, color: string) {
      const toast = await toastController.create({
        message,
        duration: 2000,
        mode: "ios",
        translucent: true,
        color,
      });
      return toast.present();
    },
  },
});
</script>
