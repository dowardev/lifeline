import { NewEvent, Event } from "@/utils/interfaces";
import {
  saveLocalEvent as saveLocalEventService,
  getEventsLocal as getEventsLocalService,
  updateLocalEvent,
  deleteEvent as deleteEventService,
  pushEvent as pushEventService,
  createEvent as createEventService,
  getEvents as getEventsServivice,
  updateEvent as updateEventService,
  removeAllLocalEvents as removeAllLocalEventsService,
} from "../services/event";
import { useEventsStore } from "../store/eventsStore";
import { USER_EVENTS } from "@/utils/graphql";
import * as jsonpatch from "fast-json-patch";

export const useEvent = () => {
  const eventStore = useEventsStore();

  async function saveEvent(params: { event: Event }): Promise<{ id: string }> {
    const eventData = params.event;

    try {
      const { id } = await saveLocalEventService({
        event: eventData,
      });
      eventData.id = id;
      eventStore.addEvent({ event: eventData });

      return { id: eventData.id };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function updateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      await updateLocalEvent({
        event,
      });
      eventStore.updateEvent({ event });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadEvents(): Promise<void> {
    const events = (await getEventsLocalService()) ?? [];
    eventStore.updateEvents({ events });
  }

  async function getEvents(): Promise<Array<Event> | undefined> {
    const events = eventStore.getEvents();
    return events != null ? JSON.parse(JSON.stringify(events)) : undefined;
  }

  function getEvent(params: { idEvent: string }): Event | undefined {
    const idEvent = params.idEvent;
    const event = eventStore.getEvent({ idEvent });

    return event ?? undefined;
  }

  async function deleteEvent(params: { eventId: string }) {
    const eventId = params.eventId;
    await deleteEventService({ eventId });
    eventStore.removeEvent({ eventId });
  }

  async function syncEvents(): Promise<void> {
    const events = (await getEventsLocalService()) ?? [];
    events.forEach((event) => {
      if (event.syncStatus == false || event.syncStatus == undefined) {
        createEventService({ event });
      } else {
        pushEventService({ event });
      }
    });
  }

  async function pushEvents(): Promise<void> {
    const events = (await useEvent().getStoredEvents()) ?? [];

    await Promise.all(
      events.map(async (event) => {
        if (event.idSync == "" || event.idSync == undefined) {
          try {
            const { id } = await createEventService({ event });
            event.syncStatus = true;
            event.idSync = id;
          } catch (error) {
            console.error(error);
          }
        }

        if (event.syncStatus == false) {
          try {
            await pushEventService({ event });
            event.syncStatus = true;
          } catch (error) {
            console.error(error);
          }
        }
      })
    );
  }

  async function getStoredEvents(): Promise<Array<Event> | null> {
    return (await getEventsLocalService()) ?? null;
  }

  async function getEventsServer(): Promise<Array<Event> | undefined> {
    const events = await getEventsServivice({
      graphql: { name: USER_EVENTS, fragment: "Events", refetch: true },
    });
    return events ?? undefined;
  }

  async function storeEventsServer(): Promise<void> {
    const eventsStored = (await useEvent().getStoredEvents()) ?? [];
    const eventsServer = (await useEvent().getEventsServer()) ?? [];

    for (const event of eventsServer) {
      const result = eventsStored?.filter(
        (eventF) => eventF.idSync == event.idSync
      );
      if (result?.length == 0 || result == undefined)
        await saveEvent({ event });
    }
  }

  async function storeUpdateEventsServer(): Promise<{
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
        (obj) => obj.idSync === eventsStored[i].idSync
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

  async function pusUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    try {
      await updateEventService({ event });
      event.syncStatus = true;
    } catch (error) {
      console.error(error);
    }
  }

  async function removeAllEvents(): Promise<void> {
    await removeAllLocalEventsService();
  }
  return {
    saveEvent,
    loadEvents,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
    syncEvents,
    pushEvents,
    getStoredEvents,
    getEventsServer,
    storeEventsServer,
    storeRemoveEventsServer,
    pushNewEvent,
    pusUpdateEvent,
    storeUpdateEventsServer,
    removeAllEvents,
  };
};
