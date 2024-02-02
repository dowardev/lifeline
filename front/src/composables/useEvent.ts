import { NewEvent, Event, Schedule } from "@/utils/interfaces";
import {
  createEvent as createEventService,
  deleteEvent as deleteEventService,
  deleteEventServer as deleteEventServerService,
  deleteEvents as deleteEventsService,
  deleteReminders as deleteRemindersService,
  formatEvent as formatEventService,
  generateEventId as generateEventIdService,
  getEventLocal,
  getEvents as getEventsServivice,
  getEventsLocal as getEventsLocalService,
  getEventsLocalByDate as getEventsLocalByDateService,
  pushEvent as pushEventService,
  removeAllLocalEvents as removeAllLocalEventsService,
  saveLocalEvent as saveLocalEventService,
  saveLocalEvents as saveLocalEventsService,
  updateEventServer as updateEventServer,
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

  /**
   * Perform all the necessary procedure to add a event both generally, locally and from the store
   *
   * @param {Object} params
   * @param {Event} params.event event
   *
   * @returns {Promise<void>}
   */
  async function saveEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    let id = null;

    try {
      id = (await pushNewEvent({ event })).id;
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      event.reminders.start = new Date(event.reminders.start);
      event.reminders.end = new Date(event.reminders.end);
      event.idSync = id;
      event.status = "active";
      event.syncStatus = false;
      await saveLocalEvent({
        event,
      });
      eventStore.addEvent({ event });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadEvents(params: {
    dates: { start: Date; end: Date };
  }): Promise<void> {
    const { dates } = params;
    let events = await getStoredEvents({ filterType: "date", dates });
    events = events.map((event) => {
      formatEventService({ event });
      return event;
    });
    eventStore.setEvents({ events });
  }

  /**
   * Get all events from Pinia store
   *
   * @returns {Promise<Event[]>}
   */
  async function getEvents(): Promise<Event[]> {
    const events = eventStore.getEvents();
    return events != null ? events : ([] as Event[]);
  }

  function getEvent(params: { idEvent: number }): Event | undefined {
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

  /**
   * Get all events from sqlite
   *
   * @returns {Promise<Event[]>}
   */
  async function getStoredEvents(params: {
    filterType: "none" | "date";
    dates?: { start: Date; end: Date } | undefined;
  }): Promise<Array<Event>> {
    const { filterType, dates } = params;
    try {
      const db = await dbConnectionService();
      let events: Event[] = [];

      if (filterType == "none") events = await getEventsLocalService({ db });

      if (filterType == "date") {
        if (dates == undefined) throw new Error("Required dates");
        events = await getEventsLocalByDateService({ db, dates: dates as any });
      }
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
    const eventsStored =
      (await useEvent().getStoredEvents({ filterType: "none" })) ?? [];
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
    const localEvents = (
      (await getStoredEvents({ filterType: "none" })) ?? []
    ).filter((event) => event.idSync! >= 0);

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
          if (element.idSync === event.idSync) {
            if (!lodash.isEqual(element.name, event.name)) {
              differences++;
            }
            if (!lodash.isEqual(element.guests, event.guests)) {
              differences++;
            }

            if (
              !lodash.isEqual(
                element.reminders.start.getHours(),
                event.reminders.start.getHours()
              ) ||
              !lodash.isEqual(
                element.reminders.start.getMinutes(),
                event.reminders.start.getMinutes()
              )
            ) {
              differences++;
            }
            if (
              !lodash.isEqual(
                element.reminders.end.getHours(),
                event.reminders.end.getHours()
              ) ||
              !lodash.isEqual(
                element.reminders.end.getMinutes(),
                event.reminders.end.getMinutes()
              )
            ) {
              differences++;
            }
            if (
              !lodash.isEqual(
                element.reminders.notifications,
                event.reminders.notifications
              )
            ) {
              differences++;
            }
            if (
              !lodash.isEqual(element.reminders.repeat, event.reminders.repeat)
            ) {
              differences++;
            }

            if (!lodash.isEqual(element.timezone, event.timezone)) {
              differences++;
            }
            if (!lodash.isEqual(element.description, event.description)) {
              differences++;
            }
            if (!lodash.isEqual(element.availability, event.availability)) {
              differences++;
            }
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

  /**
   * Create a new event in server
   * @param {Object} params
   * @param {Event} params.event event
   * @returns {Promise<{ id: number | null }>}
   */
  async function pushNewEvent(params: {
    event: Event;
  }): Promise<{ id: number | null }> {
    const { event } = params;
    let id = null as number | null;

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
    const events = await getEventsLocalService({ db });

    const result = events.filter(
      (event) => event.idSync != null && event.syncStatus == false
    );

    try {
      await Promise.all(
        result.map(async (event) => {
          await updateEventServer({ event });
        })
      );
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function pusUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    try {
      await updateEventServer({ event });
    } catch (error) {
      console.error(error);
    }
  }

  async function removeAllEvents(): Promise<void> {
    await removeAllLocalEventsService();
  }

  async function syncEventsFromServer(): Promise<void> {
    const serverEvents = (await getEventsServer()) ?? [];
    const localEvents = await getStoredEvents({ filterType: "none" });
    const problems = await getConflictingLocalEvents({
      events: serverEvents,
    });
    const eventsServerDeleted = localEvents.filter((event) => {
      if (event.idSync == null) return;
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

    const newServerEvents = lodash.filter(serverEvents, (event) => {
      return !lodash.some(
        localEvents,
        (otherEvent) => event.idSync === otherEvent.idSync
      );
    });

    const newLocalEvents = localEvents.filter((event) => event.idSync == null);

    try {
      if (newLocalEvents.length > 0)
        for (let index = 0; index < newLocalEvents.length; index++) {
          const event = newLocalEvents[index];
          const { id } = await pushNewEvent({ event });
          event.idSync = id as number;
          event.syncStatus = true;
          await updateLocalEvent({ event });
        }
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    }

    try {
      if (newServerEvents.length > 0)
        for (let index = 0; index < newServerEvents.length; index++) {
          const event = newServerEvents[index];
          await saveLocalEvent({
            event,
          });
        }
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    }

    try {
      if (problems.length > 0)
        for (let index = 0; index < problems.length; index++) {
          const event = problems[index];
          await saveEvent({ event });
        }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (toUpdate.length > 0)
        for (let index = 0; index < toUpdate.length; index++) {
          const event = toUpdate[index];
          await updateLocalEvent({ event: event as any });
        }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (eventsServerDeleted.length > 0)
        for (let index = 0; index < eventsServerDeleted.length; index++) {
          const event = eventsServerDeleted[index];
          await deleteLocalEvent({ id: event.id as number });
        }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function sync(): Promise<void> {
    await pushEventsUpdated();
    await syncEventsFromServer();
    await deleteInativeEventOnServer();
  }

  async function deleteEvents(params: {
    db: SQLiteDBConnection;
  }): Promise<void> {
    const { db } = params;
    await deleteEventsService({ db });
  }

  async function deleteReminders(params: {
    db: SQLiteDBConnection;
  }): Promise<void> {
    const { db } = params;
    await deleteRemindersService({ db });
  }

  async function storeLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    await saveLocalEventService({
      event,
    });
  }

  async function updateLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      await updateLocalEventService({
        event,
      });
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    } finally {
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

  /**
   * Perform all the necessary procedure to delete an event both generally, locally and from the store
   *
   * @param {Object} params
   * @param {number} params.id event id in sqlite
   *
   * @returns {Promise<void>}
   */
  async function deleteEvent(params: { id: number }): Promise<void> {
    const { id } = params;
    const db = await dbConnectionService();
    // await db.open();

    let status = false;
    try {
      const idSync = (await getEventLocal({ db, id })).idSync;
      await deleteEventServerService({ id: idSync as number });
      status = true;
    } catch (error: any) {
      if (error.message == "No internet connection")
        console.log("No internet connection");
      else throw new Error(error);
    }

    if (status == true) {
      try {
        await deleteLocalEvent({ id });
        status = true;
        eventStore.removeEvent({ id });
      } catch (error: any) {
        throw new Error(error);
      }
    }

    if (status == false) {
      try {
        const event = await getEventLocal({ db, id });
        event.status = "inactive";
        const { event: eventFormated } = formatEventService({ event });
        await updateLocalEvent({ event: eventFormated });
      } catch (error: any) {
        throw new Error(error);
      }
    }
    // await db.close();
  }

  async function createTableEvents(): Promise<void> {
    // const query = `CREATE TABLE IF NOT EXISTS Events
    // (
    //   id INTEGER PRIMARY KEY AUTOINCREMENT,
    //   name TEXT,
    //   guests TEXT,
    //   timezone TEXT,
    //   description TEXT,
    //   availability TEXT,
    //   idSync INT,
    //   syncStatus BOOLEAN,
    //   status TEXT
    // );`;
    const query = `CREATE TABLE IF NOT EXISTS Events
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      guests TEXT,
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

  async function createTableReminders(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS Reminders
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER REFERENCES EVENTS(id),
      start TEXT,
      end TEXT,
      notifications TEXT NULL,
      repeat Boolean NULL,
      frecuency INT NULL,
      type TEXT NULL,
      daysWeek TEXT NULL
    );`;
    await createTable({ query });
  }

  async function createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await dbConnectionService();
      // await db.open();
      await createTableService({ query, db });
      // await db.close();
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

    try {
      event.syncStatus = true;
      await saveLocalEventService({
        event,
      });
    } catch (error: any) {
      throw new Error(error);
    } finally {
    }
  }

  /**
   * Delete event on the local
   *
   * @param {Object} params
   * @param {Number} params.id id of the event on the server (idSync)
   * @returns {Promise<void>}
   */
  async function deleteLocalEvent(params: { id: number }): Promise<void> {
    const { id } = params;
    const db = await dbConnectionService();
    await deleteEventService({ id, db });
  }

  async function deleteInativeEventOnServer(): Promise<void> {
    const localEvents = await getStoredEvents({ filterType: "none" });
    const events = localEvents.filter((event) => event.status == "inactive");
    await Promise.all(
      events.map(async (event) => {
        await deleteEventServerService({ id: event.idSync as number });
      })
    );
  }

  return {
    createTableEvents,
    createTableReminders,
    deleteEvent,
    deleteEventStored,
    deleteEvents,
    deleteReminders,
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
    saveLocalEvent,
    setCurrentDate,
    storeEventsServer,
    storeLocalEvent,
    storeRemoveEventsServer,
    storeUpdateEventsServer: getConflictingLocalEvents,
    sync,
    syncEventsFromServer,
    updateLocalEvent,
  };
};
