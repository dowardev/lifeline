import { NewEvent, Event, Schedule } from "@/utils/interfaces";
import {
  createEvent as createEventService,
  deleteEvent as deleteEventService,
  deleteEventServer as deleteEventServerService,
  deleteEvents as deleteEventsService,
  formatEvent as formatEventService,
  generateEventId as generateEventIdService,
  getEventLocal,
  getEvents as getEventsServivice,
  getEventsLocal as getEventsLocalService,
  pushEvent as pushEventService,
  removeAllLocalEvents as removeAllLocalEventsService,
  saveLocalEvent as saveLocalEventService,
  saveLocalEvents as saveLocalEventsService,
  updateEvent as updateEventService,
  updateLocalEvent as updateLocalEventService,
} from "../services/event";
import { useEventsStore } from "../store/eventsStore";
import { USER_EVENTS } from "@/utils/graphql";
import * as jsonpatch from "fast-json-patch";
import { useSchedule } from "./useSchedule";
import { difference, parseInt } from "lodash";
import { useSystem } from "./useSystem";
import {
  dbConnection as dbConnectionService,
  createTable as createTableService,
} from "@/services/dbService";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { toRaw } from "vue";
import * as lodash from "lodash";

export const useEvent = () => {
  const eventStore = useEventsStore();

  async function saveEvent(params: { event: Event }): Promise<void> {
    let { event } = params;

    try {
      const { event: eventFormated } = formatEventService({ event });
      const { id } = await pushNewEvent({ event });
      event = eventFormated;
      event.idSync = id;
      await saveLocalEvent({
        event: eventFormated,
      });
      eventStore.addEvent({ event });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // TODO: remove
  async function updateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      const { event: eventFormated } = formatEventService({ event });
      try {
        // await pusUpdateEvent({ event: eventFormated });
        event.syncStatus = true;
      } catch (error: any) {
        event.syncStatus = false;
        throw new Error(error);
      }

      await updateLocalEvent({ event: eventFormated });
      // eventStore.updateEvent({ event: eventFormated });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadEvents(): Promise<void> {
    let events = await getStoredEvents();
    events = events.map((event) => {
      formatEventService({ event });
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
    try {
      const db = await dbConnectionService();
      await db.open();
      const events = await getEventsLocalService({ db });
      await db.close();
      return events;
    } catch (error: any) {
      throw new Error(error);
    }
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
        (eventF) => eventF.idSync == event.idSync
      );
      if (result?.length == 0 || result == undefined) {
        event.reminders.start = new Date(event.reminders.start);
        event.reminders.end = new Date(event.reminders.end);
        await storeLocalEvent({ event });
      }
    }
  }

  async function getConflictingLocalEvents(params: {
    events: Event[];
  }): Promise<Event[]> {
    const { events: serverEvents } = params;
    const localEvents = (await getStoredEvents()) ?? [];

    const sharedIds = lodash.filter(serverEvents, (event) =>
      lodash.some(
        localEvents,
        (otherEvent) => event.idSync === otherEvent.idSync
      )
    );

    const newArray: Event[] = [];

    lodash.forEach(sharedIds, (event) => {
      const found = lodash.find(
        localEvents,
        (element) => element.idSync == event.idSync
      );

      if (found) {
        let differences = 0;

        lodash.forEach(localEvents, (element) => {
          if (element.idSync == event.idSync) {
            if (!lodash.isEqual(element.name, event.name)) differences++;
            if (!lodash.isEqual(element.guests, event.guests)) differences++;
            if (!lodash.isEqual(element.reminders, event.reminders))
              differences++;
            if (!lodash.isEqual(element.timezone, event.timezone))
              differences++;
            if (!lodash.isEqual(element.description, event.description))
              differences++;
            if (!lodash.isEqual(element.availability, event.availability))
              differences++;
          }
        });

        if (differences > 0) {
          const copy = lodash.clone(found);
          copy.reminders = copy.reminders;
          copy.guests = copy.guests;
          newArray.push(copy);
        }
      }
    });

    return newArray;
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

  async function pushEventsUpdated(): Promise<void> {
    const db = await dbConnectionService();
    await db.open();
    const events = await getEventsLocalService({ db });
    await db.close();
    const result = events.filter((event) => {
      event.idSync = event.idSync ?? 0;
      event.syncStatus == false && event.idSync > 0;
    });
    await Promise.all(
      result.map(async (event) => {
        await pusUpdateEvent({ event });
      })
    );
  }

  async function pusUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    try {
      await updateEventService({ event });
    } catch (error) {
      console.error(error);
    }
  }

  async function removeAllEvents(): Promise<void> {
    await removeAllLocalEventsService();
  }

  async function syncEventsFromServer(): Promise<void> {
    const serverEvents = (await getEventsServer()) ?? [];
    const localEvents = await getStoredEvents();
    const problems = await getConflictingLocalEvents({
      events: serverEvents,
    });
    const eventsServerDeleted = localEvents.filter((event) => {
      const found = serverEvents.find(
        (element) => element.idSync == event.idSync
      );
      if (!found) {
        return event;
      }
    });

    const toUpdate: Event[] = [];

    problems.forEach((event) => {
      const found = serverEvents.find(
        (element) => element.idSync == event.idSync
      );
      if (found) {
        found.id = event.id;
        toUpdate.push(found);
      }
    });

    const events = serverEvents.filter((element) => {
      return !localEvents.some(
        (otherElement) => otherElement.idSync === element.idSync
      );
    });

    try {
      await Promise.all(
        events.map(async (event) => {
          await saveLocalEvent({
            event,
          });
        })
      );
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    }

    try {
      if (problems.length > 0) {
        await Promise.all(
          problems.map(async (event) => {
            await saveEvent({ event });
          })
        );
      }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(async (event) => {
            await updateLocalEvent({ event: event as any });
          })
        );
      }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (eventsServerDeleted.length > 0) {
        await Promise.all(
          eventsServerDeleted.map(async (event) => {
            await deleteLocalEvent({ id: event.id as number });
          })
        );
      }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function sync(): Promise<void> {
    await syncEventsFromServer();
    await pushEventsUpdated();
    await deleteInativeEventOnServer();
  }

  async function deleteEvents(params: {
    db: SQLiteDBConnection;
  }): Promise<void> {
    const { db } = params;
    await deleteEventsService({ db });
  }

  async function storeLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    await saveLocalEventService({
      event,
    });
  }

  async function updateLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    const db = await dbConnectionService();
    await db.open();
    try {
      await updateLocalEventService({
        id: event.id as any,
        values: [
          event.availability,
          event.description,
          JSON.stringify(event.guests),
          event.idSync,
          event.name,
          JSON.stringify(event.reminders),
          event.syncStatus,
          event.timezone,
          event.status,
        ],
        fields: [
          "availability",
          "description",
          "guests",
          "idSync",
          "name",
          "reminders",
          "syncStatus",
          "timezone",
          "status",
        ],
        db,
      });
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    } finally {
      await db.close();
    }
  }

  function removeEventStore(params: { id: string }): void {
    const { id } = params;
    eventStore.removeEvent({ id: id });
  }

  async function deleteEventStored(params: { id: string }): Promise<void> {
    const { id } = params;
    await deleteEventService({ eventId: id });
  }

  async function removeEventServer(params: { id: string }): Promise<void> {
    const { id } = params;
    await deleteEventServerService({ id });
  }

  async function deleteEvent(params: { localId: number }): Promise<void> {
    const { localId } = params;
    const db = await dbConnectionService();
    await db.open();

    let status = false;
    try {
      const idSync = (await getEventLocal({ db, id: localId })).idSync;
      await deleteEventServerService({ id: idSync as number });
      status = true;
    } catch (error: any) {
      if (error.message == "No internet connection")
        console.log("No internet connection");
      else throw new Error(error);
    }

    if (status == true) {
      try {
        await deleteLocalEvent({ id: localId as number });
        status = true;
        eventStore.removeEvent({ id: localId });
      } catch (error: any) {
        throw new Error(error);
      }
    }

    if (status == false) {
      try {
        const event = await getEventLocal({ db, id: localId });
        event.status = "inactive";
        const { event: eventFormated } = formatEventService({ event });
        await updateLocalEvent({ event: eventFormated });
      } catch (error: any) {
        throw new Error(error);
      }
    }
    await db.close();
  }

  async function createTableEvents(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS EVENTS 
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      guests TEXT,
      reminders TEXT,
      timezone TEXT,
      description TEXT,
      availability TEXT,
      idSync INT,
      syncStatus BOOLEAN,
      status TEXT,
      UNIQUE(idSync)
    );`;
    await createTable({ query });
  }

  async function createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await dbConnectionService();
      await db.open();
      await createTableService({ query, db });
      await db.close();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  function setCurrentDate(params: { date: Date }): void {
    const { date } = params;
    eventStore.updateCurrentDate({ date });
  }

  async function saveLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    const db = await dbConnectionService();
    await db.open();

    try {
      await saveLocalEventService({
        values: [
          event.availability,
          event.description,
          JSON.stringify(event.guests),
          event.idSync,
          event.name,
          JSON.stringify(event.reminders),
          event.syncStatus,
          event.timezone,
        ],
        fields: [
          "availability",
          "description",
          "guests",
          "idSync",
          "name",
          "reminders",
          "syncStatus",
          "timezone",
        ],
        db,
      });
    } catch (error: any) {
      throw new Error(error);
    } finally {
      await db.close();
    }
  }

  async function deleteLocalEvent(params: { id: number }): Promise<void> {
    const { id } = params;
    const db = await dbConnectionService();
    await db.open();
    await deleteEventService({ id, db });
    await db.close();
  }

  async function deleteInativeEventOnServer(): Promise<void> {
    const localEvents = await getStoredEvents();
    const events = localEvents.filter((event) => event.status == "inactive");
    await Promise.all(
      events.map(async (event) => {
        await deleteEventServerService({ id: event.idSync as number });
      })
    );
  }

  return {
    createTableEvents,
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
    storeUpdateEventsServer: getConflictingLocalEvents,
    sync,
    syncEventsFromServer,
    updateEvent,
    updateLocalEvent,
    setCurrentDate,
  };
};
