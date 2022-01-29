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

    <ion-content :fullscreen="true" v-if="fileTranslate[0] != null">
      <ion-row>
        <ion-list-header>
          <ion-label> {{ fileTranslate[0]["details"] }}</ion-label>
        </ion-list-header>
        <ion-col size="12" size-lg="6">
          <ion-item lines="inset">
            <ion-icon :icon="documentOutline" slot="start"></ion-icon>
            <ion-label position="floating">
              {{ fileTranslate[0]["title"] }}
            </ion-label>
            <ion-input type="text" v-model="form.title"></ion-input>
          </ion-item>
        </ion-col>
        <!-- calendar -->
        <ion-col size="12" size-lg="6">
          <ion-item style="top: 7px" lines="inset">
            <ion-icon :icon="calendarClearOutline" slot="start"></ion-icon>
            <ion-label>{{ fileTranslate[0]["calendar"] }}</ion-label>
            <ion-select
              interface="alert"
              ok-text="Aceptar"
              cancel-text="Cancelar"
              v-model="form.calendar"
            >
              <ion-select-option value="personal">
                {{ fileTranslate[0]["personal"] }}
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
          <ion-item button="true" id="open-date1" lines="inset">
            <ion-icon :icon="calendarNumberOutline" slot="start"></ion-icon>
            <ion-label
              >{{ fileTranslate[0]["dateStart"] + "" }}
              {{ customDateFormat(form.datetime.start, "Pp") }}</ion-label
            >
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
          <ion-item button="true" id="open-date2" lines="inset">
            <ion-icon :icon="calendarNumberOutline" slot="start"></ion-icon>
            <ion-label>
              {{ fileTranslate[0]["dateEnd"] + "" }}
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
          <ion-item button @click="openModalReminders()">
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
          <ion-item button @click="openModalRepeats()">
            <ion-icon :icon="repeatOutline" slot="start"></ion-icon>
            <ion-label>
              {{ fileTranslate[0]["repeat"] }}
              {{ fileTranslate[0][form.repeats.frequency] }}
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
          <ion-item lines="inset">
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
        <!-- invitados -->
        <ion-col size="12" size-lg="6">
          <ion-item lines="inset">
            <ion-icon :icon="mailOutline" slot="start"></ion-icon>
            <ion-label position="floating">
              {{ fileTranslate[0]["guests"] }}
            </ion-label>
            <ion-input
              v-on:keyup.enter="addInvited()"
              ref="inputInvited"
              :placeholder="fileTranslate[0]['email']"
            ></ion-input>
          </ion-item>
          <ion-chip
            color="primary"
            v-for="(mail, index) in form.guest"
            :key="mail"
          >
            <ion-label>{{ mail }}</ion-label>
            <ion-icon
              :icon="closeCircleOutline"
              @click="removeInvited(index)"
            ></ion-icon>
          </ion-chip>
        </ion-col>

        <ion-col size="12" size-lg="12">
          <ion-item lines="inset">
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
} from "ionicons/icons";
import eventBus from "../../../../EventBus";
import eventsService from "../../../../services/event.vue";
import userService from "../../../../services/user.vue";
import { Storage } from "@ionic/storage";
import { add } from "date-fns";
import { format, formatISO } from "date-fns";
import Reminders from "../reminder/Reminder.vue";
import Repeats from "../repetir/Repetir.vue";

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
        title: "Prueba de funcionamiento",
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
          data: {},
        },
        calendar: "personal",
        notes: "Notas de prueba",
        tags: ["tag de prueba"] as Array<string>,
        guest: ["contacto@dowar.xyz"] as Array<string>,
      },
      fileTranslate: Object(),
    };
  },
  mounted() {
    if (this.$route.params.id) {
      this.pageTitle = "Actualizar evento";
      this.getEventLocal(parseInt(this.$route.params.id as string));
    }
    eventBus().emitter.on("update-event", async (response: any) => {
      // console.log(response.event);
      // this.event = response.event;
      //this.pageTitle = "Actualizar evento";
      //  this.getEvent();
    });
    this.getFileTranslate().then(() => {
      this.pageTitle = this.fileTranslate["newEvent"];
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
    async save() {
      if (this.form.title == "") {
        this.$router.go(-1);
        return;
      }
      const event = {
        title: this.form.title,
        calendar: this.form.calendar,
        dateTime: JSON.stringify(this.form.datetime),
        guest: JSON.stringify(this.form.guest),
        notes: this.form.notes,
        reminders: JSON.stringify(this.form.reminders),
        repeats: JSON.stringify(this.form.repeats),
        tags: JSON.stringify(this.form.tags),
      };
      this.createEvent(event);
    },
    async createEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      // loading.present();

      eventsService()
        .createEvent(event)
        .then(async (response) => {
          // loading.dismiss();
          console.log(response);
          // const message = await userService().translate("saveEvent");
          // .then((response) => {
          //   return response;
          // });
          //eventBus().emitter.emit("new-element");
          //this.$router.go(-1);
          //this.openToast(message, "success");
        });
    },
    async updateEvent(event: Record<string, any>) {
      const loading = await this.presentLoading();
      loading.present();

      eventsService()
        .updateEvent(event)
        .then(async (response) => {
          loading.dismiss();
          // const message = await userService().translate("updateEvent");
          // .then((response) => {
          //   return response;
          // });
          eventBus().emitter.emit("update-event-success");
          this.$router.go(-1);
          //          this.openToast(message, "success");
        });
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

          element.repeats.frequencyName = await userService()
            .translate
            // element.repeats.frequency
            ();
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
    addTag() {
      this.form.tags.push((this.$refs.inputTag as any).$el.value);
      (this.$refs.inputTag as any).$el.value = "";
    },
    removeTag(index: number) {
      this.form.tags.splice(index, 1);
    },
    async presentLoading() {
      const loading = await loadingController.create({
        cssClass: "my-custom-class",
        message: "Espera por favor",
      });
      return loading;
    },
    customDateFormat(date: any, styleFormat: string) {
      return format(new Date(date), styleFormat);
    },
    addInvited() {
      this.form.guest.push((this.$refs.inputInvited as any).$el.value);
      (this.$refs.inputInvited as any).$el.value = "";
    },
    removeInvited(index: number) {
      this.form.guest.splice(index, 1);
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
          this.form.repeats.frequency = response.data.frequency;
          this.form.repeats.data = response.data.data;
        }
      });
      return modal.present();
    },
    async getFileTranslate() {
      this.fileTranslate = [await userService().translate()];
    },
  },
});
</script>
