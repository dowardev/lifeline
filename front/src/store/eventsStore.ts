import { defineStore } from "pinia";
import { Event } from "@/utils/interfaces";
import { ref } from "vue";

export const useEventsStore = defineStore("events", () => {
  const events = ref([] as Event[]);

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

  function addEvent(params: { event: Event }): void {
    const event = params.event;
    const exists = events.value.find((localEvent) => localEvent.id == event.id);
    if (!exists) events.value.push(event);
  }

  function addEvents(params: { events: Event[] }): void {
    const { events: eventsData } = params;
    eventsData.forEach((newEvent) => {
      const exists = events.value.find(
        (localEvent) => localEvent.id == newEvent.id
      );
      if (!exists) events.value.push(newEvent);
    });
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

  function removeEvent(params: { id: number }): void {
    const { id: eventId } = params;
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

  function setEvents(params: { events: Event[] }): void {
    const { events: newEvents } = params;
    events.value = newEvents;
  }

  return {
    addEvent,
    addEvents,
    events,
    getEvent,
    getEvents,
    removeEvent,
    setEvents,
    updateEvent,
    updateEvents,
  };
});
