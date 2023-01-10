<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="firstMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <section>
            <ion-button
              id="open-modal-add-document"
              fill="clear"
              expand="block"
            >
              <ion-icon :icon="addOutline"></ion-icon>
            </ion-button>

            <ion-modal ref="modalAddDocument" trigger="open-modal-add-document">
              <ion-header mode="ios" class="ion-no-border">
                <ion-toolbar>
                  <ion-buttons slot="start">
                    <ion-button
                      @click="
                        ($refs as any).modalAddDocument.$el.dismiss(
                          null,
                          'cancel'
                        )
                      "
                    >
                      <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                  </ion-buttons>

                  <ion-title>Agregar documento</ion-title>

                  <ion-buttons slot="end">
                    <section>
                      <ion-button id="open-modal-reminder" :strong="true">
                        <ion-icon :icon="timeOutline"></ion-icon>
                      </ion-button>

                      <ion-modal
                        ref="modalReminder"
                        trigger="open-modal-reminder"
                        :initial-breakpoint="0.65"
                        :breakpoints="[0, 0.25, 0.5, 0.75]"
                      >
                        <ion-header class="ion-no-border" mode="ios">
                          <ion-toolbar>
                            <ion-buttons slot="start">
                              <ion-button
                                @click="
                                  ($refs as any).modalReminder.$el.dismiss(
                                    null,
                                    'cancel'
                                  )
                                "
                              >
                                <ion-icon :icon="closeOutline"></ion-icon>
                              </ion-button>
                            </ion-buttons>

                            <ion-title>Vencimiento</ion-title>

                            <ion-buttons slot="end">
                              <ion-button :strong="true"
                                ><ion-icon :icon="saveOutline"></ion-icon
                              ></ion-button>
                            </ion-buttons>
                          </ion-toolbar>
                        </ion-header>

                        <ion-content class="ion-padding">
                          <!-- date start -->
                          <section>
                            <ion-item button @click="openPopoverReminderStart">
                              <ion-label>Inicio</ion-label>
                              <ion-label slot="end">{{
                                format(new Date(dateReminderStart), "Pp")
                              }}</ion-label>
                            </ion-item>

                            <ion-popover
                              :is-open="popoverReminderStartOpen"
                              :event="popoverReminderStartEvent"
                              @did-dismiss="popoverReminderStartOpen = false"
                            >
                              <ion-content class="ion-padding">
                                <ion-datetime
                                  :show-default-buttons="true"
                                  cancel-text="Cancelar"
                                  done-text="Confirmar"
                                  locale="en-GB-u-hc-h12"
                                  @ion-change="
                                    dateReminderStart = $event.detail
                                      .value as string
                                  "
                                ></ion-datetime>
                              </ion-content>
                            </ion-popover>
                          </section>

                          <!-- date end -->
                          <section>
                            <ion-item button @click="openPopoverReminderEnd">
                              <ion-label>Final</ion-label>
                              <ion-label slot="end">{{
                                format(new Date(dateReminderEnd), "Pp")
                              }}</ion-label>
                            </ion-item>

                            <ion-popover
                              :is-open="popoverReminderEndOpen"
                              :event="popoverReminderEndEvent"
                              @did-dismiss="popoverReminderEndOpen = false"
                            >
                              <ion-content class="ion-padding">
                                <ion-datetime
                                  :show-default-buttons="true"
                                  cancel-text="Cancelar"
                                  done-text="Confirmar"
                                  locale="en-GB-u-hc-h12"
                                  @ion-change="
                                    dateReminderEnd = $event.detail
                                      .value as string
                                  "
                                ></ion-datetime>
                              </ion-content>
                            </ion-popover>
                          </section>

                          <!-- reminder -->
                          <section>
                            <ion-item>
                              <ion-label>Crear recordatorio</ion-label>
                              <ion-toggle v-model="reminderToggle"></ion-toggle>
                            </ion-item>

                            <ion-item v-if="reminderToggle == true">
                              <ion-label>Recordar</ion-label>
                              <ion-select
                                v-model="reminderRepeat"
                                ok-text="Confirmar"
                                cancel-text="Cancelar"
                              >
                                <ion-select-option value="just"
                                  >A tiempo</ion-select-option
                                >
                                <ion-select-option valaue="5mb"
                                  >5 minutos antes</ion-select-option
                                >
                                <ion-select-option valaue="10mb"
                                  >10 minutos antes</ion-select-option
                                >
                                <ion-select-option valaue="30mb"
                                  >30 minutos antes</ion-select-option
                                >
                                <ion-select-option valaue="1hb"
                                  >1 hora antes</ion-select-option
                                >
                                <ion-select-option valaue="1wb"
                                  >1 dia antes</ion-select-option
                                >
                              </ion-select>
                            </ion-item>
                          </section>
                        </ion-content>
                      </ion-modal>
                    </section>

                    <ion-button :strong="true">
                      <ion-icon :icon="saveOutline"></ion-icon>
                    </ion-button>
                  </ion-buttons>
                </ion-toolbar>
              </ion-header>

              <ion-content class="ion-padding">
              <ion-item>
                <ion-label position=floating>Titulo</ion-label>
                <ion-input placeholder='Documento 1'></ion-input>
              </ion-item>

                <AddDocumentComponent></AddDocumentComponent>
              </ion-content>
            </ion-modal>
          </section>

          <ion-button id="open-main-calendar" fill="clear">
            <ion-icon :icon="calendarOutline"></ion-icon>
          </ion-button>
          <ion-popover trigger="open-main-calendar" :show-backdrop="false">
            <ion-datetime
              ref="mainCalendar"
              v-model="date"
              presentation="date"
              @ion-change="selectDay($event)"
            >
            </ion-datetime>
            <ion-item>
              <ion-button slot="end" fill="clear" @click="resetCalendar()"
                >Reset</ion-button
              >
            </ion-item>
          </ion-popover>

          <ion-button
            id="open-main-calendar"
            fill="clear"
            @click="refreshContent()"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ion-refresh="refreshContent()">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-accordion-group :multiple="true">
        <ion-list v-for="(event, name) in formatEvents" :key="name">
          <ion-list-header>{{ formatTimeLine(name) }}</ion-list-header>
          <ion-row v-for="dataEvent in event" :key="dataEvent" class="center">
            <ion-col size="12" size-md="10" size-lg="6">
              <ion-card>
                <ion-accordion :value="Math.random().toString()">
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
  IonMenuButton,
  IonButtons,
  IonDatetime,
  IonPopover,
  IonRefresher,
  IonList,
  IonListHeader,
  toastController,
  alertController,
  IonAccordion,
  IonAccordionGroup,
  IonCard,
  IonCardTitle,
  IonCardHeader,
  IonRow,
  IonCol,
  IonCardSubtitle,
  IonItem,
  IonLabel,
  IonChip,
  IonIcon,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from "@ionic/vue";
import { defineComponent, ref } from "vue";
import {
  calendarOutline,
  documentTextOutline,
  addOutline,
  refreshOutline,
  closeOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import { formatISO } from "date-fns";
import { capitalizeFirstLetter } from "../../services/system";
import { useEventsStore } from "../../store/eventsStore";
import {
  getEvents as getEventsService,
  removeEvent as removeEventService,
  formatDateTime as formatDateTimeService,
} from "../../services/event";
import { Storage } from "@ionic/storage";
import { createOutline, trashOutline } from "ionicons/icons";
import { utcToZonedTime, format } from "date-fns-tz";
import { USER_EVENTS } from "../../services/graphql";
import { storeToRefs } from "pinia";
import AddDocumentComponent from "../../components/documents/add_document/AddDocumentComponent.vue";

export default defineComponent({
  name: "InicioPage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonTitle,
    IonMenuButton,
    IonButton,
    IonButtons,
    IonDatetime,
    IonPopover,
    IonRefresher,
    IonList,
    IonListHeader,
    IonAccordion,
    IonAccordionGroup,
    IonCard,
    IonCardTitle,
    IonCardHeader,
    IonRow,
    IonCol,
    IonCardSubtitle,
    IonItem,
    IonLabel,
    IonChip,
    IonIcon,
    IonModal,
    AddDocumentComponent,
    IonSelect,
    IonSelectOption,
    IonToggle,
  },

  setup() {
    const customDatetime = ref();
    const eventsStore = useEventsStore();
    const { events, date } = storeToRefs(eventsStore);
    const reset = () => {
      if (customDatetime.value === undefined) return;

      customDatetime.value.$el.reset();
    };
    return {
      pageTitle: "Inicio",
      calendarOutline,
      documentTextOutline,
      addOutline,
      refreshOutline,
      capitalizeFirstLetter: capitalizeFirstLetter,
      createOutline,
      trashOutline,
      format,
      events,
      eventsStore,
      date,
      closeOutline,
      saveOutline,
      timeOutline,
    };
  },

  data() {
    // const date = formatISO(new Date());
    // const date = formatISO(new Date()).split("T")[0];
    const storage = new Storage();

    storage.create();
    return {
      mainSegment: "calendar" as "calendar" | "asigned",
      isOpenModalAddDocument: false,
      popoverReminderStartOpen: false,
      popoverReminderStartEvent: Event as any,
      popoverReminderEndOpen: false,
      popoverReminderEndEvent: Event as any,
      dateReminderStart: new Date().toISOString(),
      dateReminderEnd: new Date().toISOString(),
      reminderRepeat: "just",
      reminderToggle: false,
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
    this.eventsStore.loadEvents({ refetch: true });
  },

  methods: {
    async resetCalendar() {
      (
        this.$refs.mainCalendar as InstanceType<typeof HTMLFormElement>
      ).$el.reset();
    },

    selectDay(e: any) {
      const date = e.detail.value;
      this.eventsStore.date = date;
      this.eventsStore.loadEvents({ refetch: false });
    },

    async openEvent(event: object) {
      // const modal = await modalController.create({
      //   component: EventComponent,
      //   componentProps: {
      //     event,
      //   },
      // });
      // return modal.present();
    },

    createEvent() {
      this.$router.push({ name: "CreateEvent" });
    },

    formatDate(date: string | Date, format: string) {
      if (date == null) {
        return "";
      }
      return formatDateTimeService(date, format);
    },

    refreshContent() {
      // setTimeout(async () => {}, 200);
    },

    async presentLoading() {
      // const loading = await loadingController.create({
      //   cssClass: "my-custom-class",
      //   message: this.fileTranslate[0].pleaseWait,
      // });
      // return loading;
    },

    updateEvent(id: number | string) {
      this.$router.push("/event/update/" + id);
    },

    async removeEvent(id: string | number) {
      // const loading = await this.presentLoading();
      // loading.present();
      // removeEventService(id)
      //   .then((response: any) => {
      //     // this.getEvents();
      //     const message = this.fileTranslate[0].removeEvent;
      //     this.openToast(message, "success");
      //     loading.dismiss();
      //   })
      //   .catch((e) => {
      //     loading.dismiss();
      //   });
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
            handler: (blah: any) => {
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

    openPopoverReminderStart(ev: Event) {
      this.popoverReminderStartEvent = ev;
      this.popoverReminderStartOpen = true;
    },

    openPopoverReminderEnd(ev: Event) {
      this.popoverReminderEndEvent = ev;
      this.popoverReminderEndOpen = true;
    },
  },
});
</script>
