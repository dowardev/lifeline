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
          <ion-button @click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ setPageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="spinners.save == true" @click="save()">
            <ion-icon
              v-if="spinners.save == false"
              slot="start"
              :icon="saveOutline"
            ></ion-icon>
            <ion-spinner
              v-if="spinners.save == true"
              name="crescent"
            ></ion-spinner>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ setPageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-row>
        <ion-list-header>
          <ion-label>
            {{ capitalizeFirstLetter($tc("message.detail", 2)) }}</ion-label
          >
        </ion-list-header>
        <ion-col>
          <ion-card>
            <ion-card-content>
              <ion-row>
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon slot="start" :icon="documentOutline"></ion-icon>
                    <ion-label>
                      {{ capitalizeFirstLetter($t("message.title")) }}
                    </ion-label>
                    <ion-input v-model="title" type="text"></ion-input>
                  </ion-item>
                </ion-col>

                <!-- calendar -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon
                      slot="start"
                      :icon="calendarClearOutline"
                    ></ion-icon>
                    <ion-label>{{
                      capitalizeFirstLetter($t("message.calendar"))
                    }}</ion-label>
                    <ion-select
                      v-model="calendar"
                      interface="popover"
                      ok-text="Aceptar"
                      cancel-text="Cancelar"
                    >
                      <ion-select-option
                        v-for="item in calendars"
                        :key="item.id"
                        :value="item.id"
                      >
                        <ion-label>{{ item.name }}</ion-label>
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
          <ion-label>{{
            capitalizeFirstLetter($t("message.organization"))
          }}</ion-label>
        </ion-list-header>
        <ion-col>
          <ion-card>
            <ion-card-content>
              <ion-row>
                <!-- date start-->
                <ion-col size="12" size-lg="6">
                  <ion-item id="open-date1" button="true">
                    <ion-icon
                      slot="start"
                      :icon="calendarNumberOutline"
                    ></ion-icon>
                    <ion-label slot="start" class="ion-text-wrap">
                      {{ capitalizeFirstLetter($t("message.dateStart")) }}
                    </ion-label>
                    <ion-label slot="end" class="text-overflow">
                      {{ customDateFormat(datetime.start, "Pp") }}
                    </ion-label>
                    <ion-popover trigger="open-date1" :show-backdrop="false">
                      <ion-datetime
                        v-model="datetime.start"
                        presentation="date-time"
                        hour-cycle="h12"
                        @ion-change="
                          datetime.start = $event.detail.value as string
                        "
                      />
                    </ion-popover>
                  </ion-item>
                </ion-col>

                <!-- date end -->
                <ion-col size="12" size-lg="6">
                  <ion-item id="open-date2" button="true">
                    <ion-icon
                      slot="start"
                      :icon="calendarNumberOutline"
                    ></ion-icon>
                    <ion-label slot="start" class="ion-text-wrap">
                      {{ capitalizeFirstLetter($t("message.dateEnd")) }}
                    </ion-label>
                    <ion-label slot="end" class="text-overflow">
                      {{ customDateFormat(datetime.end, "Pp") }}
                    </ion-label>
                    <ion-popover trigger="open-date2" :show-backdrop="false">
                      <ion-datetime
                        v-model="datetime.end"
                        presentation="date-time"
                        hour-cycle="h12"
                        @ion-change="
                          datetime.end = $event.detail.value as string
                        "
                      />
                    </ion-popover>
                  </ion-item>
                </ion-col>

                <!-- reminders -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon slot="start" :icon="timeOutline"></ion-icon>
                    <ion-label>{{
                      capitalizeFirstLetter($tc("message.reminder", 2))
                    }}</ion-label>
                    <ion-select
                      :multiple="true"
                      interface="popover"
                      :placeholder="
                        capitalizeFirstLetter($t('message.notEstablished'))
                      "
                      @ion-change="reminders = $event.detail.value"
                    >
                      <ion-select-option
                        v-for="reminder in setDaraReminders"
                        :key="reminder.name"
                        :value="reminder.name"
                        >{{ reminder.value }}</ion-select-option
                      >
                    </ion-select>
                  </ion-item>
                </ion-col>

                <!-- repeats -->
                <ion-col size="12" size-lg="6">
                  <ion-item button lines="full" @click="openModalRepeats()">
                    <ion-icon slot="start" :icon="repeatOutline"></ion-icon>
                    <ion-label class="ion-text-wrap">
                      {{ capitalizeFirstLetter($t("message.repeat")) }}
                    </ion-label>
                    <ion-label slot="end" class="text-overflow">
                      {{ capitalizeFirstLetter($t(`message.${repeats.name}`)) }}
                    </ion-label>
                  </ion-item>
                </ion-col>

                <!-- timezone -->
                <ion-col size="12" size-lg="6">
                  <ion-item button lines="full" @click="openModalTimeZone()">
                    <ion-icon slot="start" :icon="globeOutline"></ion-icon>
                    <ion-label slot="start" class="ion-text-wrap">
                      {{ capitalizeFirstLetter($t("message.timeZone")) }}
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
          <ion-label>{{
            capitalizeFirstLetter($tc("message.otherSetting", 2))
          }}</ion-label>
        </ion-list-header>
        <ion-col>
          <ion-card>
            <ion-card-content>
              <ion-row>
                <!-- tags -->
                <ion-col size="12" size-lg="6">
                  <ion-item>
                    <ion-icon slot="start" :icon="pricetagsOutline"></ion-icon>
                    <ion-label>
                      {{ capitalizeFirstLetter($tc("message.tag", 2)) }}
                    </ion-label>
                    <ion-input
                      ref="inputTag"
                      :placeholder="
                        capitalizeFirstLetter($t('message.tagName'))
                      "
                      @keyup.enter="addTag()"
                    ></ion-input>
                  </ion-item>
                  <div v-if="tags.length > 0" style="overflow-x: scroll">
                    <div style="display: inline-flex">
                      <ion-chip
                        v-for="(tag, index) in tags"
                        :key="tag"
                        color="primary"
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
                    <ion-icon slot="start" :icon="mailOutline"></ion-icon>
                    <ion-label>
                      {{ capitalizeFirstLetter($tc("message.guest", 2)) }}
                    </ion-label>
                    <ion-input
                      ref="inputguest"
                      :placeholder="capitalizeFirstLetter($t('message.email'))"
                      @keyup.enter="addGuest()"
                    ></ion-input>
                  </ion-item>
                  <div v-if="guests.length > 0" style="overflow-x: scroll">
                    <div style="display: inline-flex">
                      <ion-chip
                        v-for="(mail, index) in guests"
                        :key="mail"
                        color="primary"
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
                      slot="start"
                      :icon="documentTextOutline"
                      class="item-icon"
                    ></ion-icon>
                    <ion-label position="floating">
                      {{ capitalizeFirstLetter($tc("message.note", 2)) }}
                    </ion-label>
                    <ion-textarea
                      v-model="notes"
                      type="text"
                      auto-grow
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
  getUserCalendars as getCalendarsService,
} from "../../../../services/event";
// import userService from "../../../../services/user";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";
import { format, formatISO } from "date-fns";
import Repeats from "../repetir/Repetir.vue";
import TimeZoneComponent from "../../../../components/SelectTimeZone.vue";
import { USER_CALENDARS } from "../../../../services/graphql";
import { CreateEvent } from "../../../../services/interfaces";
import { capitalizeFirstLetter as capitalizeFirstLetterService } from "../../../../services/system";

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
      capitalizeFirstLetter: capitalizeFirstLetterService,
    };
  },

  data() {
    const storage = new Storage();
    storage.create();
    return {
      buttonEdit: true,
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
      reminders: [],
      repeats: {
        frequency: "unique",
        name: "unique",
        data: {},
      },
      calendar: "0",
      notes: "",
      tags: Array<string>(),
      guests: Array<string>(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      calendars: Array<{ id: string; name: string; default: boolean }>(),
      spinners: {
        save: false,
      },
    };
  },

  computed: {
    setPageTitle() {
      if (this.$route.params.id == undefined)
        return this.capitalizeFirstLetter(this.$t("message.createEvent"));
      else return this.capitalizeFirstLetter(this.$t("message.updateEvent"));
    },
    setDaraReminders() {
      return [
        {
          name: "just",
          value: this.capitalizeFirstLetter(this.$t("message.inTime")),
        },
        {
          name: "5mnb",
          value: "5 " + this.$tc("message.minuteBefore", 2),
        },
        {
          name: "15mnb",
          value: "15 " + this.$tc("message.minuteBefore", 2),
        },
        {
          name: "30mnb",
          value: "30 " + this.$tc("message.minuteBefore", 2),
        },
        {
          name: "1hrb",
          value: "1 " + this.$tc("message.hourBefore", 2),
        },
        {
          name: "4hrb",
          value: "4 " + this.$tc("message.hourBefore", 2),
        },
        {
          name: "1db",
          value: "1 " + this.$tc("message.dayBefore", 2),
        },
        {
          name: "2db",
          value: "2 " + this.$tc("message.dayBefore", 2),
        },
        {
          name: "1sb",
          value: "1 " + this.$tc("message.weekBefore", 2),
        },
      ];
    },
  },

  mounted() {
    this.getDefultCalendar();
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

    async createEvent(event: CreateEvent) {
      this.spinners.save = true;
      try {
        await createEventService(event);
        const message = "Evento creado correctamente";
        eventBus().emitter.emit("refresh-events");
        this.$router.go(-1);
        this.openToast({ message, color: "dark" });
      } catch (e: any) {
        console.error(e);
      } finally {
        this.spinners.save = false;
      }
    },

    async updateEvent(event: Record<string, any>) {
      updateEventService(event)
        .then(async () => {
          const message = "Evento actualizado correctamente";
          eventBus().emitter.emit("refresh-events");
          this.$router.go(-1);
          this.openToast({ message, color: "success" });
        })
        .catch(() => {
          // loading.dismiss();
        });
    },

    formatDateTime(date: string, typeFormat: string) {
      return formatDateTimeService(date, typeFormat);
    },

    async openToast(params: { message: string; color: string }) {
      const toast = await toastController.create({
        message: params.message,
        duration: 2000,
        color: params.color,
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
          name: USER_CALENDARS,
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

    async getDefultCalendar() {
      await this.getCalendars();
      this.calendar = this.calendars.filter((item) => {
        if (item.default) return item;
      })[0].id;
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
