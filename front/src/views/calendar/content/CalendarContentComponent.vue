<template>
  <div ref="mainDiv" style="overflow: auto; height: 95dvh">
    <section>
      <!-- calendar day -->
      <CalendarDayComponent
        class="center"
        v-if="props.modeView == 'day'"
        :calendar-data="generateCalendar || []"
        @update-event="
          idEvent = $event.idEvent;
          isOpenModalAddEvent = true;
        "
        @open-popover-right-event-menu="openPopoverRightEventMenu($event)"
      />
      <!-- calendar week -->
      <CalendarWeekComponent
        v-if="props.modeView == 'week'"
        :calendar-data="generateCalendar || []"
        @update-event="
          idEvent = $event.idEvent;
          isOpenModalAddEvent = true;
        "
        @open-popover-right-event-menu="openPopoverRightEventMenu($event)"
      />
    </section>

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
import { closeOutline } from "ionicons/icons";
import { ref } from "vue";
import { add, compareAsc, endOfMonth, getDay, startOfMonth } from "date-fns";
import { watch } from "vue";

// interfaces
import { Event } from "@/utils/interfaces";

// components
import RescheduleComponent from "@/components/events/schedule-elements/RescheduleElements.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import RightMenuEventComponent from "../RightMenuEventComponent.vue";
import CalendarWeekComponent from "@/components/calendar/week/CalendarWeekComponent.vue";
import CalendarDayComponent from "@/components/calendar/day/CalendarDayComponent.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { EventController } from "@/controllers/eventController";
import { computed } from "vue";
const systemController = new SystemController();
const eventController = new EventController();

interface Day {
  date: Date;
}

// props
const props = defineProps({
  modeView: {
    type: String,
    required: true,
    default: "week",
  },
});

const modalRescheduleElements = ref(null);
const idEvent = ref(0);
const isOpenModalUpdateEvent = ref(false);
const isOpenModalRecheduleTasks = ref(false);
const isOpenPopOverMainOptions = ref(false);
const isOpenModalAddEvent = ref(false);
const eventModalAddEvent = ref(null as CustomEvent | null);
const eventComposable = eventController;
const events = ref([] as Event[]);

// watch
// watch date
watch(
  () => eventController.getCurrentDate(),
  async (date) => {
    try {
      await syncData({ date });
    } catch (error) {
      console.error(error);
    }
  }
);

// watch events
watch(
  () => eventController.getEvents(),
  async (response) => {
    events.value = response;
  }
);

// computed
const generateCalendar = computed(() => {
  if (events.value.length == 0) return;
  const response = groupEvents({ events: events.value });
  return flattenEvents({ events: response });
});

// functions
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
  } catch (error: any) {
    throw new Error(error);
  }
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
    await syncAction();
  } catch (error) {
    console.error(error);
  }
}

async function updateEvent(params: { event: Event }): Promise<void> {
  const { event } = params;
  try {
    if (event.reminders.idReminders && event.reminders.idReminders.length > 0) {
      await eventController.discardEventReminders({
        idReminders: event.reminders.idReminders,
      });
    }

    if (event.reminders.idReminders.length == 0) {
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
      event.reminders.idReminders = [
        ...event.reminders.idReminders,
        ...remindersId,
      ];
      // console.log({ seted: event.reminders.idReminders });
    }

    // event.syncStatus = false;
    // await eventController.updateLocalEvent({
    //   event,
    // });
    // await syncData({ date: eventController.getCurrentDate() });
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
  } catch (error) {
    await systemController.openToast({ message: "Problema al sincronizar" });
    console.error(error);
  }
}

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

defineExpose({ openModalAdd, reschedule, syncAction });
</script>
