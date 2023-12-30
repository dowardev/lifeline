import { defineStore } from "pinia";
import { Event, Schedule } from "@/utils/interfaces";
import { getEvents as getEventsService } from "../services/event";
import { USER_EVENTS } from "../services/graphql";
import { ref, toRaw, watch } from "vue";
import { useSchedule } from "@/composables/useSchedule";
import { useReminder } from "@/composables/useReminder";
import { forEach, isEqual } from "lodash";
import { useEvent } from "@/composables/useEvent";
import { storage } from "@/main";
import { da } from "date-fns/locale";

export const useEventsStore = defineStore("events", () => {
  const events = ref([] as Event[]);
  const date = ref(new Date().toISOString());
  const scheduleComposable = useSchedule();
  const useReminderComposable = useReminder();
  const eventComposable = useEvent();
  const calendarSchedule = ref({} as Schedule);

  watch(
    () => [date.value, events.value],
    (newValue, oldValue) => {
      calendarSchedule.value = useSchedule().generateEventsSchedule({
        events: newValue[1] as Event[],
        date: new Date(newValue[0] as string),
      });
    },
    { deep: true }
  );

  function getEvents() {
    return events.value;
  }

  function getEvent(params: { idEvent: string }) {
    const { idEvent } = params;
    const document = events.value.filter((event) => {
      if (event.id == idEvent) return event;
    });
    return document[0];
  }

  function addEvent(params: { event: Event }) {
    const event = params.event;
    events.value = [...events.value, event];
  }

  function addEvents(params: { events: Event[] }): void {
    const { events: eventsData } = params;
    events.value = [...events.value, ...eventsData];
  }

  function updateEvent(params: { event: Event }): void {
    const event = params.event;
    events.value = events.value.map((element) => {
      if (element.id == event.id) element = { ...element, ...event };
      return element;
    });
  }

  function updateEvents(params: { events: Array<Event> }) {
    const { events: eventsData } = params;
    const combinedArray: Event[] = [...eventsData];

    eventsData.forEach((item) => {
      const index = combinedArray.findIndex(
        (element) => element.id === item.id
      );
      if (index === -1) {
        combinedArray.push(item);
      } else {
        combinedArray[index] = item;
      }
    });

    events.value = combinedArray;
  }

  function removeEvent(params: { eventId: string }): void {
    const { eventId } = params;
    const result = events.value.filter((event) => event.id != eventId);
    events.value = result;
  }

  // watch(
  //   () => events.value,
  //   async (newValue, oldValue) => {
  //     const newEvents = newValue.filter(
  //       (event, index) => event !== oldValue[index],
  //     );
  //     if (newEvents.length == 0) return;
  //     await Promise.all(
  //       newEvents.map(async (event) => {
  //         event=toRaw(event)
  //         if (event.idSync == undefined) {
  //           const { id: idSync } = await eventComposable.pushNewEvent({
  //             event,
  //           });
  //           event.idSync = idSync;
  //           event.syncStatus = true;
  //         }
  //         if (event.stored == false || event.stored == undefined) {
  //           event.stored = true;
  //           await eventComposable.storeLocalEvent({
  //             event: event,
  //           });
  //         }
  //
  //         const schedule = scheduleComposable.generateEventSchedule({ event });
  //         await scheduleComposable.generateEventsReminders({
  //           events: newEvents,
  //         });
  //         scheduleComposable.setSchedule({ schedule });
  //       }),
  //     );
  //   },
  //   { deep: true },
  // );
  // watch(
  //   () => events.value,
  //   async (newValue, oldValue) => {
  //     if (newValue.length == 0) return;
  //     console.log(newValue.length==oldValue.length)
  //     const events = newValue;
  //     await Promise.all(
  //       events.map(async (event) => {
  //         if (event.idSync == undefined) {
  //           const { id: idSync } = await eventComposable.pushNewEvent({
  //             event,
  //           });
  //           event.idSync = idSync;
  //           event.syncStatus = true;
  //         }
  //         if (event.stored == false || event.stored == undefined) {
  //           event.stored = true;
  //           await eventComposable.storeLocalEvent({
  //             event: JSON.parse(JSON.stringify(event)),
  //           });
  //         }
  //         if (event.syncStatus == false && event.idSync != "") {
  //           event.syncStatus = true;
  //           await eventComposable.updateLocalEvent({ event });
  //           await eventComposable.pushUpdateEvent({ event });
  //         }
  //         // if (event.status == false) {
  //         //   const id = event.id!;
  //         //   await eventComposable.deleteEventStored({ id });
  //         //   // await eventComposable.removeEventServer({ id });
  //         // }
  //       }),
  //     );
  //     const schedule = await scheduleComposable.generateEventsSchedule({
  //       events,
  //     });
  //     scheduleComposable.setSchedule({ schedule });
  //     await scheduleComposable.generateEventsReminders({
  //       events,
  //     });
  //   },
  //   { deep: true },
  // );
  //

  function updateCurrentDate(params: { date: Date }): void {
    date.value = params.date.toISOString();
  }

  return {
    addEvent,
    addEvents,
    date,
    events,
    getEvent,
    getEvents,
    removeEvent,
    calendarSchedule,
    updateCurrentDate,
    updateEvent,
    updateEvents,
  };
});
