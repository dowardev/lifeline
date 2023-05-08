<template>
  <ion-page>
    <ion-header :translucent="true" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col v-if="isPlatform('desktop')" size-lg="3">
          <section>
            <div>
              <ion-item lines="full">
                <ion-label>Elementos vencidos</ion-label>
                <!-- reschedule all elements -->
                <ion-button slot="end">
                  <ion-icon :icon="stopwatchOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </div>

            <div style="height: 90vh; overflow: auto; overflow-x: auto">
              <RescheduleComponent />
            </div>
          </section>
        </ion-col>

        <!-- week calendar -->
        <!-- button options -->
        <ion-col size-xs="12" size-lg="9">
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

                  <!-- button date selector -->
                  <ion-button
                    fill="clear"
                    size="small"
                    @click="isOpenpopoverMainCalendar = true"
                    >{{ months[getMonth(currentDate) - 1] }}
                  </ion-button>

                  <!-- next button -->
                  <ion-button fill="clear" size="small" @click="nextWeek()"
                    ><ion-icon :icon="chevronForwardOutline"></ion-icon
                  ></ion-button>
                </ion-item>
              </div>

              <!-- today button -->
              <div>
                <ion-button size="small" fill="clear" @click="today()">
                  <ion-icon :icon="todayOutline"></ion-icon>
                </ion-button>
              </div>

              <!-- button modal reschedule tasks -->
              <div v-if="!isPlatform('desktop')">
                <ion-button
                  id="modal-reschedule-elements"
                  slot="end"
                  fill="clear"
                >
                  <ion-icon :icon="stopwatchOutline"></ion-icon>
                </ion-button>
              </div>
            </div>

            <!-- add element button -->
            <div>
              <ion-button
                size="small"
                @click="$router.push({ name: 'AdminEvent' })"
                ><ion-icon :icon="addOutline"></ion-icon
              ></ion-button>
            </div>
          </div>

          <!-- table -->
          <div style="height: 90vh; overflow: auto; overflow-x: auto">
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
                      {{ daysOfWeek[day.date.getDay()] }}
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
                        v-for="date in dates2[
                          daysOfWeek[new Date(day.date).getDay()]
                        ]"
                        :key="date.date.toString()"
                      >
                        <template
                          v-if="
                            new Date(date.date).getHours() === parseInt(hour)
                          "
                        >
                          <ion-card class="card-event">
                            <ion-card-header>
                              <ion-card-title>{{ date.title }}</ion-card-title>
                            </ion-card-header>

                            <ion-card-content>{{
                              format(new Date(date.date), "Pp")
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
      <ion-popover
        :is-open="isOpenpopoverMainCalendar"
        @did-dismiss="isOpenpopoverMainCalendar = false"
      >
        <ion-content>
          <ion-datetime
            presentation="date"
            @ion-change="
              loadDaysWeek({
                date: new Date($event.target.value as string).getTime(),
              })
            "
            :value="currentDate.toISOString()"
          ></ion-datetime>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->

      <!-- modals -->
      <ion-modal
        ref="modalRescheduleElements"
        trigger="modal-reschedule-elements"
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
              <ion-title>Elementos vencidos</ion-title>
            </ion-toolbar>
          </ion-header>

          <ion-content :fullscreen="true">
            <div style="overflow-y: scroll; height: 100vh">
              <RescheduleComponent />
            </div>
          </ion-content>
        </ion-page>
      </ion-modal>
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
} from "@ionic/vue";
import { computed, onMounted, ref, watch } from "vue";
import { useSchedule } from "@/composables/useSchedule";
import { format, getMonth } from "date-fns";
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  stopwatchOutline,
  todayOutline,
} from "ionicons/icons";
import RescheduleComponent from "../../components/events/schedule-elements/RescheduleElements.vue";
import { ScheduleElement } from "@/utils/interfaces";

interface Day {
  date: Date;
}
interface Dates {
  [key: string]: Array<{
    id: string;
    title: string;
    message: string;
    date: string;
  }>;
}

const pageTitle = "Inicio";
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
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const modalRescheduleElements = ref(null);
const dates = ref({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
} as Dates);

// mounted
onMounted(async () => {
  days.value = getDaysForCurrentWeek({ date: new Date() });
  // setSchedule({ schedule: useSchedule().getSchedule() });
});

// watch(
//   async () => {
//     return await useSchedule().getSchedule();
//   },
//   (newVal, oldVal) => {
//     console.log(newVal);
//   }
// );

// funtions
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

function previousWeek() {
  if (currentDate.getMonth() === 0 && currentDate.getDate() <= 7) {
    return;
  }
  const date = new Date().setDate(currentDate.getDate() - 7);
  loadDaysWeek({ date });
}

function nextWeek() {
  const date = new Date().setDate(currentDate.getDate() + 7);
  loadDaysWeek({ date });
}

function today() {
  const date = new Date(Date.now()).getTime();
  loadDaysWeek({ date });
}

function loadDaysWeek(params: { date: number }) {
  const date = params.date;
  currentDate.setTime(date);
  const days = getDaysForCurrentWeek({ date: currentDate });
  setDaysToWeek({ days });
}

function setDaysToWeek(params: { days: Array<Day> }) {
  days.value = params.days;
}

const dates2 = computed(() => {
  const schedule = useSchedule().getSchedule();
  if (!schedule) return;

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

async function setSchedule(params: { schedule: Schedule }) {
  const schedule = params.schedule;

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

  dates.value = eventsByDayOfWeek as any;
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
  min-width: 100px;
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
</style>
