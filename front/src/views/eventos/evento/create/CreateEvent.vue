<template>
  <ion-page>
    <ion-header
      class="ion-no-border"
      :translucent="true"
      collapse="fade"
      mode="ios"
    >
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
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-row>
        <ion-list-header>
          <ion-label> Detalles</ion-label>
        </ion-list-header>
        <ion-col>
          <ion-card>
            <ion-card-content>
              <ion-row>
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon :icon="documentOutline" slot="start"></ion-icon>
                    <ion-label> Titulo </ion-label>
                    <ion-input type="text" v-model="title"></ion-input>
                  </ion-item>
                </ion-col>

                <!-- calendar -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon
                      :icon="calendarClearOutline"
                      slot="start"
                    ></ion-icon>
                    <ion-label>Calendario</ion-label>
                    <ion-select
                      interface="popover"
                      ok-text="Aceptar"
                      cancel-text="Cancelar"
                      v-model="calendar"
                    >
                      <ion-select-option
                        v-for="calendar in calendars"
                        :key="calendar.id"
                        :value="calendar.id"
                      >
                        <ion-label>{{ calendar.name }}</ion-label>
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-list-header>
          <ion-label>Organizacion</ion-label>
        </ion-list-header>
        <ion-col>
          <ion-card>
            <ion-card-content>
              <ion-row>
                <!-- date start-->
                <ion-col size="12" size-lg="6">
                  <ion-item button="true" id="open-date1">
                    <ion-icon
                      :icon="calendarNumberOutline"
                      slot="start"
                    ></ion-icon>
                    <ion-label slot="start" class="ion-text-wrap">
                      Fecha inicial
                    </ion-label>
                    <ion-label slot="end" class="text-overflow">
                      {{ customDateFormat(datetime.start, "Pp") }}
                    </ion-label>
                    <ion-popover trigger="open-date1" :show-backdrop="false">
                      <ion-datetime
                        presentation="date-time"
                        @ionChange="datetime.start = $event.detail.value!"
                        v-model="datetime.start"
                        hour-cycle="h12"
                      />
                    </ion-popover>
                  </ion-item>
                </ion-col>

                <!-- date end -->
                <ion-col size="12" size-lg="6">
                  <ion-item button="true" id="open-date2">
                    <ion-icon
                      :icon="calendarNumberOutline"
                      slot="start"
                    ></ion-icon>
                    <ion-label slot="start" class="ion-text-wrap">
                      Fecha final
                    </ion-label>
                    <ion-label class="text-overflow" slot="end">
                      {{ customDateFormat(datetime.end, "Pp") }}
                    </ion-label>
                    <ion-popover trigger="open-date2" :show-backdrop="false">
                      <ion-datetime
                        presentation="date-time"
                        @ionChange="datetime.end = $event.detail.value!"
                        v-model="datetime.end"
                        hour-cycle="h12"
                      />
                    </ion-popover>
                  </ion-item>
                </ion-col>

                <!-- reminders -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon :icon="timeOutline" slot="start"></ion-icon>
                    <ion-label>Recordatorio</ion-label>
                    <ion-select
                      :multiple="true"
                      interface="popover"
                      v-model="reminders"
                    >
                      <ion-select-option
                        v-for="reminder in remindersData"
                        :key="reminder.name"
                        :value="reminder.name"
                        >{{ reminder.value }}</ion-select-option
                      >
                    </ion-select>
                  </ion-item>
                </ion-col>

                <!-- repeats -->
                <ion-col size="12" size-lg="6">
                  <ion-item button @click="openModalRepeats()" lines="full">
                    <ion-icon :icon="repeatOutline" slot="start"></ion-icon>
                    <ion-label class="ion-text-wrap"> Repetir </ion-label>
                    <ion-label slot="end" class="text-overflow">
                      {{ repeats.name }}
                    </ion-label>
                  </ion-item>
                </ion-col>

                <!-- timezone -->
                <ion-col size="12" size-lg="6">
                  <ion-item button @click="openModalTimeZone()" lines="full">
                    <ion-icon :icon="globeOutline" slot="start"></ion-icon>
                    <ion-label slot="start" class="ion-text-wrap">
                      Zona horaria
                    </ion-label>
                    <ion-label slot="end" class="text-overflow">
                      {{ timeZone }}
                    </ion-label>
                  </ion-item>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-list-header>
          <ion-label>Otros ajustes</ion-label>
        </ion-list-header>
        <ion-col>
          <ion-card>
            <ion-card-content>
              <ion-row>
                <!-- tags -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon :icon="pricetagsOutline" slot="start"></ion-icon>
                    <ion-label> Etiquetas </ion-label>
                    <ion-input
                      v-on:keyup.enter="addTag()"
                      ref="inputTag"
                      placeholder="Nombre de la etiqueta"
                    ></ion-input>
                  </ion-item>
                  <div style="overflow-x: scroll">
                    <div style="display: inline-flex">
                      <ion-chip
                        color="primary"
                        v-for="(tag, index) in tags"
                        :key="tag"
                      >
                        <ion-label>{{ tag }}</ion-label>
                        <ion-icon
                          :icon="closeCircleOutline"
                          @click="removeTag(index)"
                        ></ion-icon>
                      </ion-chip>
                    </div>
                  </div>
                </ion-col>

                <!-- guests -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon :icon="mailOutline" slot="start"></ion-icon>
                    <ion-label> Invitados </ion-label>
                    <ion-input
                      v-on:keyup.enter="addGuest()"
                      ref="inputguest"
                      placeholder="correo electronico"
                    ></ion-input>
                  </ion-item>
                  <div style="overflow-x: scroll">
                    <div style="display: inline-flex">
                      <ion-chip
                        color="primary"
                        v-for="(mail, index) in guests"
                        :key="mail"
                      >
                        <ion-label>{{ mail }}</ion-label>
                        <ion-icon
                          :icon="closeCircleOutline"
                          @click="removeGuest(index)"
                        ></ion-icon>
                      </ion-chip>
                    </div>
                  </div>
                </ion-col>

                <!-- notes -->
                <ion-col size="12" size-lg="12">
                  <ion-item>
                    <ion-icon
                      :icon="documentTextOutline"
                      slot="start"
                      class="item-icon"
                    ></ion-icon>
                    <ion-label position="floating"> notas </ion-label>
                    <ion-textarea
                      type="text"
                      v-model="notes"
                      autoGrow
                      :rows="4"
                    ></ion-textarea>
                  </ion-item>
                </ion-col>
              </ion-row>
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
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  toastController,
  loadingController,
  modalController,
  IonDatetime,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  saveOutline,
  closeCircleOutline,
  documentOutline,
  calendarNumberOutline,
  calendarClearOutline,
  timeOutline,
  repeatOutline,
  pricetagsOutline,
  mailOutline,
  documentTextOutline,
  globeOutline,
} from "ionicons/icons";
import eventBus from "../../../../EventBus";
import {
  createEvent as createEventService,
  updateEvent as updateEventService,
  formatDateTime as formatDateTimeService,
  getEventLocal as getEventLocalService,
  getCalendars as getCalendarsService,
} from "../../../../services/event";
// import userService from "../../../../services/user";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";
import { format, formatISO } from "date-fns";
import Repeats from "../repetir/Repetir.vue";
import TimeZoneComponent from "../../../../components/SelectTimeZone.vue";
import { CALENDARS } from "../../../../services/graphql";

export default defineComponent({
  name: "EventPage",
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
    IonDatetime,
  },

  setup() {
    const remindersData = [
      {
        name: "just",
        value: "A tiempo",
      },
      {
        name: "5mnb",
        value: "5 minutos antes",
      },
      {
        name: "15mnb",
        value: "15 minutos antes",
      },
      {
        name: "30mnb",
        value: "30 minutos antes",
      },
      {
        name: "1hrb",
        value: "30 hora antes",
      },
      {
        name: "4hrb",
        value: "4 horas antes",
      },
      {
        name: "1db",
        value: "1 dia antes",
      },
      {
        name: "2db",
        value: "2 dia antes",
      },
      {
        name: "1sb",
        value: "1 semana antes",
      },
    ];
    return {
      chevronBackOutline,
      saveOutline,
      IonInput,
      IonSelectOption,
      closeCircleOutline,
      documentOutline,
      calendarNumberOutline,
      calendarClearOutline,
      timeOutline,
      repeatOutline,
      pricetagsOutline,
      mailOutline,
      documentTextOutline,
      globeOutline,
      remindersData,
    };
  },

  data() {
    const storage = new Storage();
    storage.create();
    return {
      buttonEdit: true,
      pageTitle: "Crear evento",
      storage,
      title: "",
      datetime: {
        start: formatISO(new Date()),
        end: formatISO(
          add(new Date(), {
            hours: 1,
          })
        ),
      },
      reminders: ["just"],
      repeats: {
        frequency: "unique",
        name: "Unico",
        data: {},
      },
      calendar: "0",
      notes: "",
      tags: Array<string>(),
      guests: Array<string>(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      calendars: Array<{ id: string; name: string }>(),
    };
  },

  mounted() {
    this.getCalendars();
    if (this.$route.params.id) {
      this.getEventLocal(this.$route.params.id as string);
    }
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

    async save() {
      if (this.title == "") {
        this.title = "Sin titulo";
      }

      const event = {
        id: this.$route.params.id,
        title: this.title,
        calendar: this.calendar,
        dateTime: JSON.stringify(this.datetime),
        guests: JSON.stringify(this.guests),
        notes: this.notes,
        reminders: JSON.stringify(this.reminders),
        repeats: JSON.stringify(this.repeats),
        tags: JSON.stringify(this.tags),
        timeZone: this.timeZone,
      };
      if (this.$route.params.id) {
        this.updateEvent(event);
      } else {
        this.createEvent(event);
      }
    },

    async createEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      loading.present();

      createEventService(event)
        .then(async () => {
          loading.dismiss();
          const message = "Evento creado correctamente";
          eventBus().emitter.emit("refresh-events");
          this.$router.go(-1);
          this.openToast(message, "success");
        })
        .catch(() => {
          loading.dismiss();
        });
    },
    async updateEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      loading.present();

      updateEventService(event)
        .then(async () => {
          loading.dismiss();
          const message = "Evento actualizado correctamente";
          eventBus().emitter.emit("refresh-events");
          this.$router.go(-1);
          this.openToast(message, "success");
        })
        .catch(() => {
          loading.dismiss();
        });
    },

    formatDateTime(date: string, typeFormat: string) {
      return formatDateTimeService(date, typeFormat);
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

    addTag() {
      if ((this.$refs.inputTag as any).$el.value != "") {
        this.tags.push((this.$refs.inputTag as any).$el.value);
        (this.$refs.inputTag as any).$el.value = "";
      }
    },

    removeTag(index: number) {
      this.tags.splice(index, 1);
    },

    async presentLoading() {
      const loading = await loadingController.create({
        cssClass: "my-custom-class",
        message: "Espere por favor",
      });
      return loading;
    },

    customDateFormat(date: any, styleFormat: string) {
      return format(new Date(date), styleFormat);
    },

    addGuest() {
      const guest = (this.$refs.inputguest as any).$el.value;
      const re = /^[^\s@]+@[^\s@]+$/;

      const repeated = this.guests.filter((item) => {
        if (item == guest) return item;
      });

      if (guest != "" && re.test(guest) && repeated.length == 0) {
        this.guests.push(guest);
        (this.$refs.inputguest as any).$el.value = "";
      }
    },

    removeGuest(index: number) {
      this.guests.splice(index, 1);
    },

    async openModalRepeats() {
      const modal = await modalController.create({
        component: Repeats,
        cssClass: "my-custom-class",
        componentProps: {
          repeatsProps: Object.assign({}, this.repeats),
        },
      });
      modal.onDidDismiss().then((response) => {
        if (response.data) {
          this.repeats.frequency = response.data.frequency;
          this.repeats.name = response.data.frequencyName;
          this.repeats.data = response.data.data;
        }
      });
      return modal.present();
    },

    // async getFileTranslate() {
    //   this.fileTranslate = [await userService().translate()];
    // },

    async getCalendars() {
      const response = await getCalendarsService({
        graphql: {
          name: CALENDARS,
          fragment: "Calendars",
        },
      });

      this.calendars = response;
    },

    getEventLocal(id: string) {
      getEventLocalService(parseInt(id)).then((response) => {
        // FIX: pasar las fechas en formatoISO
        this.title = response[0].title;
        // TODO: set calendar
        // //          this.calendar = response[0].calendar.id;
        this.guests = response[0].guests;
        this.reminders = response[0].reminders;
        this.repeats = response[0].repeats;
        this.notes = response[0].notes;
        response[0].tags.forEach((element: any) => {
          this.tags.push(element.name);
        });
        this.timeZone = response[0].time_zone;
      });
    },

    async openModalTimeZone() {
      const modal = await modalController.create({
        component: TimeZoneComponent,
      });
      modal.onDidDismiss().then((response) => {
        if (response.data && response.data.timeZone != "") {
          this.timeZone = response.data.timeZone;
        }
      });
      return modal.present();
    },
    prueba(e: any) {
      console.log(e);
    },
  },
});
</script>

<style>
.hide-scroll::-webkit-scrollbar {
  display: none;
}
.text-overflow {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.input-label {
  margin-top: 30px;
}
.input {
  margin-top: 20px;
  text-align: right;
}
</style>
