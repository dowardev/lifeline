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
    <section v-if="reminderSegment == 'date-start'" class="ion-padding center">
      <ion-datetime
        ref="datetimeStart"
        v-model="dateReminderStart"
        class="transparent"
        @ion-change="dateReminderStart = $event.detail.value as string"
      >
        <ion-buttons slot="buttons">
          <ion-button color="danger" @click="resetStart()"
            >Reiniciar</ion-button
          >
          <ion-button color="primary" @click="cancelStart()"
            >Cancelar</ion-button
          >
          <ion-button fill="solid" color="primary" @click="confirmStart()"
            >Confirmar</ion-button
          >
        </ion-buttons>
      </ion-datetime>
    </section>

    <!-- date end -->
    <section v-if="reminderSegment == 'date-end'" class="ion-padding center">
      <ion-datetime
        ref="datetimeEnd"
        v-model="dateReminderEnd"
        class="transparent"
        @ion-change="dateReminderEnd = $event.detail.value as string"
      >
        <ion-buttons slot="buttons">
          <ion-button color="danger" @click="resetEnd()">Reiniciar</ion-button>
          <ion-button color="primary" @click="cancelEnd()">Cancelar</ion-button>
          <ion-button fill="solid" color="primary" @click="confirmEnd()"
            >Confirmar</ion-button
          >
        </ion-buttons>
      </ion-datetime>
    </section>
  </ion-content>
</template>

<script lang="ts">
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
} from "@ionic/vue";
import { add } from "date-fns";
import { closeOutline, saveOutline } from "ionicons/icons";
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonDatetime,
  },

  props: {
    dataReminders: {
      type: Object,
      default: function () {
        return {
          reminderStart: "",
          reminderEnd: "",
        };
      },
    },
  },

  emits: ["reminders"],

  setup() {
    const datetimeStart = ref();
    const resetStart = () => datetimeStart.value.$el.reset();
    const cancelStart = () => datetimeStart.value.$el.cancel();
    const confirmStart = () => {
      datetimeStart.value.$el.confirm();
      reminderSegment.value = "date-end";
    };

    const datetimeEnd = ref();
    const resetEnd = () => datetimeEnd.value.$el.reset();
    const cancelEnd = () => {
      datetimeEnd.value.$el.cancel();
      reminderSegment.value = "date-start";
    };
    const confirmEnd = () => {
      datetimeEnd.value.$el.confirm();
    };

    const reminderSegment = ref("date-start");
    return {
      pageTitle: "Recordatorios",
      closeOutline,
      saveOutline,
      isPlatform,
      datetimeStart,
      resetStart,
      cancelStart,
      confirmStart,
      datetimeEnd,
      resetEnd,
      cancelEnd,
      confirmEnd,
      reminderSegment,
    };
  },

  data() {
    const dateReminderStart =
      this.dataReminders.reminderStart != ""
        ? this.dataReminders.reminderStart
        : new Date().toISOString();

    const dateReminderEnd =
      this.dataReminders.reminderEnd != ""
        ? this.dataReminders.reminderEnd
        : new Date(
            add(new Date(dateReminderStart), {
              hours: 1,
            })
          ).toISOString();

    return {
      dateReminderStart,
      dateReminderEnd,
    };
  },

  methods: {
    closPage() {
      modalController.dismiss();
    },

    saveReminder() {
      const dateStart = this.dateReminderStart;
      const dateEnd = this.dateReminderEnd;
      this.$emit("reminders", { data: { dateStart, dateEnd } });
    },
  },
});
</script>
