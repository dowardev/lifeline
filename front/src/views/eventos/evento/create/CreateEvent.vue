<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true">
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

    <ion-content :fullscreen="true" v-if="fileTranslate[0] != null">
      <ion-row>
        <ion-list-header>
          <ion-label> {{ fileTranslate[0]["details"] }}</ion-label>
        </ion-list-header>
        <ion-col size="12" size-lg="6">
          <ion-item>
            <ion-icon :icon="documentOutline" slot="start"></ion-icon>
            <ion-label position="floating">
              {{ fileTranslate[0]["title"] }}
            </ion-label>
            <ion-input type="text" v-model="form.title"></ion-input>
          </ion-item>
        </ion-col>
        <!-- calendar -->
        <ion-col size="12" size-lg="6">
          <ion-item style="top: 7px">
            <ion-icon :icon="calendarClearOutline" slot="start"></ion-icon>
            <ion-label>{{ fileTranslate[0]["calendar"] }}</ion-label>
            <ion-select
              interface="popover"
              ok-text="Aceptar"
              cancel-text="Cancelar"
              v-model="form.calendar"
            >
              <ion-select-option
                v-for="calendar in calendars"
                :key="calendar"
                :value="calendar.id"
              >
                {{ calendar.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-list-header>
          <ion-label>{{ fileTranslate[0]["organization"] }}</ion-label>
        </ion-list-header>
        <!-- date start-->
        <ion-col size="12" size-lg="6">
          <ion-item button="true" id="open-date1">
            <ion-icon :icon="calendarNumberOutline" slot="start"></ion-icon>
            <ion-label slot="start">
              {{ fileTranslate[0]["dateStart"] + "" }}
            </ion-label>
            <ion-label slot="end">
              {{ customDateFormat(form.datetime.start, "Pp") }}
            </ion-label>
            <ion-popover trigger="open-date1" :show-backdrop="false">
              <ion-datetime
                presentation="date-time"
                @ionChange="form.datetime.start = $event.detail.value"
                v-model="form.datetime.start"
                hour-cycle="h12"
              />
            </ion-popover>
          </ion-item>
        </ion-col>
        <!-- date end -->
        <ion-col size="12" size-lg="6">
          <ion-item button="true" id="open-date2">
            <ion-icon :icon="calendarNumberOutline" slot="start"></ion-icon>
            <ion-label slot="start">
              {{ fileTranslate[0]["dateEnd"] + "" }}
            </ion-label>
            <ion-label slot="end">
              {{ customDateFormat(form.datetime.end, "Pp") }}
            </ion-label>
            <ion-popover trigger="open-date2" :show-backdrop="false">
              <ion-datetime
                presentation="date-time"
                @ionChange="form.datetime.end = $event.detail.value"
                v-model="form.datetime.end"
                hour-cycle="h12"
              />
            </ion-popover>
          </ion-item>
        </ion-col>
        <!-- reminders -->
        <ion-col size="12" size-lg="6">
          <ion-item button @click="openModalReminders()" lines="full">
            <ion-icon :icon="timeOutline" slot="start"></ion-icon>
            <ion-label>{{ fileTranslate[0]["reminders"] }}</ion-label>
            <div v-for="reminder in form.reminders" :key="reminder">
              <ion-chip color="primary">
                <ion-label>{{ fileTranslate[0][reminder] }}</ion-label>
              </ion-chip>
            </div>
          </ion-item>
        </ion-col>
        <!-- repeats -->
        <ion-col size="12" size-lg="6">
          <ion-item button @click="openModalRepeats()" lines="full">
            <ion-icon :icon="repeatOutline" slot="start"></ion-icon>
            <ion-label slot="start">
              {{ fileTranslate[0]["repeat"] }}
            </ion-label>
            <ion-label slot="end">
              {{ fileTranslate[0][form.repeats[0].frequency] }}
            </ion-label>
          </ion-item>
        </ion-col>
        <!-- timezone -->
        <ion-col size="12" size-lg="6">
          <ion-item button @click="openModalTimeZone()" lines="full">
            <ion-icon :icon="globeOutline" slot="start"></ion-icon>
            <ion-label slot="start">
              {{ fileTranslate[0]["timeZone"] }}
            </ion-label>
            <ion-label slot="end">
              {{ form.timeZone }}
            </ion-label>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-list-header>
          <ion-label>{{ fileTranslate[0]["otherSettings"] }}</ion-label>
        </ion-list-header>
        <!-- tags -->
        <ion-col size="12" size-lg="6">
          <ion-item>
            <ion-icon :icon="pricetagsOutline" slot="start"></ion-icon>
            <ion-label position="floating">
              {{ fileTranslate[0]["tags"] }}
            </ion-label>
            <ion-input
              v-on:keyup.enter="addTag()"
              ref="inputTag"
              :placeholder="fileTranslate[0]['nameTag']"
            ></ion-input>
          </ion-item>
          <ion-chip
            color="primary"
            v-for="(tag, index) in form.tags"
            :key="tag"
          >
            <ion-label>{{ tag }}</ion-label>
            <ion-icon
              :icon="closeCircleOutline"
              @click="removeTag(index)"
            ></ion-icon>
          </ion-chip>
        </ion-col>
        <!-- guests -->
        <ion-col size="12" size-lg="6">
          <ion-item>
            <ion-icon :icon="mailOutline" slot="start"></ion-icon>
            <ion-label position="floating">
              {{ fileTranslate[0]["guests"] }}
            </ion-label>
            <ion-input
              v-on:keyup.enter="addGuest()"
              ref="inputguest"
              :placeholder="fileTranslate[0]['email']"
            ></ion-input>
          </ion-item>
          <ion-chip
            color="primary"
            v-for="(mail, index) in form.guests"
            :key="mail"
          >
            <ion-label>{{ mail }}</ion-label>
            <ion-icon
              :icon="closeCircleOutline"
              @click="removeGuest(index)"
            ></ion-icon>
          </ion-chip>
        </ion-col>

        <ion-col size="12" size-lg="12">
          <ion-item>
            <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
            <ion-label position="floating">
              {{ fileTranslate[0]["notes"] }}
            </ion-label>
            <ion-textarea
              type="text"
              v-model="form.notes"
              autoGrow
              :rows="4"
            ></ion-textarea>
          </ion-item>
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
import eventsService from "../../../../services/event.vue";
import userService from "../../../../services/user.vue";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";
import { format, formatISO } from "date-fns";
import Reminders from "../reminder/Reminder.vue";
import Repeats from "../repetir/Repetir.vue";
import TimeZoneComponent from "../../../../components/SelectTimeZone.vue";

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
    IonDatetime,
  },
  setup() {
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
    };
  },
  data() {
    const storage = new Storage();
    storage.create();
    return {
      buttonEdit: true,
      pageTitle: "",
      storage,
      form: {
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
        repeats: [
          {
            frequency: "unique",
            data: {},
          },
        ],
        calendar: 0,
        notes: "",
        tags: Array<string>(),
        guests: Array<string>(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      fileTranslate: Object(),
      calendars: Array<any>(),
    };
  },
  mounted() {
    this.getFileTranslate().then(() => {
      this.pageTitle = this.$route.params.id
        ? this.fileTranslate[0]["UpdateEvent"]
        : this.fileTranslate[0]["newEvent"];
    });
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
    async save() {
      if (this.form.title == "") {
        this.form.title = this.fileTranslate[0].noTitle;
      }

      const event = {
        id: this.$route.params.id,
        title: this.form.title,
        calendar: this.form.calendar,
        dateTime: JSON.stringify(this.form.datetime),
        guests: JSON.stringify(this.form.guests),
        notes: this.form.notes,
        reminders: JSON.stringify(this.form.reminders),
        repeats: JSON.stringify(this.form.repeats),
        tags: JSON.stringify(this.form.tags),
        timeZone: this.form.timeZone,
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

      eventsService()
        .createEvent(event)
        .then(async (response) => {
          loading.dismiss();
          const message = this.fileTranslate[0]["saveEvent"];
          eventBus().emitter.emit("refresh-events");
          this.$router.go(-1);
          this.openToast(message, "success");
        })
        .catch((e) => {
          loading.dismiss();
        });
    },
    async updateEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      loading.present();

      eventsService()
        .updateEvent(event)
        .then(async (response) => {
          loading.dismiss();
          const message = this.fileTranslate[0]["updateEvent"];
          eventBus().emitter.emit("refresh-events");
          this.$router.go(-1);
          this.openToast(message, "success");
        })
        .catch((e) => {
          loading.dismiss();
        });
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
    addTag() {
      if ((this.$refs.inputTag as any).$el.value != "") {
        this.form.tags.push((this.$refs.inputTag as any).$el.value);
        (this.$refs.inputTag as any).$el.value = "";
      }
    },
    removeTag(index: number) {
      this.form.tags.splice(index, 1);
    },
    async presentLoading() {
      const loading = await loadingController.create({
        cssClass: "my-custom-class",
        message: this.fileTranslate[0].pleaseWait,
      });
      return loading;
    },
    customDateFormat(date: any, styleFormat: string) {
      return format(new Date(date), styleFormat);
    },
    addGuest() {
      const guest = (this.$refs.inputguest as any).$el.value;
      const re = /^[^\s@]+@[^\s@]+$/;
      if (guest != "" && re.test(guest)) {
        this.form.guests.push(guest);
        (this.$refs.inputguest as any).$el.value = "";
      }
    },
    removeGuest(index: number) {
      this.form.guests.splice(index, 1);
    },
    async openModalReminders() {
      const modal = await modalController.create({
        component: Reminders,
        cssClass: "my-custom-class",
        componentProps: {
          remindersProps: Object.assign([], this.form.reminders),
        },
      });
      modal.onDidDismiss().then((response) => {
        if (response.data) {
          this.form.reminders = response.data.reminders;
        }
      });
      return modal.present();
    },
    async openModalRepeats() {
      const modal = await modalController.create({
        component: Repeats,
        cssClass: "my-custom-class",
        componentProps: {
          repeatsProps: Object.assign([], this.form.repeats),
          day: this.customDateFormat(this.form.datetime.start, "EEEE"),
        },
      });
      modal.onDidDismiss().then((response) => {
        if (response.data) {
          this.form.repeats[0].frequency = response.data.frequency;
          this.form.repeats[0].data = response.data.data;
        }
      });
      return modal.present();
    },
    async getFileTranslate() {
      this.fileTranslate = [await userService().translate()];
    },
    getCalendars() {
      eventsService()
        .getCalendars()
        .then((response) => {
          this.calendars = response.data;
          this.form.calendar = response.data[0].id;
        });
    },
    getEventLocal(id: string) {
      eventsService()
        .getEventLocal(parseInt(id))
        .then((response) => {
          // FIX: pasar las fechas en formatoISO
          this.form.title = response[0].title;
          // TODO: set calendar
          // //          this.form.calendar = response[0].calendar.id;
          this.form.guests = response[0].guests;
          this.form.reminders = response[0].reminders;
          this.form.repeats = response[0].repeats;
          this.form.notes = response[0].notes;
          response[0].tags.forEach((element: any) => {
            this.form.tags.push(element.name);
          });
          this.form.timeZone = response[0].time_zone;
        });
    },
    async openModalTimeZone() {
      const modal = await modalController.create({
        component: TimeZoneComponent,
      });
      modal.onDidDismiss().then((response) => {
        if (response.data) {
          this.form.timeZone = response.data.timeZone;
        }
      });
      return modal.present();
    },
  },
});
</script>
