<template>
  <ion-header :translucent="true" mode="ios" class="ion-no-border">
    <!-- buttons mobile -->
    <ion-toolbar>
      <ion-buttons slot="start">
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
      <!-- segment buttons -->
      <ion-segment
        v-model="reminderSegment"
        :mode="isPlatform('ios') ? 'ios' : 'md'"
        :scrollable="true"
        class="ion-padding-start ion-padding-end"
      >
        <ion-segment-button value="date-start">Inicio</ion-segment-button>
        <ion-segment-button value="date-end">Final</ion-segment-button>
        <ion-segment-button value="reminders">Recordatorios</ion-segment-button>
        <ion-segment-button value="repeats">Repetir</ion-segment-button>
      </ion-segment>
    </ion-toolbar>
  </ion-header>

  <ion-content :fullscreen="true">
    <!-- date start -->
    <section v-if="reminderSegment == 'date-start'" class="ion-padding">
      <div class="center">
        <ion-datetime
          ref="datetimeStart"
          class="transparent"
          :min="formatISO(new Date()).split('T')[0]"
          :max="
            add(new Date(), {
              years: 10,
            }).toISOString()
          "
          :value="formatISO(dates.start)"
          :first-day-of-week="1"
          :locale="currentLocale"
          @ion-change="dates.start = new Date($event.detail.value as string)"
        >
          <span slot="time-label">Tiempo</span>
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
          class="transparent"
          :min="formatISO(new Date()).split('T')[0]"
          :max="
            add(new Date(), {
              years: 10,
            }).toISOString()
          "
          :value="formatISO(dates.end)"
          :first-day-of-week="1"
          @ion-change="dates.end = new Date($event.detail.value as string)"
        >
          <span slot="time-label">Tiempo</span>
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

    <!-- notifications -->
    <section
      v-if="reminderSegment == 'reminders'"
      class="ion-padding"
      style="overflow: scroll; height: 70vh"
    >
      <ion-item v-for="reminder in notificationsData" :key="reminder.name">
        <ion-checkbox
          label-placement="start"
          :checked="reminder.checked"
          @ion-change="reminder.checked = !reminder.checked"
          >{{ reminder.text }}</ion-checkbox
        >
      </ion-item>
    </section>

    <!-- repeat component -->
    <section
      v-if="reminderSegment == 'repeats'"
      class="ion-padding"
      style="overflow: scroll; height: 70vh"
    >
      <RepeatsComponent :data="dataRepeat" @update-data="dataRepeat = $event" />
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
  IonCheckbox,
  popoverController,
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { computed, onMounted, ref, watch } from "vue";
import { add, formatISO } from "date-fns";

// components
import RepeatsComponent from "./repeat/RepeatsComponent.vue";

const props = defineProps({
  segmentOption: { default: "date-start", type: String },
  dates: {
    type: Object,
    default: () => {
      return {
        start: new Date(),
        end: new Date(),
      };
    },
  },
  notifications: {
    type: Array,
    default: () => [],
  },
  repeat: {
    type: Object,
    default: () => {
      return {
        frecuency: 1,
        type: "daily",
        daysWeek: [],
      };
    },
  },
  idReminders: { type: Array, default: () => [] },
});

const emitEvent = defineEmits(["updateDataReminders"]);

const datetimeStart = ref();
const resetStart = () => datetimeStart.value.$el.reset();

const datetimeEnd = ref();
const resetEnd = () => datetimeEnd.value.$el.reset();

const reminderSegment = ref("date-start");
const pageTitle = "Recordatorios";

const dates = ref({
  start: props.dates.start,
  end: props.dates.end,
});

const idReminders = props.idReminders;

const notificationsData = ref([
  {
    name: "just",
    text: "Justo a tiempo",
    checked: false,
  },
  {
    name: "5mb",
    text: "5 minutos antes",
    checked: false,
  },
  {
    name: "10mb",
    text: "10 minutos antes",
    checked: false,
  },
  {
    name: "15mb",
    text: "15 minutos antes",
    checked: false,
  },
  {
    name: "30mb",
    text: "30 minutos antes",
    checked: false,
  },
  {
    name: "1hb",
    text: "1 hora antes",
    checked: false,
  },
  {
    name: "2hb",
    text: "2 horas antes",
    checked: false,
  },
  {
    name: "1db",
    text: "1 dia antes",
    checked: false,
  },
  {
    name: "2db",
    text: "2 dias antes",
    checked: false,
  },
  {
    name: "1wb",
    text: "1 semana antes",
    checked: false,
  },
  {
    name: "1mtb",
    text: "1 mes antes",
    checked: false,
  },
]);
const dataRepeat = ref({ type: "daily", frecuency: 1 } as {
  frecuency: number;
  type: "unique" | "daily" | "weekly" | "monthly" | "annually";
  daysWeek?: string[];
});
const currentLocale = navigator.language;

// computed
const endDate = computed(() => {
  return dates.value.end;
});
const startDate = computed(() => {
  return dates.value.start;
});

// watch
watch(startDate, (newValue, oldValue) => {
  const dateStart = new Date(newValue);
  const dateEnd = new Date(dates.value.end);
  if (dateStart > dateEnd) dates.value.end = dateStart;
});
watch(endDate, (newValue, oldValue) => {
  const dateStart = new Date(dates.value.start);
  const dateEnd = new Date(newValue);
  if (dateEnd < dateStart) dates.value.start = dateEnd;
});

// mouted
onMounted(() => {
  reminderSegment.value = props.segmentOption as string;
  notificationsData.value.forEach((notification) => {
    if (props.notifications.includes(notification.name)) {
      notification.checked = true;
    }
  });
  dataRepeat.value = props.repeat as any;
});

// functions
const closPage = async () => {
  await popoverController.dismiss();
};

const saveReminder = async () => {
  const dateStart = dates.value.start;
  const dateEnd = dates.value.end;
  const remindersChecked = getCheckedReminders();
  const dateRepeat = dataRepeat;

  emitEvent("updateDataReminders", {
    data: {
      start: dateStart,
      end: dateEnd,
      remindersChecked,
      dateRepeat,
      idReminders,
    },
  });
  closPage();
};

function getCheckedReminders() {
  return notificationsData.value
    .filter((reminder) => reminder.checked)
    .map((day) => day.name);
}
</script>
