<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <!-- add event button -->
        <ion-button fill="clear" @click="emits('add', $event)"
          ><ion-icon :icon="addOutline"></ion-icon
        ></ion-button>

        <div v-if="!isPlatform('mobile')">
          <!-- previous button -->
          <ion-button fill="clear" size="small" @click="previousWeek()"
            ><ion-icon :icon="chevronBackOutline"></ion-icon
          ></ion-button>

          <!-- next button -->
          <ion-button fill="clear" size="small" @click="nextWeek()"
            ><ion-icon :icon="chevronForwardOutline"></ion-icon
          ></ion-button>

          <!-- button date selector -->
          <ion-button
            fill="clear"
            size="small"
            style="width: 92px"
            @click="
              (popoverMainCalendar.event = $event),
                (popoverMainCalendar.open = true)
            "
          >
            {{
              translateMonth({
                monthName: months[getMonth(currentDate)],
              })
            }}
          </ion-button>
          <!-- today button -->
          <ion-button size="small" fill="clear" @click="today()">
            <ion-icon :icon="todayOutline"></ion-icon>
          </ion-button>
        </div>

        <!-- button popover  main options -->
        <ion-button
          fill="clear"
          @click="
            popOverMainOptions.event = $event;
            popOverMainOptions.open = true;
          "
        >
          <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- popovers -->
    <!-- popover main calendar -->
    <ion-popover
      :class="{ 'popover-main-calendar-ios': isPlatform('ios') }"
      :is-open="popoverMainCalendar.open"
      :event="popoverMainCalendar.event"
      @did-dismiss="popoverMainCalendar.open = false"
    >
      <ion-content>
        <ion-datetime
          presentation="date"
          :value="currentDate.toISOString()"
          :max="
            add(new Date(), {
              years: 10,
            }).toISOString()
          "
          :first-day-of-week="1"
          @ion-change="
            eventController.setCurrentDate({
              date: new Date($event.target.value as any),
            })
          "
        ></ion-datetime>
      </ion-content>
    </ion-popover>

    <!-- popover main options -->
    <ion-popover
      :is-open="popOverMainOptions.open"
      :event="popOverMainOptions.event"
      @did-dismiss="popOverMainOptions.open = false"
    >
      <ion-content>
        <ion-list v-if="isPlatform('mobile')">
          <ion-list-header>
            <ion-label>General</ion-label>
          </ion-list-header>

          <ion-row>
            <ion-col>
              <!-- previous button -->
              <ion-button fill="clear" size="small" @click="previousWeek()"
                ><ion-icon :icon="chevronBackOutline"></ion-icon
              ></ion-button>

              <!-- next button -->
              <ion-button fill="clear" size="small" @click="nextWeek()"
                ><ion-icon :icon="chevronForwardOutline"></ion-icon
              ></ion-button>

              <!-- button date selector -->
              <ion-button
                fill="clear"
                size="small"
                style="width: 92px"
                @click="
                  (popoverMainCalendar.event = $event),
                    (popoverMainCalendar.open = true)
                "
              >
                {{
                  translateMonth({
                    monthName: months[getMonth(currentDate)],
                  })
                }}
              </ion-button>
              <!-- today button -->
              <ion-item button lines="none" @click="today()">
                <ion-icon slot="start" :icon="todayOutline"></ion-icon>
                <ion-label>Hoy</ion-label>
              </ion-item>
            </ion-col>
          </ion-row>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Otros</ion-label>
          </ion-list-header>

          <ion-row>
            <ion-col>
              <!-- button sync -->
              <ion-item
                button
                lines="none"
                @click="
                  popOverMainOptions.open = false;
                  emits('sync');
                "
              >
                <ion-icon slot="start" :icon="syncOutline"></ion-icon>
                <ion-label class="ion-text-wrap">Sincronizar</ion-label>
              </ion-item>

              <!-- button modal reschedule tasks -->
              <ion-item button lines="none" @click="emits('reschedule')">
                <ion-icon slot="start" :icon="stopwatchOutline"></ion-icon>
                <ion-label class="ion-text-wrap"
                  >Reagendar elementos vencidos</ion-label
                >
              </ion-item>
            </ion-col>
          </ion-row>
        </ion-list>
      </ion-content>
    </ion-popover>
    <!-- end popovers -->

    <!-- toasts -->
    <!-- toast sync -->
    <ion-toast
      :message="toastProps.message"
      :duration="1500"
      :is-open="toastProps.isOpen"
      mode="ios"
      @did-dismiss="toastProps.isOpen = false"
    ></ion-toast>
  </div>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonDatetime,
  IonPopover,
  IonTitle,
  IonToast,
  IonToolbar,
  isPlatform,
} from "@ionic/vue";
import { add, getMonth, sub } from "date-fns";
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  ellipsisVerticalOutline,
  stopwatchOutline,
  syncOutline,
  todayOutline,
} from "ionicons/icons";
import { Months } from "@/utils/interfaces";
import { ref } from "vue";
import { onMounted } from "vue";
import { reactive } from "vue";
import { watch } from "vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
const systemController = new SystemController();
const eventController = new EventController();

interface Day {
  date: Date;
}

const emits = defineEmits(["add", "reschedule", "sync"]);

const pageTitle = "Agenda";
const currentDate = ref(new Date());
const days = ref(Array<Day>());
const popoverMainCalendar = reactive({
  open: false,
  event: Event,
});
const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const popOverMainOptions = reactive({
  open: false,
  event: Event,
});
const toastProps = ref({ isOpen: false, message: {} });

// mounted
onMounted(async () => {
  days.value = getDaysForCurrentWeek({ date: new Date() });
  // await eventController.loadEvents();
  currentDate.value = await eventController.getCurrentDateStored();
  eventController.setCurrentDate({ date: currentDate.value });
});

// watch
watch(
  () => eventController.getCurrentDate(),

  async (date) => {
    currentDate.value = date;
  }
);

// functions
function getDaysForCurrentWeek(params: { date: Date }): Day[] {
  const date = params.date;
  const days = [];
  const dayOfWeek = date.getDay();
  const firstDayOfWeek = new Date(date);
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  firstDayOfWeek.setDate(date.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    days.push({
      date: day,
    });
  }

  return days;
}

function previousWeek(): void {
  const nextDate = new Date(
    sub(eventController.getCurrentDate(), {
      days: 7,
    })
  );
  eventController.setCurrentDate({ date: nextDate });
  eventController.setCurrentDateStored({ date: nextDate });
}

function nextWeek(): void {
  const nextDate = new Date(
    add(eventController.getCurrentDate(), {
      days: 7,
    })
  );
  eventController.setCurrentDate({ date: nextDate });
  eventController.setCurrentDateStored({ date: nextDate });
}

function today(): void {
  eventController.setCurrentDate({ date: new Date() });
  eventController.setCurrentDateStored({ date: new Date() });
}

function translateMonth(params: { monthName: string }): string {
  const monthName = params.monthName as keyof Months;

  let result = systemController.translateMonth({
    monthName,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

async function syncData(): Promise<void> {
  toastProps.value.message = "Sincronización iniciada";
  toastProps.value.isOpen = true;
  await eventController.sync();
  await eventController.loadEvents();
  toastProps.value.message = "Sincronización terminada";
  toastProps.value.isOpen = true;
}
</script>

<style scoped>
table.schedule-table {
  border-collapse: collapse;
}

table.schedule-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

table.schedule-table td:first-child {
  position: sticky;
  left: 0;
}

table.schedule-table td:not(:first-child) {
  position: relative;
  /* width: 150px; */
}

table.schedule-table thead {
  font-weight: bold;
  border: none !important;
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--ion-background-light-color);
}

table.schedule-table tr td:first-child,
table.schedule-table th:first-child {
  border: none !important;
  z-index: 3;
  background-color: var(--ion-background-light-color);
}

table.schedule-table td:nth-child(n + 2) {
  min-width: 210px;
}

@media only screen and (min-width: 768px) {
  table.schedule-table td:nth-child(n + 2) {
    min-width: 180px;
  }
}

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}

ion-content {
  --offset-bottom: auto !important;
  --overflow: hidden;
  overflow: auto;
}

ion-content::-webkit-scrollbar {
  display: none;
}

.today {
  color: var(--ion-color-primary);
}

.popover-main-calendar-ios {
  --width: 66vw;
}

.space-button-date-selector {
  width: 7rem;
  display: flex;
  justify-content: center;
}

@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
  .space-button-date-selector {
    width: 7rem;
    display: flex;
    justify-content: center;
  }
}
ion-radio {
  --border-radius: 4px;
  --inner-border-radius: 4px;

  --color: #ddd;
  --color-checked: #6815ec;
}

ion-radio.ios::part(container) {
  width: 20px;
  height: 20px;

  border: 2px solid #ddd;
  border-radius: 4px;
}

.radio-checked.ios::part(container) {
  border-color: #6815ec;
}

.card-main-content {
  max-height: 82vh;
  overflow: auto;
}
</style>
