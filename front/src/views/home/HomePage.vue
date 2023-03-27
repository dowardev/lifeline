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
              fill="clear"
              expand="block"
              @click="openModalAddDocument()"
            >
              <ion-icon :icon="addOutline"></ion-icon>
            </ion-button>
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

    <ion-content
      v-if="useDocument().getUserDocuments() != undefined"
      :fullscreen="true"
    >
      <ion-refresher slot="fixed" @ion-refresh="refreshContent()">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-row>
        <ion-col
          v-for="(document, index) in useDocument().getUserDocuments()"
          :key="index"
          size-xs="12"
          class="center"
        >
          <ion-card
            @click="openModalUpdateDocument({ documentId: document.id })"
            @contextmenu.prevent="
              openPopoverRightMenu({ ev: $event, documentId: document.id })
            "
            @press="
              openPopoverRightMenu({ ev: $event, documentId: document.id })
            "
          >
            <ion-card-header>
              <ion-card-title>{{ document.title }}</ion-card-title>
            </ion-card-header>
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
  modalController,
  popoverController,
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
import { useDocument } from "../../composables/useDocument";
import RightMenuComponent from "./RightMenuComponent.vue";

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
      useDocument: useDocument,
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
    // this.eventsStore.loadEvents({ refetch: true });
    this.loadDocuments();
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

    async openModalAddDocument() {
      const modal = await modalController.create({
        component: AddDocumentComponent,
      });
      modal.present();
    },

    async loadDocuments() {
      await useDocument().loadUserDocuments();
    },

    async openModalUpdateDocument(params: { documentId: string }) {
      const documentId = params.documentId;

      const modal = await modalController.create({
        component: AddDocumentComponent,
        componentProps: {
          documentIdProp:documentId,
        },
      });
      modal.present();
    },

    async deleteDocument(params: { documentId: string }) {
      const documentId = params.documentId;
      await useDocument().deleteDocument({ documentId });
    },

    async openPopoverRightMenu(params: { ev: Event; documentId: string }) {
      const documentId = params.documentId;
      const ev = params.ev;

      const popover = await popoverController.create({
        component: RightMenuComponent,
        event: ev,
        showBackdrop: false,
      });
      await popover.present();

      const { role, data } = await popover.onDidDismiss();
      if (role == "confirm" && data.option == "delete") {
        await this.deleteDocument({ documentId });
      }
    },
  },
});
</script>
