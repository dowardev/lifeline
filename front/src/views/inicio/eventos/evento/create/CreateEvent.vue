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
                <p>
                  {{
                    time.start.daySelected +
                      "/" +
                      time.start.monthSelected +
                      "/" +
                      time.start.yearSelected +
                      " - " +
                      time.start.hourSelected +
                      ":" +
                      time.start.minuteSelected +
                      " " +
                      time.start.amSelected
                  }}
                </p>
                <p>
                  {{
                    time.end.daySelected +
                      "/" +
                      time.end.monthSelected +
                      "/" +
                      time.end.yearSelected +
                      " - " +
                      time.end.hourSelected +
                      ":" +
                      time.end.minuteSelected +
                      " " +
                      time.end.amSelected
                  }}
                </p>
              </ion-label>

              <ion-button slot="end" fill="clear">
                <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectReminders()">
              <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
              <div
                v-for="reminder in reminders"
                :key="reminder"
                style="display:inline-block"
              >
                <ion-chip color="primary" v-if="reminder.check == true">
                  <ion-label>{{ reminder.label }}</ion-label>
                </ion-chip>
              </div>
              <ion-button fill="clear" slot="end">
                <ion-icon :icon="addCircleOutline"></ion-icon>
              </ion-button>
            </ion-item>

            <ion-item lines="none" button v-on:click="selectRepeat()">
              <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
              <ion-label>{{ repeats.frecuencyName }}</ion-label>
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
import event from "../../../../../services/event.vue";

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
    const { createEvent } = event();
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
      createEvent,
    };
  },
  data() {
    let titulo = "Agregar evento";
    const path = this.$router.currentRoute.value["fullPath"]
      .split("/")
      .slice(-1)[0];
    if (path == "actualizar") {
      titulo = "Actualizar evento";
    }
    const reminders = [
      {
        label: "A tiempo",
        check: false,
        value: "tiempo",
      },
      {
        label: "5 minutos antes",
        check: true,
        value: "5mn",
      },
      {
        label: "15 minutos antes",
        check: false,
        value: "15mn",
      },
      {
        label: "30 minutos antes",
        check: false,
        value: "30mn",
      },
      {
        label: "1 hora antes",
        check: false,
        value: "1h",
      },
      {
        label: "4 hora antes",
        check: false,
        value: "4h",
      },
      {
        label: "1 dia antes",
        check: false,
        value: "1d",
      },
      {
        label: "2 dias antes",
        check: false,
        value: "2d",
      },
      {
        label: "1 semana ante",
        check: false,
        value: "1s",
      },
    ];
    return {
      buttonEdit: true,
      titulo,
      reminders,
      title: "",
      time: {
        start: {
          hourSelected: "12",
          minuteSelected: "00",
          amSelected: "am",
          yearSelected: 2021,
          monthSelected: 9,
          daySelected: 4,
        },
        end: {
          hourSelected: "12",
          minuteSelected: "00",
          amSelected: "am",
          yearSelected: 2021,
          monthSelected: 9,
          daySelected: 4,
        },
      },
      repeats: {
        frecuencyName: "Unico",
        frecuency: "unique",
        data: {},
      },
      notes: "",
      calendar: "personal",
      errors: {
        titleEmpty: { message: "Campo requerido", show: false },
      },
    };
  },
  mounted() {
    this.setCurrentYear();
    this.setCurrentMonth();
    this.setCurrentDay();
    eventBus().emitter.on("set-schedule-event", (response: any) => {
      this.time = response;
    });
    eventBus().emitter.on("set-reminder-event", (response: any) => {
      this.reminders = response.reminders;
    });
    eventBus().emitter.on("set-repeat-event", (response: any) => {
      if (response.frecuency == "unique") {
        this.repeats.frecuencyName = "Unico";
      }
      if (response.frecuency == "daily") {
        this.repeats.frecuencyName = "Diariamente";
      }
      if (response.frecuency == "weekly") {
        this.repeats.frecuencyName = "Semanalmente";
      }
      if (response.frecuency == "monthly") {
        this.repeats.frecuencyName = "Mensualmente";
      }
      if (response.frecuency == "annually") {
        this.repeats.frecuencyName = "Anualmente";
      }
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
          schedule: JSON.parse(JSON.stringify(this.time)),
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
    setCurrentYear() {
      const d = new Date();
      const year = d.getFullYear();
      this.time.start.yearSelected = this.time.end.yearSelected = year;
    },
    setCurrentMonth() {
      const d = new Date();
      const month = d.getMonth();
      this.time.start.monthSelected = this.time.end.monthSelected = month;
    },
    setCurrentDay() {
      const d = new Date();
      const day = d.getDate();
      this.time.start.daySelected = this.time.end.daySelected = day;
    },
    save() {
      /*   const error = this.errorsValidation();
      if (error == false) return; */

      const title = JSON.parse(JSON.stringify(this.title));
      const time = this.formatTime(
        JSON.parse(JSON.stringify(this.time)).start,
        JSON.parse(JSON.stringify(this.time)).end
      );
      const reminders = this.formatReminders();
      const repeats = {
        frecuency: JSON.parse(JSON.stringify(this.repeats)).frecuency,
        data: JSON.parse(JSON.stringify(this.repeats)).data,
      };
      const calendar = JSON.parse(JSON.stringify(this.calendar));
      const notes = JSON.parse(JSON.stringify(this.notes));

      this.createEvent(title, time, reminders, repeats, calendar, notes).then(
        (response) => {
          console.log(response);
        }
      );
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
    formatTime(
      start: {
        amSelected: string;
        daySelected: number;
        hourSelected: string;
        minuteSelected: string;
        monthSelected: number;
        yearSelected: number;
      },
      end: {
        amSelected: string;
        daySelected: number;
        hourSelected: string;
        minuteSelected: string;
        monthSelected: number;
        yearSelected: number;
      }
    ) {
      let startDate =
        start.yearSelected +
        "/" +
        start.monthSelected +
        "/" +
        start.daySelected +
        " " +
        start.hourSelected +
        ":" +
        start.minuteSelected +
        " " +
        start.amSelected;
      let endDate =
        end.yearSelected +
        "/" +
        end.monthSelected +
        "/" +
        end.daySelected +
        " " +
        end.hourSelected +
        ":" +
        end.minuteSelected +
        " " +
        end.amSelected;

      let date = new Date(startDate);
      startDate =
        date.getFullYear() +
        "/" +
        date.getMonth() +
        "/" +
        date.getDate() +
        " " +
        date.getHours() +
        ":" +
        date.getMinutes();

      date = new Date(endDate);
      endDate =
        date.getFullYear() +
        "/" +
        date.getMonth() +
        "/" +
        date.getDate() +
        " " +
        date.getHours() +
        ":" +
        date.getMinutes();
      return { startDate, endDate };
    },
    formatReminders() {
      const reminders: string[] = [];
      this.reminders.forEach((element) => {
        if (element.check == true) {
          reminders.push(element.value);
        }
      });
      return reminders;
    },
  },
});
</script>
