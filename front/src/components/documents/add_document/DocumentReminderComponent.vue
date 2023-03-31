<template>
  <ion-header :translucent="true" class="ion-no-border" mode="ios">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

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
            @ion-change="dateReminderStart = $event.detail.value as string"
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
            @ion-change="dateReminderEnd = $event.detail.value as string"
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
          <ion-select-option value="just">A tiempo</ion-select-option>
          <ion-select-option valaue="5mb">5 minutos antes</ion-select-option>
          <ion-select-option valaue="10mb">10 minutos antes</ion-select-option>
          <ion-select-option valaue="30mb">30 minutos antes</ion-select-option>
          <ion-select-option valaue="1hb">1 hora antes</ion-select-option>
          <ion-select-option valaue="1wb">1 dia antes</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-accordion-group>
        <ion-accordion value="first">
          <ion-item slot="header">
            <ion-label>First Accordion</ion-label>
          </ion-item>

          <div slot="content" class="ion-padding">
            <div v-for="(calendar, index) in hours" :key="index">
              {{ calendar }}
            </div>
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </section>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  modalController,
} from "@ionic/vue";
import {
  closeOutline,
  moveOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import { format } from "date-fns";

export default defineComponent({
  name: "MenuOptComponent",

  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
  },

  setup() {
    return {
      closeOutline,
      pageTitle: "Opciones del documento",
      saveOutline,
      moveOutline,
      timeOutline,
      format,
    };
  },

  data() {
    return {
      popoverReminderStartOpen: false,
      popoverReminderStartEvent: Event as any,
      popoverReminderEndOpen: false,
      popoverReminderEndEvent: Event as any,
      dateReminderStart: new Date().toISOString(),
      dateReminderEnd: new Date().toISOString(),
      reminderRepeat: "just",
      reminderToggle: false,
      hours: Array<{ hour: string }>,
    };
  },

  computed: {
    generateCalendar() {
      const hours = [];
      for (let i = 0; i < 24; i++) {
        hours.push({
          hour: i,
        });
      }
      return hours;
    },
  },

  methods: {
    closeModal() {
      return modalController.dismiss();
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
