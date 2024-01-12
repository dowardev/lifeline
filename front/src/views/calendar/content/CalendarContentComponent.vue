<template>
  <div ref="mainDiv" style="overflow: auto; height: 95dvh">
    <section>
      <ion-row>
        <!-- week calendar -->
        <!-- button options -->
        <ion-col size-xs="12" size-lg="12">
          <!-- table -->
          <ion-card class="card-main-content">
            <ion-card-content>
              <div>
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
                              day.date.getFullYear() ==
                                new Date().getFullYear(),
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
                              day.date.getFullYear() ==
                                new Date().getFullYear(),
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
                            v-for="schedule in generateCalendar[
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
                                  afterUpdateEvent({
                                    idEvent: schedule.idElement,
                                  })
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
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
    </section>

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
          :value="props.currentDate.toISOString()"
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
              <!-- button sync -->
              <ion-item button lines="none" @click="syncData()">
                <ion-icon slot="start" :icon="syncOutline"></ion-icon>
                <ion-label class="ion-text-wrap">Sincronizar</ion-label>
              </ion-item>

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
      class="modal-event"
      :backdrop-dismiss="false"
      :is-open="isOpenModalAddEvent"
      :event="eventModalAddEvent"
      @did-dismiss="isOpenModalAddEvent = false"
    >
      <AdminEventComponent
        @create="
          saveEvent({
            event: $event.data.event,
          })
        "
      />
    </ion-modal>

    <!-- modal update event -->
    <ion-modal
      class="modal-event"
      :backdrop-dismiss="false"
      :is-open="isOpenModalUpdateEvent"
      @did-dismiss="isOpenModalUpdateEvent = false"
    >
      <AdminEventComponent
        :event-data="useEvent().getEvent({ idEvent })"
        @update="
          updateEvent({
            event: $event.data.event,
          })
        "
        @delete="deleteEvent({ eventId: $event.data.id })"
      />
    </ion-modal>
    <!-- end modals -->
  </div>
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
  syncOutline,
  todayOutline,
} from "ionicons/icons";
import { Event, Months, Schedule, ScheduleElement } from "@/utils/interfaces";

// components
import RescheduleComponent from "@/components/events/schedule-elements/RescheduleElements.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import RightMenuEventComponent from "../RightMenuEventComponent.vue";

// composables
import { useSystem } from "@/composables/useSystem";
import { useEvent } from "@/composables/useEvent";
import { useReminder } from "@/composables/useReminder";
import { watch } from "vue";

interface Day {
  date: Date;
}

const pageTitle = "Agenda";
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
const isOpenModalAddEvent = ref(false);
const eventModalAddEvent = ref(null as CustomEvent | null);
const eventComposable = useEvent();
const scheduleComposable = useSchedule();

// mounted
onMounted(async () => {
  days.value = getDaysForCurrentWeek({ date: new Date() });
  await useEvent().loadEvents();
});

// computed
const generateCalendar = computed(() => {
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

function loadDaysWeek(params: { date: number }): void {
  const date = params.date;
  props.currentDate.setTime(date);
  const days = getDaysForCurrentWeek({ date: props.currentDate });
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

function afterUpdateEvent(params: { idEvent: string }): void {
  const id = params.idEvent;
  idEvent.value = id;
  isOpenModalUpdateEvent.value = true;
}

async function openPopoverRightEventMenu(params: {
  ev: Event;
  eventId: number;
}): Promise<void> {
  const eventId = params.eventId;
  const ev = params.ev;

  const popover = await popoverController.create({
    component: RightMenuEventComponent,
    event: ev as any,
    showBackdrop: false,
  });
  await popover.present();

  const { role, data } = await popover.onDidDismiss();
  if (role == "confirm" && data.option == "delete") {
    await deleteEvent({ eventId });
  }
}

async function deleteEvent(params: { eventId: number }): Promise<void> {
  const { eventId } = params;
  try {
    await useEvent().deleteEvent({ localId: eventId });
  } catch (error) {
    console.error(error);
  }
}

async function syncData(): Promise<void> {
  await eventComposable.sync();
  await useEvent().loadEvents();
}

async function saveEvent(params: { event: Event }): Promise<void> {
  const { event } = params;
  try {
    // await eventComposable.saveEvent({
    //   event,
    // });
    event.reminders.start = new Date(event.reminders.start);
    event.reminders.end = new Date(event.reminders.end);
    event.syncStatus = false;
    event.idSync = null;
    event.status = "active";
    await useEvent().saveLocalEvent({
      event,
    });
    await eventComposable.sync();
  } catch (error) {
    console.error(error);
  }
}

async function updateEvent(params: { event: Event }): Promise<void> {
  const { event } = params;

  try {
    await useEvent().updateEvent({
      event,
    });
    const localSchedule = await scheduleComposable.getLocalSchedule();
    const { schedule } = await scheduleComposable.generateSchedules({
      schedule: localSchedule,
    });
    await scheduleComposable.saveScheduleLocal({ schedule });
    await scheduleComposable.loadSchedule();
  } catch (error) {
    console.error(error);
  }
}
function openModalAdd(params: { event: Event }): void {
  const { event } = params;
  eventModalAddEvent.value = event as any;
  isOpenModalAddEvent.value = true;
}

function reschedule(): void {
  isOpenModalRecheduleTasks.value = true;
  isOpenPopOverMainOptions.value = false;
}

defineExpose({ openModalAdd, syncData, reschedule });
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
