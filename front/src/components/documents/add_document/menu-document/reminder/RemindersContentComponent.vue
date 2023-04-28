<template>
  <!-- date start -->
  <section v-if="reminderSegment == 'date-start'" class="center">
    <ion-datetime
      ref="datetimeStart"
      v-model="dateReminderStart"
      class="transparent"
      @ion-change="dateReminderStart = $event.detail.value as string"
    >
      <ion-buttons slot="buttons">
        <ion-button color="danger" @click="resetStart()">Reiniciar</ion-button>
        <ion-button color="primary" @click="cancelStart()">Cancelar</ion-button>
        <ion-button fill="solid" color="primary" @click="confirmStart()"
          >Confirmar</ion-button
        >
      </ion-buttons>
    </ion-datetime>
  </section>

  <!-- date end -->
  <section v-if="reminderSegment == 'date-end'" class="center">
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

  <!-- reminders -->
  <section v-if="reminderSegment == 'reminders'">
    <ion-item v-for="(repeat, index) in reminderRepeat" :key="index">
      <ion-checkbox
        label-placement="end"
        :value="repeat.value"
        :checked="repeat.isChecked"
        >{{ repeat.text }}</ion-checkbox
      >
    </ion-item>

    <ion-item lines="none">
      <ion-button slot="end" color="danger" fill="clear" size="default"
        >Cancelar</ion-button
      >

      <ion-button slot="end" color="primary" size="default"
        >Confirmar</ion-button
      >
    </ion-item>
  </section>
</template>

<script setup lang="ts">
import { IonButton, IonItem, IonDatetime, IonCheckbox } from "@ionic/vue";
import { ref } from "vue";

const datetimeStart = ref();
const datetimeEnd = ref();
const resetEnd = () => datetimeEnd.value.$el.reset();
const cancelEnd = () => {
  datetimeEnd.value.$el.cancel();
  reminderSegment.value = "date-start";
};
const confirmEnd = () => {
  datetimeEnd.value.$el.confirm();
  reminderSegment.value = "reminders";
};
const resetStart = () => datetimeStart.value.$el.reset();
const cancelStart = () => datetimeStart.value.$el.cancel();
const confirmStart = () => {
  datetimeStart.value.$el.confirm();
  reminderSegment.value = "date-end";
};
const reminderSegment = ref("date-start");

const dateReminderStart = ref(new Date().toISOString());
const dateReminderEnd = ref(new Date().toISOString());
const reminderRepeat = ref([
  { value: "just", text: "A tiempo", isChecked: false },
  { value: "5mb", text: "5 minutos antes", isChecked: false },
  { value: "10mb", text: "10 minutos antes", isChecked: false },
  { value: "30mb", text: "30 minutos antes", isChecked: false },
  { value: "1hb", text: "1 hora antes", isChecked: false },
  { value: "1db", text: "1 dia antes", isChecked: false },
]);
</script>
