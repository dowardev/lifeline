<template>
  <ion-header :translucent="true" mode="ios" class="ion-no-border">
    <!-- buttons mobile -->
    <ion-toolbar>
      <ion-buttons v-if="!isPlatform('desktop')" slot="start">
        <ion-button @click="closPage()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <ion-button @click="saveReminder()">
          <ion-icon :icon="saveOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <ion-toolbar>
      <ion-segment
        v-model="reminderSegment"
        :mode="isPlatform('ios') ? 'ios' : 'md'"
      >
        <ion-segment-button value="date-start">Inicio</ion-segment-button>
        <ion-segment-button value="date-end">Final</ion-segment-button>
      </ion-segment>
    </ion-toolbar>
  </ion-header>

  <ion-content :fullscreen="true">
    <!-- date start -->
    <section v-if="reminderSegment == 'date-start'" class="ion-padding">
      <div class="center">
        <ion-datetime
          ref="datetimeStart"
          v-model="dateReminderStart"
          class="transparent"
          :min="new Date().toISOString().split('T')[0]"
          @ion-change="dateReminderStart = $event.detail.value as string"
        >
        </ion-datetime>
      </div>

      <div style="float: right" class="ion-padding-top ion-padding-bottom">
        <ion-button
          color="danger"
          fill="clear"
          size="default"
          @click="resetStart()"
          >Reiniciar</ion-button
        >
      </div>
    </section>

    <!-- date end -->
    <section v-if="reminderSegment == 'date-end'" class="ion-padding">
      <div style="center">
        <ion-datetime
          ref="datetimeEnd"
          v-model="dateReminderEnd"
          class="transparent"
          @ion-change="dateReminderEnd = $event.detail.value as string"
        >
        </ion-datetime>
      </div>

      <div style="float: right" class="ion-padding-top ion-padding-bottom">
        <ion-button
          color="danger"
          fill="clear"
          size="default"
          @click="resetEnd()"
          >Reiniciar</ion-button
        >
      </div>
    </section>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  isPlatform,
  modalController,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonDatetime,
  popoverController,
} from "@ionic/vue";
import { add, format } from "date-fns";
import { closeOutline, saveOutline } from "ionicons/icons";
import { ref } from "vue";

const props = defineProps({
  dataReminders: {
    type: Object,
    default: function () {
      return {
        reminderStart: "",
        reminderEnd: "",
      };
    },
  },
});

const emitEvent = defineEmits(["reminders"]);

const datetimeStart = ref();
const resetStart = () => datetimeStart.value.$el.reset();

const datetimeEnd = ref();
const resetEnd = () => datetimeEnd.value.$el.reset();

const reminderSegment = ref("date-start");
const pageTitle = "Recordatorios";

const dateReminderStart =
  props.dataReminders.reminderStart != ""
    ? props.dataReminders.reminderStart
    : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

const dateReminderEnd =
  props.dataReminders.reminderEnd != ""
    ? props.dataReminders.reminderEnd
    : format(
        new Date(
          add(new Date(), {
            hours: 1,
          })
        ),
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      );

// functions
const closPage = () => {
  modalController.dismiss();
};

const saveReminder = async () => {
  const dateStart = dateReminderStart;
  const dateEnd = dateReminderEnd;
  emitEvent("reminders", { data: { start: dateStart, end: dateEnd } });

  const modal = await modalController.getTop();
  if (modal) await modalController.dismiss();
  else await popoverController.dismiss();
};
</script>
