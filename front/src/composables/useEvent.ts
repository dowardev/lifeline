import { NewEvent, Event, Schedule } from "@/utils/interfaces";
import {
  saveLocalEvent as saveLocalEventService,
  getEventsLocal as getEventsLocalService,
  updateLocalEvent as updateLocalEventService,
  deleteEvent as deleteEventService,
  pushEvent as pushEventService,
  createEvent as createEventService,
  getEvents as getEventsServivice,
  updateEvent as updateEventService,
  removeAllLocalEvents as removeAllLocalEventsService,
  deleteEvents as deleteEventsService,
  deleteEventServer as deleteEventServerService,
  generateEventId as generateEventIdService,
  formatEvent as formatEventService,
  saveLocalEvents as saveLocalEventsService,
  getEventLocal,
} from "../services/event";
import { useEventsStore } from "../store/eventsStore";
import { USER_EVENTS } from "@/utils/graphql";
import * as jsonpatch from "fast-json-patch";
import { useSchedule } from "./useSchedule";
import { difference } from "lodash";

export const useEvent = () => {
  const eventStore = useEventsStore();

  async function saveEvent(params: { event: Event }): Promise<void> {
    let { event } = params;

    try {
      const { event: eventFormated } = formatEventService({ event });
      const { id } = await pushNewEvent({ event });
      event = eventFormated;
      event.idSync = id;
      await saveLocalEventService({
        event,
      });
      eventStore.addEvent({ event });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function updateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      const { event: eventFormated } = formatEventService({ event });
      try {
        await pusUpdateEvent({ event: eventFormated });
        event.syncStatus = true;
      } catch (error) {
        event.syncStatus = false;
        throw new Error(error);
      }

      await updateLocalEvent({ event: eventFormated });
      eventStore.updateEvent({ event: eventFormated });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadEvents(): Promise<void> {
    let events = await getStoredEvents();
    events = events.map((event) => {
      // formatEventService({ event, opts: { id: true } });
      // debugger
      return event;
    });
    eventStore.addEvents({ events });
  }

  async function getEvents(): Promise<Event[]> {
    const events = eventStore.getEvents();
    return events != null ? events : ([] as Event[]);
  }

  function getEvent(params: { idEvent: string }): Event | undefined {
    const idEvent = params.idEvent;
    const event = eventStore.getEvent({ idEvent });

    return event ?? undefined;
  }

  async function pushUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      await pushEventService({ event });
    } catch (error) {
      console.error(error);
    }
  }

  async function getStoredEvents(): Promise<Array<Event>> {
    return await getEventsLocalService();
  }

  async function getEventsServer(): Promise<Array<Event>> {
    const events = await getEventsServivice({
      graphql: { name: USER_EVENTS, fragment: "Events", refetch: true },
    });
    return events ?? ([] as Event[]);
  }

  async function storeEventsServer(): Promise<void> {
    const eventsStored = (await useEvent().getStoredEvents()) ?? [];
    const eventsServer = (await useEvent().getEventsServer()) ?? [];

    for (const event of eventsServer) {
      const result = eventsStored?.filter(
        (eventF) => eventF.idSync == event.idSync,
      );
      if (result?.length == 0 || result == undefined) {
        event.reminders.start = new Date(event.reminders.start);
        event.reminders.end = new Date(event.reminders.end);
        await storeLocalEvent({ event });
      }
    }
  }

  async function getEventsServerUpdated(): Promise<{
    eventsUpdated: Event[];
  }> {
    const localEvents = (await useEvent().getStoredEvents()) ?? [];
    const serverEvents = (await useEvent().getEventsServer()) ?? [];
    const localMap = new Map<string, Event>();
    for (const event of localEvents) {
      if (event.idSync) {
        localMap.set(event.idSync, event);
      }
    }

    const mergedEvents: Event[] = [];
    for (const serverEvent of serverEvents) {
      const localEvent = serverEvent.idSync
        ? localMap.get(serverEvent.idSync)
        : undefined;

      const diff = jsonpatch.compare(localEvent!, serverEvent);
      if (diff.length > 0) {
        serverEvent.id = localEvent!.id;
        jsonpatch.applyPatch(localEvent, diff);
        mergedEvents.push(localEvent!);
        await updateEvent({ event: serverEvent });
      }
      localMap.delete(serverEvent.idSync!);
    }
    return { eventsUpdated: mergedEvents };
  }

  async function storeRemoveEventsServer(): Promise<{
    eventsDeleted: Event[];
  }> {
    const eventsStored = (await useEvent().getStoredEvents()) ?? [];
    const eventsServer = (await useEvent().getEventsServer()) ?? [];

    const deleted = [] as Event[];

    for (let i = 0; i < eventsStored.length; i++) {
      const encontrado = eventsServer.find(
        (obj) => obj.idSync === eventsStored[i].idSync,
      );
      if (!encontrado) {
        deleted.push(...eventsStored.splice(i, 1));
        i--;
      }
    }

    for (const event of deleted) {
      await useEvent().deleteEvent({ eventId: event.id! });
    }
    return { eventsDeleted: deleted };
  }

  async function pushNewEvent(params: {
    event: Event;
  }): Promise<{ id: string | undefined }> {
    const { event } = params;
    let id = undefined as string | undefined;

    try {
      const response = await createEventService({ event });
      id = response.id;
    } catch (error) {
      console.error(error);
    }
    return { id };
  }

  async function pushEventsUpdated(): Promise<void> {
    const events = await getEventsLocalService();
    const result = events.filter((event) => event.syncStatus == false);
    await Promise.all(
      result.map(async (event) => {
        await pusUpdateEvent({ event });
      }),
    );
  }

  async function pusUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    try {
      console.log(event);
      await updateEventService({ event });
      event.syncStatus = true;
    } catch (error) {
      console.error(error);
    }
  }

  async function removeAllEvents(): Promise<void> {
    await removeAllLocalEventsService();
  }

  async function syncEventsFromServer(): Promise<void> {
    const eventsServer = await useEvent().getEventsServer();
    const localEvents = await getStoredEvents();

    const diffEvents: Event[] = [];
    for (const event of eventsServer) {
      const idSync = event.idSync;
      const found = localEvents.find((e) => e.idSync === idSync);
      if (!found) {
        const { event: eventFormated } = formatEventService({
          event,
          opts: { id: true },
        });
        diffEvents.push(eventFormated);
      }
    }
    if (diffEvents.length > 0)
      await saveLocalEventsService({ events: diffEvents });
  }

  async function sync(): Promise<void> {
    await syncEventsFromServer();
    await pushEventsUpdated();
  }

  async function deleteEvents(): Promise<void> {
    await deleteEventsService();
  }

  async function storeLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    await saveLocalEventService({
      event,
    });
  }

  async function updateLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    await updateLocalEventService({ event });
  }

  function removeEventStore(params: { id: string }): void {
    const { id } = params;
    eventStore.removeEvent({ eventId: id });
  }

  async function deleteEventStored(params: { id: string }): Promise<void> {
    const { id } = params;
    await deleteEventService({ eventId: id });
  }

  async function removeEventServer(params: { id: string }): Promise<void> {
    const { id } = params;
    await deleteEventServerService({ id });
  }

  async function deleteEvent(params: { eventId: string }): Promise<void> {
    const eventId = params.eventId;
    const syntEventId = await getEventLocal({ id: eventId });
    await deleteEventService({ eventId });
    await deleteEventServerService({ id: syntEventId.idSync as any });
    eventStore.removeEvent({ eventId });
  }

  return {
    deleteEvent,
    deleteEventStored,
    deleteEvents,
    getEvent,
    getEvents,
    getEventsServer,
    getStoredEvents,
    loadEvents,
    pusUpdateEvent,
    pushNewEvent,
    pushUpdateEvent,
    removeAllEvents,
    removeEventServer,
    removeEventStore,
    saveEvent,
    storeEventsServer,
    storeLocalEvent,
    storeRemoveEventsServer,
    storeUpdateEventsServer: getEventsServerUpdated,
    sync,
    syncEventsFromServer,
    updateEvent,
    updateLocalEvent,
  };
};
