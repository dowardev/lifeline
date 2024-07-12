<template>
  <ion-row>
    <!-- calendar calendar -->
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
                    <div
                      v-for="(event, index) in props.eventsData"
                      :key="index"
                    >
                      <div
                        v-if="
                          `${event.day}/${event.month}/${event.year}` ==
                            `${day.date.getDate()}/${
                              day.date.getMonth() + 1
                            }/${day.date.getFullYear()}` && hour == event.time
                        "
                      >
                        <ion-card
                          class="card-event"
                          style="cursor: pointer"
                          @click="
                            emits('updateEvent', {
                              idEvent: event.id,
                            })
                          "
                          @contextmenu.prevent="
                            emits('openPopoverRightEventMenu', {
                              ev: $event,
                              eventId: event.id,
                            })
                          "
                          @press="
                            emits('openPopoverRightEventMenu', {
                              ev: $event,
                              eventId: event.id,
                            })
                          "
                        >
                          <ion-card-header>
                            <ion-card-title>{{ event.name }}</ion-card-title>
                          </ion-card-header>

                          <ion-card-content>{{
                            format(new Date(event.reminders.start), "Pp")
                          }}</ion-card-content>
                        </ion-card>
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
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

// controllers
import { SystemController } from "@/js/systemController";
import { format } from "date-fns";
import { watch } from "vue";
const systemController = new SystemController();

interface EventsData {
  year: string;
  month: string;
  day: string;
  time: string;
  id: number;
  name: string;
  reminders: any;
}

const props = defineProps({
  eventsData: {
    type: Object as () => Array<EventsData>,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});
const emits = defineEmits(["updateEvent", "openPopoverRightEventMenu"]);

// watch date
watch(
  () => props.date,
  async (date) => {
    try {
      days.value = getDaysForCurrentWeek({
        date,
      });
    } catch (error) {
      console.error(error);
    }
  }
);

// mounted
onMounted(async () => {
  days.value = getDaysForCurrentWeek({
    date: props.date,
  });
});

// vars
const days = ref(Array<any>());
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
  "0:00",
  "1:00",
  "2:00",
  "3:00",
  "4:00",
  "5:00",
  "6:00",
  "7:00",
  "8:00",
  "9:00",
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

// functions
function getDaysForCurrentWeek(params: { date: Date }): { date: Date }[] {
  const date = params.date;
  const daysList = [];
  const dayOfWeek = date.getDay();
  const firstDayOfWeek = new Date(date);
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  firstDayOfWeek.setDate(date.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    daysList.push({ date: day });
  }

  return daysList;
}

function translateDayHeaderTable(params: { dayName: string }): string {
  const dayName = params.dayName as any;
  let result = systemController.translateDay({
    dayName,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
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
