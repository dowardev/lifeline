<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
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
              <ion-button slot="end" fill="clear">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
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
                  {{ timeStart.text }}
                </p>
                <p>
                  {{ timeEnd.text }}
                </p>
              </ion-label>

              <ion-button slot="end" fill="clear">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectReminders()">
              <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
              <ion-label>
                <h2>Horario</h2>
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
              <ion-button fill="clear" slot="end">
                <ion-icon :icon="addCircleOutline"></ion-icon>
              </ion-button>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectRepeat()">
              <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
              <ion-label
                ><h2>Repetir</h2>
                <p>{{ repeats.frecuencyName }}</p></ion-label
              >
              <ion-button fill="clear" slot="end">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
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
              <ion-button slot="end" fill="clear">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
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
              <ion-button slot="end" fill="clear">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
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
  addOutline,
  readerOutline,
  timeOutline,
  repeatOutline,
  layersOutline,
  documentOutline,
  createOutline,
  saveOutline,
  alarmOutline,
  closeCircleOutline,
  addCircleOutline,
} from "ionicons/icons";
import eventBus from "../../../../../EventBus";
import eventsService from "../../../../../services/event.vue";
import userService from "../../../../../services/user.vue";
import { Storage } from "@ionic/storage";

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
      addOutline,
      readerOutline,
      timeOutline,
      repeatOutline,
      layersOutline,
      documentOutline,
      createOutline,
      saveOutline,
      alarmOutline,
      closeCircleOutline,
      addCircleOutline,
      IonInput,
      IonSelectOption,
      customAlertOptions,
    };
  },
  data() {
    const titulo = "Agregar evento";
    const storage = new Storage();
    storage.create();
    return {
      buttonEdit: true,
      titulo,
      reminders: [],
      title: "",
      timeStart: { text: "", value: "" },
      timeEnd: { text: "", value: "" },
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
    this.openToast("Bienvenido", "success");
    if (this.$route.params.id) {
      this.titulo = "Actualizar evento";
      this.getEvent(parseInt(this.$route.params.id as string));
    }
    this.setDate();
    eventBus().emitter.on("set-schedule-event", (response: any) => {
      let date = this.formatDate(response.start);
      this.timeStart.text = date.dateFormatted;
      this.timeStart.value = date.dateUnformatted;
      date = this.formatDate(response.end);
      this.timeEnd.text = date.dateFormatted;
      this.timeEnd.value = date.dateUnformatted;
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
  },
  methods: {
    editEvent() {
      this.buttonEdit = !this.buttonEdit;
    },
    selectTime() {
      this.$router.push("/horario");
      setTimeout(() => {
        eventBus().emitter.emit("get-schedule-event", {
          timeStart: this.timeStart.value,
          timeEnd: this.timeEnd.value,
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
    setDate() {
      const sumDate = (days: number) => {
        const result = new Date();
        return result.setDate(result.getDate() + days);
      };

      let date = this.formatDate(sumDate(0));
      this.timeStart.text = date.dateFormatted;
      this.timeStart.value = date.dateUnformatted;

      date = this.formatDate(sumDate(2));
      this.timeEnd.text = date.dateFormatted;
      this.timeEnd.value = date.dateUnformatted;
    },
    save() {
      /*
      const error = this.errorsValidation();
      if (error == false) return;
*/
      const title = this.title;
      const time = {
        start: this.timeStart.value,
        end: this.timeEnd.value,
      };
      const reminders = this.reminders;
      const repeats = {
        frecuency: JSON.parse(JSON.stringify(this.repeats)).frecuency,
        data: JSON.parse(JSON.stringify(this.repeats)).data,
      };
      const calendar = this.calendar;
      const notes = JSON.parse(JSON.stringify(this.notes));

      if (this.$route.params.id) {
        eventsService()
          .updateEvent(
            parseInt(this.$route.params.id as string),
            title,
            time,
            reminders,
            repeats,
            calendar,
            notes
          )
          .then(async (response) => {
            const message = await userService()
              .translate("updateEvent")
              .then((response) => {
                return response;
              });
            this.$router.go(-1)
            this.openToast(message, "success");
          });
      } else {
        eventsService()
          .createEvent(title, time, reminders, repeats, calendar, notes)
          .then(async(response) => {
            const message = await userService()
              .translate("saveEvent")
              .then((response) => {
                return response;
              });
            this.$router.go(-1)
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

    async getEvent(id: number) {
      const event = await eventsService()
        .getEvent(id)
        .then((response) => {
          return response;
        });

      if ([event.data].length) {
        event.data.forEach(async (element: any) => {
          this.title = element.title;

          let date = this.formatDate(element.time_start);
          this.timeStart.text = date.dateFormatted;
          this.timeStart.value = element.time_start;
          date = this.formatDate(element.time_end);
          this.timeEnd.text = date.dateFormatted;
          this.timeEnd.value = element.time_start;

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
    formatDate(date: any) {
      const d = new Date(date);
      let hour = d.getHours() % 12 || 12;
      let minute = d.getMinutes() as any;
      minute = minute == 0 ? "00" : d.getMinutes();
      const am = d.getHours() >= 12 ? "pm" : "am";
      const timeFormatted = hour + ":" + minute + " " + am;

      const dateFormatted =
        d.getDate() +
        "-" +
        d.getMonth() +
        "-" +
        d.getFullYear() +
        " " +
        timeFormatted;

      hour = d.getHours();
      minute = d.getMinutes() as any;
      minute = minute == 0 ? "00" : "0";
      const timeUnformatted = hour + ":" + minute;

      const dateUnformatted =
        d.getFullYear() +
        "-" +
        d.getMonth() +
        "-" +
        d.getDate() +
        " " +
        timeUnformatted;

      return { dateFormatted, dateUnformatted };
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
