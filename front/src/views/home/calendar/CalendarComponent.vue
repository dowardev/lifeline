<template>
  <section>
    <!-- header -->
    <section style="display: flex; justify-content: space-between">
      <div class="calendar-header">
        <span
          class="day-header"
          style="
            color: var(--ion-color-primary);
            line-height: 1;
            margin-right: 16px;
          "
        >
          {{ new Date().getDate() }}
        </span>

        <div
          style="display: flex; flex-direction: column; align-items: stretch"
        >
          <div style="display: flex">
            <span class="month-header">{{ new Date().getMonth() }}</span>
          </div>
          <div>
            <span class="year-header">{{ new Date().getFullYear() }}</span>
          </div>
        </div>
      </div>

      <div class="center-vertical">
        <ion-button fill="clear" @click="isOpenModalAddEvent = true"
          ><ion-icon :icon="addOutline"></ion-icon
        ></ion-button>
      </div>
    </section>

    <!-- content -->
    <section>
      <CalendarDayComponent
        :show-current-day="false"
        :events-data="generateCalendar || []"
        :date="new Date()"
      />
    </section>
  </section>

  <!-- popovers -->
  <!-- popover reminders -->
  <ion-popover
    style="--width: 22rem"
    trigger="popoverDateSelector"
    trigger-action="click"
  >
    <ion-datetime
      ref="miniCalendar"
      presentation="date"
      @ion-change="
        currentDate = format(new Date($event.target.value as any), 'P') as any
      "
    >
      <ion-buttons slot="buttons">
        <ion-button color="danger" @click="(miniCalendar as any).$el.reset()"
          >Reiniciar</ion-button
        >
      </ion-buttons>
    </ion-datetime>
  </ion-popover>
  <!-- end popovers -->

  <!-- modals -->
  <ion-modal
    :is-open="isOpenModalAddEvent"
    class="modal-event"
    :backdrop-dismiss="false"
    @dismiss="isOpenModalAddEvent = false"
  >
    <AdminEventComponent
      @create="
        saveEvent({
          event: $event.data.event,
        })
      "
    />
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonDatetime,
  IonPopover,
  IonModal,
  IonButton,
  IonButtons,
} from "@ionic/vue";
import { computed, onMounted, ref, watch } from "vue";
import { add, compareAsc, format, getDay } from "date-fns";
import { addOutline } from "ionicons/icons";

//controllers
import { SystemController } from "@/controllers/systemController";
import { CalendarController } from "@/controllers/calendarController";
import { EventController } from "@/controllers/eventController";
const systemController = new SystemController();
const calendarController = new CalendarController();
const eventController = new EventController();
const isOpenModalAddEvent = ref(false);

// components
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import CalendarDayComponent from "@/components/calendar/day/CalendarDayComponent.vue";

// interfaces
import { Event } from "@/utils/interfaces";

//vars
const currentDate = ref(new Date());
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`
);
const miniCalendar = ref(null);
const events = ref([] as Event[]);

// computed
const generateCalendar = computed(() => {
  if (events.value.length == 0) return;
  const response = groupEvents({ events: events.value });
  return flattenEvents({ events: response });
});

watch(
  () => eventController.getEvents(),
  async (response) => {
    events.value = response;
  }
);

onMounted(() => {
  events.value = eventController.getEvents();
});

// functions
function groupEvents(params: { events: Event[] }): {
  [year: string]: {
    [month: string]: {
      [day: string]: {
        [time: string]: {
          id: number;
          name: string;
          reminders: any;
        }[];
      };
    };
  };
} {
  const events = systemController.cloneObjet({
    obj: params.events,
  }) as Event[];

  return events.reduce(
    (
      groupedEvents: {
        [year: string]: {
          [month: string]: {
            [day: string]: {
              [time: string]: {
                id: number;
                name: string;
                reminders: any;
              }[];
            };
          };
        };
      },
      event: Event
    ) => {
      const reminderStart = event.reminders.start;
      const reminderEnd = event.reminders.end;
      const repeatType = event.reminders.repeat?.type ?? "daily";
      const daysWeek = event.reminders.repeat!.daysWeek;
      const frecuency = event.reminders.repeat?.frecuency ?? 1;

      reminderStart.setMilliseconds(0);
      reminderStart.setSeconds(0);

      const dates = eachPeriodOfInterval({
        start: reminderStart,
        end: reminderEnd,
        repeatType,
        frecuency,
        daysWeek,
      }).dates;

      dates.forEach((date) => {
        const yearKey = date.getFullYear().toString();
        const monthKey = (date.getMonth() + 1).toString();
        const dayKey = date.getDate().toString();
        const timeKey = `${date.getHours().toString()}:00`;

        if (!groupedEvents[yearKey]) {
          groupedEvents[yearKey] = {};
        }

        if (!groupedEvents[yearKey][monthKey]) {
          groupedEvents[yearKey][monthKey] = {};
        }

        if (!groupedEvents[yearKey][monthKey][dayKey]) {
          groupedEvents[yearKey][monthKey][dayKey] = {};
        }

        if (!groupedEvents[yearKey][monthKey][dayKey][timeKey]) {
          groupedEvents[yearKey][monthKey][dayKey][timeKey] = [];
        }

        groupedEvents[yearKey][monthKey][dayKey][timeKey].push({
          id: event.id!,
          name: event.name ?? "",
          reminders: event.reminders,
        });

        // Ordenar los eventos por hora
        groupedEvents[yearKey][monthKey][dayKey][timeKey].sort((a, b) => {
          const aTime =
            a.reminders.start.getHours() * 60 + a.reminders.start.getMinutes();
          const bTime =
            b.reminders.start.getHours() * 60 + b.reminders.start.getMinutes();
          return aTime - bTime;
        });
      });

      return groupedEvents;
    },
    {} as {
      [year: string]: {
        [month: string]: {
          [day: string]: {
            [time: string]: {
              id: number;
              name: string;
              reminders: any;
            }[];
          };
        };
      };
    }
  );
}

function eachPeriodOfInterval(params: {
  start: Date;
  end: Date;
  repeatType: string;
  frecuency: number;
  daysWeek?: string[];
}): { dates: Date[] } {
  const { end, repeatType, frecuency, daysWeek } = params;
  let { start: currentDate } = params;
  const dates = [];

  const repeatDict = {
    daily: "days",
    weekly: "weeks",
    monthly: "months",
    annually: "years",
  };

  const rep = repeatDict[repeatType as keyof typeof repeatDict];

  while (compareAsc(currentDate, end) <= 0) {
    if (repeatType === "weekly" && daysWeek) {
      const daysOfWeekNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      for (let i = 0; i < 7; i++) {
        if (
          daysWeek
            .map((day) => day.toLowerCase())
            .includes(daysOfWeekNames[getDay(currentDate)])
        ) {
          dates.push(new Date(currentDate));
        }
        currentDate = add(currentDate, { days: 1 });
      }
    } else {
      dates.push(new Date(currentDate));
      currentDate = add(currentDate, { [rep]: frecuency });
    }
  }

  return { dates };
}

function flattenEvents(params: {
  events: {
    [year: string]: {
      [month: string]: {
        [day: string]: {
          [time: string]: {
            id: number;
            name: string;
            reminders: any;
          }[];
        };
      };
    };
  };
}): {
  year: string;
  month: string;
  day: string;
  time: string;
  id: number;
  name: string;
  reminders: any;
}[] {
  const { events } = params;
  const flattened = [];

  for (const year in events) {
    for (const month in events[year]) {
      for (const day in events[year][month]) {
        for (const time in events[year][month][day]) {
          if (Array.isArray(events[year][month][day][time])) {
            for (const event of events[year][month][day][time]) {
              flattened.push({
                year: year,
                month: month,
                day: day,
                time: time,
                id: event.id,
                name: event.name,
                reminders: event.reminders,
              });
            }
          }
        }
      }
    }
  }
  return flattened;
}

async function saveEvent(params: { event: Event }): Promise<void> {
  const { event } = params;
  try {
    const remindersId = (
      await eventController.setEventReminder({
        daysWeek: event.reminders.repeat!.daysWeek!,
        description: event.description,
        frecuency: event.reminders.repeat!.frecuency!,
        name: event.name!,
        notifications: event.reminders.notifications!,
        reminderEnd: event.reminders.end,
        reminderStart: event.reminders.start,
        repeatType: event.reminders.repeat!.type!,
      })
    ).remindersId;
    event.reminders.idReminders = remindersId;

    await eventController.saveEvent({
      event,
    });
  } catch (error) {
    console.error(error);
  }

  try {
    await eventController.syncAction({ message: { show: true } });
  } catch (error: any) {
    console.error(error);
  }
}
</script>

<style scoped>
.calendar-section {
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
}

.schedule-table {
  border-collapse: collapse;
  width: 100%;
}

.schedule-table td,
.schedule-table th {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.schedule-table th {
  font-weight: bold;
  position: sticky;
  top: 0px;
  z-index: 2;
}

.schedule-table .hour-column {
  width: 10%;
}

.schedule-table .event-column {
  width: 90%;
}

.schedule-table .event-cell {
  position: relative;
  min-height: 50px;
}

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}

.day-header {
  font-size: 70px;
  font-weight: bold;
}

.month-header {
  font-size: 20px;
}

.year-header {
  font-size: 20px;
}

@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
