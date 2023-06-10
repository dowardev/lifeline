<template>
  <ion-page>
    <ion-header :translucent="true" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <!-- add event button -->
          <ion-button id="modal-add-event"
            ><ion-icon :icon="addOutline"></ion-icon
          ></ion-button>

          <!-- button popover  main options -->
          <ion-button
            @click="
              eventPopOverMainOptions = isPlatform('mobile') ? null : $event;
              isOpenPopOverMainOptions = true;
            "
          >
            <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <!-- week calendar -->
        <!-- button options -->
        <ion-col size-xs="12" size-lg="12">
          <!-- button week navigation -->
          <div
            style="
              display: flex;
              justify-content: space-between;
              padding-bottom: 16px;
              align-items: center;
            "
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <div>
                <ion-item lines="none">
                  <!-- previous button -->
                  <ion-button fill="clear" size="small" @click="previousWeek()"
                    ><ion-icon :icon="chevronBackOutline"></ion-icon
                  ></ion-button>

                  <!-- next button -->
                  <ion-button fill="clear" size="small" @click="nextWeek()"
                    ><ion-icon :icon="chevronForwardOutline"></ion-icon
                  ></ion-button>
                </ion-item>
              </div>

              <!-- button date selector -->
              <div class="space-button-date-selector">
                <ion-button
                  fill="clear"
                  size="small"
                  @click="isOpenpopoverMainCalendar = true"
                >
                  {{
                    translateMonth({
                      monthName: months[getMonth(currentDate)],
                    })
                  }}
                </ion-button>
              </div>

              <!-- today button -->
              <div>
                <ion-button size="small" fill="clear" @click="today()">
                  <ion-icon :icon="todayOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>

          <!-- table -->
          <div style="height: 82vh; overflow: auto; overflow-x: auto">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th></th>
                  <th v-for="(day, index) in days" :key="index">
                    <!-- day -->
                    <div
                      :class="{
                        today:
                          day.date.getDate() == new Date().getDate() &&
                          day.date.getMonth() == new Date().getMonth() &&
                          day.date.getFullYear() == new Date().getFullYear(),
                      }"
                    >
                      {{
                        translateDayHeaderTable({
                          dayName: daysOfWeek[day.date.getDay()],
                        })
                      }}
                    </div>

                    <!-- day number -->
                    <div
                      :class="{
                        today:
                          day.date.getDate() == new Date().getDate() &&
                          day.date.getMonth() == new Date().getMonth() &&
                          day.date.getFullYear() == new Date().getFullYear(),
                      }"
                    >
                      {{ day.date.getDate() }}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hour in hoursOfDay" :key="hour">
                  <td
                    :class="{
                      today: parseInt(hour) == new Date().getHours(),
                    }"
                  >
                    {{ hour }}
                  </td>
                  <td v-for="day in days" :key="day.date.toString()">
                    <div>
                      <div
                        v-for="schedule in generateSchedule[
                          daysOfWeek[new Date(day.date).getDay()]
                        ]"
                        :key="schedule.date.toString()"
                      >
                        <template
                          v-if="
                            new Date(schedule.date).getHours() ===
                              parseInt(hour) &&
                            new Date(schedule.date).getDate() ===
                              day.date.getDate()
                          "
                        >
                          <ion-card
                            class="card-event"
                            style="cursor: pointer"
                            @click="
                              updateEvent({ idEvent: schedule.idElement })
                            "
                            @contextmenu.prevent="
                              openPopoverRightEventMenu({
                                ev: $event,
                                eventId: schedule.idElement,
                              })
                            "
                            @press="
                              openPopoverRightEventMenu({
                                ev: $event,
                                eventId: schedule.idElement,
                              })
                            "
                          >
                            <ion-card-header>
                              <ion-card-title>{{
                                schedule.title
                              }}</ion-card-title>
                            </ion-card-header>

                            <ion-card-content>{{
                              format(new Date(schedule.date), "Pp")
                            }}</ion-card-content>
                          </ion-card>
                        </template>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ion-col>
      </ion-row>

      <!-- popovers -->
      <!-- popover main calendar -->
      <ion-popover
        :class="{ 'popover-main-calendar-ios': isPlatform('ios') }"
        :is-open="isOpenpopoverMainCalendar"
        @did-dismiss="isOpenpopoverMainCalendar = false"
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
            @ion-change="
              loadDaysWeek({
                date: new Date($event.target.value as string).getTime(),
              })
            "
          ></ion-datetime>
        </ion-content>
      </ion-popover>

      <!-- popover main options -->
      <ion-popover
        :is-open="isOpenPopOverMainOptions"
        :event="eventPopOverMainOptions"
        @did-dismiss="isOpenPopOverMainOptions = false"
      >
        <ion-content>
          <ion-list>
            <ion-list-header>
              <ion-label>General</ion-label>
            </ion-list-header>

            <ion-row>
              <ion-col>
                <!-- button modal reschedule tasks -->
                <ion-item
                  button
                  lines="none"
                  @click="
                    isOpenModalRecheduleTasks = true;
                    isOpenPopOverMainOptions = false;
                  "
                >
                  <ion-icon slot="start" :icon="stopwatchOutline"></ion-icon>
                  <ion-label class="ion-text-wrap"
                    >Reagendar elementos vencidos</ion-label
                  >
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-list>

          <!-- views -->
          <ion-list>
            <ion-list-header>
              <ion-label>Vista</ion-label>
            </ion-list-header>

            <ion-row>
              <ion-col>
                <ion-radio-group value="weekly">
                  <!-- diary view -->
                  <ion-item lines="none" disabled>
                    <ion-radio value="diary" label-placement="end"
                      >Diario</ion-radio
                    >
                  </ion-item>

                  <!-- weekly view -->
                  <ion-item lines="none">
                    <ion-radio value="weekly" label-placement="end"
                      >Semanal</ion-radio
                    >
                  </ion-item>

                  <!-- annual view -->
                  <ion-item lines="none" disabled>
                    <ion-radio value="annual" label-placement="end"
                      >Anual</ion-radio
                    >
                  </ion-item>
                </ion-radio-group>
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->

      <!-- modals -->
      <!-- modal reschedule elements -->
      <ion-modal
        ref="modalRescheduleElements"
        trigger="modal-reschedule-elements"
        :is-open="isOpenModalRecheduleTasks"
        @did-dismiss="isOpenModalRecheduleTasks = false"
      >
        <ion-page>
          <ion-header :translucent="true" mode="ios" class="ion-no-border">
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button
                  @click="(modalRescheduleElements as any).$el.dismiss()"
                  ><ion-icon :icon="closeOutline"></ion-icon
                ></ion-button>
              </ion-buttons>
              <ion-title>Reagendar elementos vencidos</ion-title>
            </ion-toolbar>
          </ion-header>

          <ion-content :fullscreen="true">
            <div style="overflow-y: scroll; height: 100vh">
              <RescheduleComponent />
            </div>
          </ion-content>
        </ion-page>
      </ion-modal>

      <!-- modal add event -->
      <ion-modal
        ref="modalAddEvent"
        trigger="modal-add-event"
        class="modal-event"
        :backdrop-dismiss="false"
      >
        <AdminEventComponent />
      </ion-modal>

      <!-- modal update event -->
      <ion-modal
        class="modal-event"
        :backdrop-dismiss="false"
        :is-open="isOpenModalUpdateEvent"
        @did-dismiss="isOpenModalUpdateEvent = false"
      >
        <AdminEventComponent :event-data="useEvent().getEvent({ idEvent })" />
      </ion-modal>
      <!-- end modals -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonButton,
  IonItem,
  IonPopover,
  isPlatform,
  IonDatetime,
  IonModal,
  popoverController,
  IonRadio,
  IonRadioGroup,
} from "@ionic/vue";
import { computed, onMounted, ref } from "vue";
import { useSchedule } from "@/composables/useSchedule";
import { add, format, getMonth } from "date-fns";
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  ellipsisVerticalOutline,
  stopwatchOutline,
  todayOutline,
} from "ionicons/icons";
import { Months, Schedule, ScheduleElement } from "@/utils/interfaces";

// components
import RescheduleComponent from "@/components/events/schedule-elements/RescheduleElements.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import RightMenuEventComponent from "./RightMenuEventComponent.vue";

// composables
import { useSystem } from "../../composables/useSystem";
import { useEvent } from "@/composables/useEvent";

interface Day {
  date: Date;
}

const pageTitle = "Calendario";
const daysOfWeek = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const hoursOfDay = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];
const currentDate = new Date();
const days = ref(Array<Day>());
const isOpenpopoverMainCalendar = ref(false);
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
const modalRescheduleElements = ref(null);
const idEvent = ref("");
const isOpenModalUpdateEvent = ref(false);
const isOpenModalRecheduleTasks = ref(false);
const isOpenPopOverMainOptions = ref(false);
const eventPopOverMainOptions = ref(null as CustomEvent | null);

// mounted
onMounted(async () => {
  days.value = getDaysForCurrentWeek({ date: new Date() });
  await useEvent().loadEvents();
  // await useSchedule().checkNotificationsPermissions();
  // await useSchedule().setReminders({
  //   id: 1,
  //   reminder: "ss",
  // });
});

// computed
const generateSchedule = computed(() => {
  const schedule = useSchedule().getSchedule();
  if (!schedule) return {};

  const eventsByDayOfWeek: { [day: string]: ScheduleElement[] } = {
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
  };

  for (const day of daysOfWeek) {
    eventsByDayOfWeek[day] = [];
  }

  for (const year in schedule) {
    for (const month in schedule[parseInt(year)]) {
      for (const day in schedule[parseInt(year)][month]) {
        for (const event of schedule[parseInt(year)][month][day]) {
          const date = new Date(event.date);
          const dayOfWeek = daysOfWeek[date.getDay()];
          eventsByDayOfWeek[dayOfWeek].push(event);
        }
      }
    }
  }

  return eventsByDayOfWeek as any;
});

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
  const currentMonth = currentDate.getMonth();
  if (currentMonth === 0 && currentDate.getDate() <= 7) {
    return;
  }
  const date = new Date(currentDate);
  if (date.getDate() <= 7) {
    date.setMonth(currentMonth - 1);
    date.setDate(
      new Date(date.getFullYear(), currentMonth, 0).getDate() -
        (7 - date.getDate())
    );
  } else {
    date.setDate(date.getDate() - 7);
  }
  loadDaysWeek({ date: date.getTime() });
}

function nextWeek(): void {
  const currentMonth = currentDate.getMonth();
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    nextMonth,
    0
  ).getDate();
  const date = new Date(currentDate);
  if (date.getDate() + 7 > lastDayOfMonth) {
    date.setMonth(nextMonth);
    date.setDate(7 - (lastDayOfMonth - date.getDate()));
  } else {
    date.setDate(date.getDate() + 7);
  }
  loadDaysWeek({ date: date.getTime() });
}

function today(): void {
  const date = new Date(Date.now()).getTime();
  loadDaysWeek({ date });
}

function loadDaysWeek(params: { date: number }): void {
  const date = params.date;
  currentDate.setTime(date);
  const days = getDaysForCurrentWeek({ date: currentDate });
  setDaysToWeek({ days });
}

function setDaysToWeek(params: { days: Array<Day> }): void {
  days.value = params.days;
}

function translateDayHeaderTable(params: { dayName: string }): string {
  const dayName = params.dayName as any;
  let result = useSystem().translateDay({
    dayName,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateMonth(params: { monthName: string }): string {
  const monthName = params.monthName as keyof Months;

  let result = useSystem().translateMonth({
    monthName,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function updateEvent(params: { idEvent: string }): void {
  const id = params.idEvent;
  idEvent.value = id;
  isOpenModalUpdateEvent.value = true;
}

async function openPopoverRightEventMenu(params: {
  ev: Event;
  eventId: string;
}): Promise<void> {
  const eventId = params.eventId;
  const ev = params.ev;

  const popover = await popoverController.create({
    component: RightMenuEventComponent,
    event: ev,
    showBackdrop: false,
  });
  await popover.present();

  const { role, data } = await popover.onDidDismiss();
  if (role == "confirm" && data.option == "delete") {
    await deleteEvent({ eventId });
  }
}

async function deleteEvent(params: { eventId: string }): Promise<void> {
  const { eventId } = params;
  await useEvent().deleteEvent({ eventId });
  let schedule: Schedule = useSchedule().getSchedule() ?? ({} as Schedule);
  schedule = useSchedule().removeElementSchedule({
    id: eventId,
    schedule,
  });
  await useSchedule().saveSchedule({ schedule });
  await useSchedule().loadSchedule();
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
  background-color: var(--ion-background-color);
  z-index: 2;
}

table.schedule-table tr td:first-child,
table.schedule-table th:first-child {
  border: none !important;
  z-index: 3;
  background-color: var(--ion-background-color);
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
</style>
