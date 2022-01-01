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
          <ion-button v-on:click="save()" :disabled="v$.form.$invalid">
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
              <ion-input type="text" v-model="v$.form.title.$model"></ion-input>
              <p
                v-for="(error, index) of v$.form.title.$errors"
                :key="index"
                class="error"
              >
                {{ error.$message }}
              </p>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectTime()">
              <ion-icon slot="start" :icon="timeOutline"></ion-icon>
              <ion-label>
                <h2>Horario</h2>
                <p>
                  {{
                    formatDateTime(form.datetime.start, "P") +
                    " " +
                    formatDateTime(form.datetime.start, "p")
                  }}
                </p>
                <p>
                  {{
                    formatDateTime(form.datetime.end, "P") +
                    " " +
                    formatDateTime(form.datetime.end, "p")
                  }}
                </p>
              </ion-label>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectReminders()">
              <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
              <ion-label>
                <h2>Recordatorio(s)</h2>
                <div
                  v-for="reminder in form.reminders"
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
                <p>{{ form.repeats.frecuencyName }}</p></ion-label
              >
            </ion-item>

            <ion-item lines="none">
              <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
              <ion-label position="floating">Calendario</ion-label>
              <ion-select
                :interface-options="customAlertOptions"
                interface="alert"
                ok-text="Aceptar"
                cancel-text="Cancelar"
                v-model="v$.form.calendar.$model"
              >
                <ion-select-option value="personal">Personal</ion-select-option>
              </ion-select>
              <p
                v-for="(error, index) of v$.form.calendar.$errors"
                :key="index"
                class="error"
              >
                {{ error.$message }}
              </p>
            </ion-item>

            <ion-item lines="none">
              <ion-icon slot="start" :icon="readerOutline"></ion-icon>
              <ion-label position="floating">Notas</ion-label>
              <ion-textarea
                type="text"
                v-model="form.notes"
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
  saveOutline,
  alarmOutline,
  calendarOutline,
} from "ionicons/icons";
import eventBus from "../../../../../EventBus";
import eventsService from "../../../../../services/event.vue";
import userService from "../../../../../services/user.vue";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";
import useVuelidate from "@vuelidate/core";
import { required, alpha, helpers } from "@vuelidate/validators";

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
      saveOutline,
      alarmOutline,
      IonInput,
      IonSelectOption,
      v$: useVuelidate(),
      calendarOutline,
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
      storage,
      form: {
        title: "",
        datetime: {
          start: today,
          end: new Date(add(new Date(), { days: 1 }))
            .toLocaleString("sv")
            .replace(" ", "T"),
        },
        reminders: [],
        repeats: {
          frecuencyName: "",
          frecuency: "",
          data: {},
        },
        calendar: "",
        notes: "",
      },
    };
  },
  validations() {
    const messageRequired = "Campo requerido";
    const messageAlpha = "Solamente puede contener texto";
    return {
      form: {
        title: {
          required: helpers.withMessage(messageRequired, required),
          alpha: helpers.withMessage(messageAlpha, alpha),
        },
        calendar: {
          required: helpers.withMessage(messageRequired, required),
        },
      },
    };
  },
  mounted() {
    if (this.$route.params.id) {
      this.pageTitle = "Actualizar evento";
      this.getEventLocal(parseInt(this.$route.params.id as string));
    }
    eventBus().emitter.on("set-schedule-event", (response: any) => {
      this.form.datetime.start = response.dateTimeStart;
      this.form.datetime.end = response.dateTimeEnd;
    });
    eventBus().emitter.on("set-reminder-event", (response: any) => {
      this.form.reminders = response.reminders;
    });
    eventBus().emitter.on("set-repeat-event", async (response: any) => {
      this.form.repeats.frecuencyName = await userService().translate(
        response.frecuency
      );
      this.form.repeats.frecuency = response.frecuency;
      this.form.repeats.data = response.data;
    });
    eventBus().emitter.on("update-event", async (response: any) => {
      // console.log(response.event);
      // this.event = response.event;
      //this.pageTitle = "Actualizar evento";
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
          dateTimeStart: this.form.datetime.start,
          dateTimeEnd: this.form.datetime.end,
        });
      }, 300);
    },
    selectRepeat() {
      this.$router.push("/repetir");
      setTimeout(() => {
        eventBus().emitter.emit("get-repeat-event", {
          reminders: JSON.parse(JSON.stringify(this.form.repeats)),
        });
      }, 300);
    },
    selectReminders() {
      this.$router.push("/recordatorios");
      setTimeout(() => {
        eventBus().emitter.emit("get-reminder-event", {
          reminders: JSON.parse(JSON.stringify(this.form.reminders)),
        });
      }, 300);
    },
    async save() {
      const title = this.form.title;
      const dateTime = {
        start: {
          date: new Date(this.form.datetime.start).toISOString().split("T")[0],
          time: new Date(this.form.datetime.start)
            .toISOString()
            .split("T")[1]
            .replace("Z", ""),
        },
        end: {
          date: new Date(this.form.datetime.end).toISOString().split("T")[0],
          time: new Date(this.form.datetime.end)
            .toISOString()
            .split("T")[1]
            .replace("Z", ""),
        },
      };
      const reminders = this.form.reminders;
      const repeats = {
        frecuency: this.form.repeats.frecuency,
        data: this.form.repeats.data,
      };
      const calendar = this.form.calendar;
      const notes = this.form.notes;

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
    async getEventLocal(id: number) {
      const event = await eventsService()
        .getEventLocal(id)
        .then((response) => {
          return response;
        });

      if (event.length) {
        event.forEach(async (element: any) => {
          this.form.title = element.title;

          // let date = this.formatDate(element.time_start);
          // this.timeStart.text = date.dateFormatted;
          // this.timeStart.value = element.time_start;
          // date = this.formatDate(element.time_end);
          // this.timeEnd.text = date.dateFormatted;
          // this.timeEnd.value = element.time_start;

          this.form.reminders = element.reminders;

          element.repeats.frecuencyName = await userService().translate(
            element.repeats.frecuency
          );
          this.form.repeats = element.repeats;

          this.form.calendar = element.calendar;

          this.form.notes = element.notes;
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
