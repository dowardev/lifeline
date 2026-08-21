<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

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
// 1. Imports (ionic/vue/ionicons)
import { IonButton, IonButtons, IonCheckbox, IonDatetime, IonItem } from "@ionic/vue";
import { ref } from "vue";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const datetimeStart = ref();
const datetimeEnd = ref();
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

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
const resetEnd = (): void => datetimeEnd.value.$el.reset();
const cancelEnd = (): void => {
  datetimeEnd.value.$el.cancel();
  reminderSegment.value = "date-start";
};
const confirmEnd = (): void => {
  datetimeEnd.value.$el.confirm();
  reminderSegment.value = "reminders";
};
const resetStart = (): void => datetimeStart.value.$el.reset();
const cancelStart = (): void => datetimeStart.value.$el.cancel();
const confirmStart = (): void => {
  datetimeStart.value.$el.confirm();
  reminderSegment.value = "date-end";
};
</script>
