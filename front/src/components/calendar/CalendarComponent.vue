<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <CalendarDayComponent
    v-if="props.modeView == 'day'"
    :events-data="generateCalendar || []"
    :date="props.date"
    @update-event="
      idEvent = $event.idEvent;
      isOpenModalAddEvent = true;
    "
    @open-popover-right-event-menu="openPopoverRightEventMenu($event)"
  />

  <CalendarWeekComponent
    v-if="props.modeView == 'week'"
    :events-data="generateCalendar || []"
    :date="props.date"
    @update-event="
      idEvent = $event.idEvent;
      isOpenModalAddEvent = true;
    "
    @open-popover-right-event-menu="openPopoverRightEventMenu($event)"
  />

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
            <ion-button @click="(modalRescheduleElements as any).$el.dismiss()"
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
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { computed, ref } from "vue";
import { add, compareAsc, getDay } from "date-fns";
import { closeOutline } from "ionicons/icons";
import { popoverController, IonModal } from "@ionic/vue";

// 2. Controllers / Composables
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { useReminder } from "@/composables/useReminder";
const systemController = new SystemController();
const eventController = new EventController();

// 3. Components
import CalendarDayComponent from "@/components/calendar/day/CalendarDayComponent.vue";
import CalendarWeekComponent from "@/components/calendar/week/CalendarWeekComponent.vue";
import RightMenuEventComponent from "@/views/calendar/RightMenuEventComponent.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import RescheduleComponent from "@/components/events/schedule-elements/RescheduleElements.vue";

// 4. Interface and types imports
import type { ViewCalendar } from "@/types";
import type { Event } from "@/utils/interfaces";

// 5. Main (props, emits)
const props = defineProps({
  modeView: {
    type: Object as () => ViewCalendar,
    required: true,
  },
  events: {
    type: Object as () => Array<Event>,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

// 6. Vars and const
const isOpenModalRecheduleTasks = ref(false);
const modalRescheduleElements = ref(null);
const isOpenModalAddEvent = ref(false);
const eventModalAddEvent = ref(null as CustomEvent | null);
const isOpenModalUpdateEvent = ref(false);
const idEvent = ref(0);
const isOpenPopOverMainOptions = ref(false);

defineExpose({
  openModalAdd,
  reschedule,
});

// 7. Watch
// (none)

// 8. Computed
const generateCalendar = computed(() => {
  if (props.events.length == 0) return [];
  const response = groupEvents({ events: props.events });
  return flattenEvents({ events: response });
});

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
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
  let events = JSON.parse(JSON.stringify(params.events)) as Event[];
  events = events.map((event) => {
    event.reminders.start = new Date(event.reminders.start);
    event.reminders.end = new Date(event.reminders.end);
    return event;
  });

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
      event: Event,
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
    },
  );
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

async function saveEvent(params: { event: Event }): Promise<void> {
  const { event } = params;
  try {
    await eventController.updateLocalEvent({
      event,
    });
    eventController.updateLocalEvent({ event });
  } catch (error) {
    console.error(error);
  }
}

async function updateEvent(params: { event: Event }): Promise<void> {
  const { event } = params;
  try {
    if (event.reminders.idReminders.length == 0) {
      const { generatorReminder, setReminder } = useReminder()
      const reminders = generatorReminder({
        frecuency: event.reminders.repeat!.frecuency!,
        reminderStart: event.reminders.start,
        reminderEnd: event.reminders.end,
        repeat: event.reminders.repeat!.type!,
        daysWeek: event.reminders.repeat!.daysWeek!,
        notifications: event.reminders.notifications!,
      })
      const reminderIds: number[] = []
      for (const reminderDate of reminders) {
        const { reminderId } = await setReminder({
          title: event.name!,
          message: event.description,
          extraInfo: String(event.id),
          reminder: reminderDate,
        })
        reminderIds.push(reminderId)
      }
      event.reminders.idReminders = [
        ...event.reminders.idReminders,
        ...reminderIds,
      ];
    }

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

async function deleteEvent(params: { eventId: number }): Promise<void> {
  const { eventId } = params;
  try {
    await eventController.removeEvent({ id: eventId });
    await systemController.openToast({ message: "Evento eliminado" });
    await eventController.loadEvents();
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: "Problema al eliminar evento",
    });
  }
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

function openModalAdd(params: { event: Event }): void {
  const { event } = params;
  console.log(event);
  eventModalAddEvent.value = event as any;
  isOpenModalAddEvent.value = true;
}

function reschedule(): void {
  isOpenModalRecheduleTasks.value = true;
  isOpenPopOverMainOptions.value = false;
}
</script>

<style scoped>
@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
