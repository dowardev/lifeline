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
                          <div v-for="event in events2" :key="event.id">
                            <template
                              v-if="
                                event.reminders.start <= day.date &&
                                event.reminders.end >= day.date &&
                                event.reminders.start.getHours() ===
                                  parseInt(hour)
                              "
                            >
                              <ion-card
                                class="card-event"
                                style="cursor: pointer"
                                @click="
                                  afterUpdateEvent({
                                    idEvent: event.id as number,
                                  })
                                "
                                @contextmenu.prevent="
                                  openPopoverRightEventMenu({
                                    ev: $event,
                                    eventId: event.id as number,
                                  })
                                "
                                @press="
                                  openPopoverRightEventMenu({
                                    ev: $event,
                                    eventId: event.id as number,
                                  })
                                "
                              >
                                <ion-card-header>
                                  <ion-card-title>{{
                                    event.name
                                  }}</ion-card-title>
                                </ion-card-header>

                                <ion-card-content>{{
                                  format(new Date(event.reminders.start), "Pp")
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
    <!-- <ion-popover -->
    <!--   :class="{ 'popover-main-calendar-ios': isPlatform('ios') }" -->
    <!--   :is-open="isOpenpopoverMainCalendar" -->
    <!--   @did-dismiss="isOpenpopoverMainCalendar = false" -->
    <!-- > -->
    <!--   <ion-content> -->
    <!--     <ion-datetime -->
    <!--       presentation="date" -->
    <!--       :value="props.currentDate.toISOString()" -->
    <!--       :max=" -->
    <!--         add(new Date(), { -->
    <!--           years: 10, -->
    <!--         }).toISOString() -->
    <!--       " -->
    <!--       @ion-change=" -->
    <!--         loadDaysWeek({ -->
    <!--           date: new Date($event.target.value as string).getTime(), -->
    <!--         }) -->
    <!--       " -->
    <!--     ></ion-datetime> -->
    <!--   </ion-content> -->
    <!-- </ion-popover> -->

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
        :event-data="eventController.getEvent({ idEvent })"
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
  IonButton,
  IonModal,
  popoverController,
} from "@ionic/vue";
import { closeOutline, star } from "ionicons/icons";
import { onMounted, ref } from "vue";
import { add, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { watch } from "vue";

// interfaces
import { Event } from "@/utils/interfaces";

// components
import RescheduleComponent from "@/components/events/schedule-elements/RescheduleElements.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import RightMenuEventComponent from "../RightMenuEventComponent.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { computed } from "vue";
const systemController = new SystemController();
const eventController = new EventController();

interface Day {
  date: Date;
}

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
const modalRescheduleElements = ref(null);
const idEvent = ref(0);
const isOpenModalUpdateEvent = ref(false);
const isOpenModalRecheduleTasks = ref(false);
const isOpenPopOverMainOptions = ref(false);
const isOpenModalAddEvent = ref(false);
const eventModalAddEvent = ref(null as CustomEvent | null);
const eventComposable = eventController;
const events = ref([] as Event[]);

// mounted
onMounted(async () => {
  days.value = getDaysForCurrentWeek({ date: new Date() });
  await syncAction();
});

// watch
watch(
  () => eventController.getCurrentDate(),
  async (date) => {
    try {
      await syncData({ date });
      days.value = getDaysForCurrentWeek({ date });
    } catch (error) {
      console.error(error);
    }
  }
);

// computed
const events2 = computed(() => {
  return events.value.map((event) => {
    event.reminders.start.setHours(0);
    event.reminders.start.setMinutes(0);
    event.reminders.start.setSeconds(0);
    event.reminders.start.setMilliseconds(0);
    return event;
  });
});

// functions
function getDaysForCurrentWeek(params: { date: Date }): { date: Date }[] {
  const date = params.date;
  const days = [];
  const dayOfWeek = date.getDay();
  const firstDayOfWeek = new Date(date);
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  firstDayOfWeek.setDate(date.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek); // Create a new Date object from firstDayOfWeek
    day.setDate(firstDayOfWeek.getDate() + i); // Modify the date of the new Date object
    day.setHours(0);
    day.setMinutes(0);
    day.setSeconds(0);
    day.setMilliseconds(0);
    days.push({ date: day });
  }

  return days;
}

function translateDayHeaderTable(params: { dayName: string }): string {
  const dayName = params.dayName as any;
  let result = systemController.translateDay({
    dayName,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function afterUpdateEvent(params: { idEvent: number }): void {
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

/**
 * Delete event
 *
 * params {Object} params
 * @param {Number} params.eventId sssssss
 */
async function deleteEvent(params: { eventId: number }): Promise<void> {
  const { eventId } = params;
  try {
    await eventController.deleteEvent({ id: eventId });
    await systemController.openToast({ message: "Evento eliminado" });
    await syncData({ date: eventController.getCurrentDate() });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: "Problema al eliminar evento",
    });
  }
}

async function syncData(params: { date: Date }): Promise<void> {
  const { date } = params;

  try {
    const viewCalendar = await eventController.getViewCalendarStored();
    const dates = {
      start: new Date(startOfMonth(eventController.getCurrentDate())),
      end: new Date(endOfMonth(eventController.getCurrentDate())),
    };

    // if (viewCalendar == "weekly") {
    //   dates.start = startOfWeek(date, {
    //     weekStartsOn: 1,
    //   });
    //   dates.end = new Date(
    //     add(dates.start, {
    //       days: 7,
    //     })
    //   );
    // }

    await eventComposable.sync();
    await eventController.loadEvents({
      dates,
    });
    events.value = await eventController.getEvents();
  } catch (error: any) {
    throw new Error(error);
  }
}

async function saveEvent(params: { event: Event }): Promise<void> {
  const { event } = params;
  try {
    await eventController.saveEvent({
      event,
    });
    await syncAction();
  } catch (error) {
    console.error(error);
  }
}

async function updateEvent(params: { event: Event }): Promise<void> {
  const { event } = params;

  try {
    event.syncStatus = false;
    await eventController.updateLocalEvent({
      event,
    });
    await syncData({ date: eventController.getCurrentDate() });
    event.syncStatus = true;
    await eventController.updateLocalEvent({
      event,
    });
    await systemController.openToast({ message: "Evento actualizado" });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: "Problema al actualizar evento",
    });
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

async function syncAction(): Promise<void> {
  try {
    await systemController.openToast({ message: "Sincronización iniciada" });
    await syncData({ date: eventController.getCurrentDate() });
    await systemController.openToast({ message: "Sincronización terminada" });
    await eventController.setReminders({ events: events.value });
  } catch (error) {
    await systemController.openToast({ message: "Problema al sincronizar" });
    console.error(error);
  }
}

defineExpose({ openModalAdd, reschedule, syncAction });
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
