import { Event } from "@/utils/interfaces";
import { useEventsStore } from "../store/eventsStore";
import { USER_EVENTS } from "@/utils/graphql";
import { DBService } from "@/services/dbService";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import lodash from "lodash";
import { storage } from "@/main";
import { ViewCalendar } from "@/utils/types";
import { EventService } from "@/services/event";
import { add, eachDayOfInterval, sub } from "date-fns";

export class EventController {
  private dbService = new DBService();
  private eventService = new EventService();
  private eventStore = useEventsStore();

  /**
   * Perform all the necessary procedure to add a event both generally, locally and from the store
   *
   * @param {Object} params
   * @param {Event} params.event event
   *
   * @returns {Promise<void>}
   */
  async saveEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    let id = null;

    try {
      id = (await this.pushNewEvent({ event })).id;
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      event.reminders.start = new Date(event.reminders.start);
      event.reminders.end = new Date(event.reminders.end);
      event.idSync = id;
      event.status = "active";
      event.syncStatus = false;
      await this.saveLocalEvent({
        event,
      });
      this.eventStore.addEvent({ event });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async loadEvents(params: {
    dates: { start: Date; end: Date };
  }): Promise<void> {
    const { dates } = params;
    const events = await this.getStoredEvents({ filterType: "date", dates });
    this.eventStore.setEvents({ events });
  }

  /**
   * Get all events from Pinia store
   *
   * @returns {Promise<Event[]>}
   */
  getEvents(): Event[] {
    const events = this.eventStore.getEvents();
    return events != null ? events : ([] as Event[]);
  }

  getEvent(params: { idEvent: number }): Event | undefined {
    const idEvent = params.idEvent;
    const event = this.eventStore.getEvent({ idEvent });

    return event ?? undefined;
  }

  async pushUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      await this.eventService.pushEvent({ event });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Get all events from sqlite
   *
   * @returns {Promise<Event[]>}
   */
  async getStoredEvents(params: {
    filterType: "none" | "date";
    dates?: { start: Date; end: Date } | undefined;
  }): Promise<Array<Event>> {
    const { filterType, dates } = params;
    try {
      let events: Event[] = [];

      if (filterType == "none")
        events = await this.eventService.getEventsLocal();

      if (filterType == "date") {
        if (dates == undefined) throw new Error("Required dates");
        events = await this.eventService.getEventsLocalByDate({
          dates: dates as any,
        });
      }
      return events;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getEventsServer(): Promise<Array<Event>> {
    const events = await this.eventService.getEvents({
      graphql: { name: USER_EVENTS, fragment: "Events", refetch: true },
    });
    return events ?? ([] as Event[]);
  }

  async storeEventsServer(): Promise<void> {
    const eventsStored =
      (await this.getStoredEvents({ filterType: "none" })) ?? [];
    const eventsServer = (await this.getEventsServer()) ?? [];

    for (const event of eventsServer) {
      const result = eventsStored?.filter(
        (eventF) => eventF.idSync == event.idSync
      );
      if (result?.length == 0 || result == undefined) {
        event.reminders.start = new Date(event.reminders.start);
        event.reminders.end = new Date(event.reminders.end);
        await this.storeLocalEvent({ event });
      }
    }
  }

  async getConflictingLocalEvents(params: {
    events: Event[];
  }): Promise<Event[]> {
    const { events: serverEvents } = params;
    const localEvents = (
      (await this.getStoredEvents({ filterType: "none" })) ?? []
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

  async storeRemoveEventsServer(): Promise<{
    eventsDeleted: Event[];
  }> {
    const eventsStored = (await this.getStoredEvents()) ?? [];
    const eventsServer = (await this.getEventsServer()) ?? [];

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
      await this.deleteEvent({ eventId: event.id! });
    }
    return { eventsDeleted: deleted };
  }

  /**
   * Create a new event in server
   * @param {Object} params
   * @param {Event} params.event event
   * @returns {Promise<{ id: number | null }>}
   */
  async pushNewEvent(params: { event: Event }): Promise<{ id: number | null }> {
    const { event } = params;
    let id = null as number | null;

    try {
      const response = await this.eventService.createEvent({ event });
      id = response.id;
    } catch (error) {
      console.error(error);
    }
    return { id };
  }

  async pushEventsUpdated(): Promise<void> {
    try {
    } catch (error) {
      console.error(error);
    }
    const events = await this.eventService.getEventsLocal();

    const result = events.filter(
      (event) => event.idSync != null && event.syncStatus == false
    );

    try {
      await Promise.all(
        result.map(async (event) => {
          await this.eventService.updateEventServer({ event });
        })
      );
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async pusUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    try {
      await this.eventService.updateEventServer({ event });
    } catch (error) {
      console.error(error);
    }
  }

  async removeAllEvents(): Promise<void> {
    await this.eventService.removeAllLocalEvents();
  }

  async syncEventsFromServer(): Promise<void> {
    const serverEvents = (await this.getEventsServer()) ?? [];
    const localEvents = await this.getStoredEvents({ filterType: "none" });
    const problems = await this.getConflictingLocalEvents({
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

    // debugger;
    try {
      if (newLocalEvents.length > 0)
        for (let index = 0; index < newLocalEvents.length; index++) {
          const event = newLocalEvents[index];
          const { id } = await this.pushNewEvent({ event });
          event.idSync = id as number;
          event.syncStatus = true;
          await this.updateLocalEvent({ event });
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
          await this.saveLocalEvent({
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
          await this.saveEvent({ event });
        }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (toUpdate.length > 0)
        for (let index = 0; index < toUpdate.length; index++) {
          const event = toUpdate[index];
          await this.updateLocalEvent({ event: event as any });
        }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (eventsServerDeleted.length > 0)
        for (let index = 0; index < eventsServerDeleted.length; index++) {
          const event = eventsServerDeleted[index];
          await this.deleteLocalEvent({ id: event.id as number });
        }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async sync(): Promise<void> {
    try {
      await this.pushEventsUpdated();
      await this.syncEventsFromServer();
      await this.deleteInativeEventOnServer();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async deleteEvents(): Promise<void> {
    await this.eventService.deleteEvents();
  }

  async deleteReminders(): Promise<void> {
    await this.eventService.deleteReminders();
  }

  async storeLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    await this.eventService.saveLocalEvent({
      event,
    });
  }

  async updateLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      await this.eventService.updateLocalEvent({
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

  removeEventStore(params: { id: string }): void {
    const { id } = params;
    this.eventStore.removeEvent({ id: id });
  }

  async deleteEventStored(params: { id: string }): Promise<void> {
    const { id } = params;
    await this.eventService.deleteEvent({ eventId: id });
  }

  async removeEventServer(params: { id: string }): Promise<void> {
    const { id } = params;
    await this.eventService.deleteEventServer({ id });
  }

  /**
   * Perform all the necessary procedure to delete an event both generally, locally and from the store
   *
   * @param {Object} params
   * @param {number} params.id event id in sqlite
   *
   * @returns {Promise<void>}
   */
  async deleteEvent(params: { id: number }): Promise<void> {
    const { id } = params;
    const db = await this.dbService.dbConnection();

    let status = false;
    try {
      const idSync = (await this.eventService.getEventLocal({ id })).idSync;
      await this.eventService.deleteEventServer({ id: idSync as number });
      status = true;
    } catch (error: any) {
      if (error.message == "No internet connection")
        console.log("No internet connection");
      else throw new Error(error);
    }

    if (status == true) {
      try {
        await this.deleteLocalEvent({ id });
        status = true;
        this.eventStore.removeEvent({ id });
      } catch (error: any) {
        throw new Error(error);
      }
    }

    if (status == false) {
      try {
        const event = await this.getEventLocal({ db, id });
        event.status = "inactive";
        const { event: eventFormated } = this.eventService.formatEvent({
          event,
        });
        await this.updateLocalEvent({ event: eventFormated });
      } catch (error: any) {
        throw new Error(error);
      }
    }
    // await db.close();
  }

  async createTableEvents(): Promise<void> {
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
    await this.createTable({ query });
  }

  async createTableReminders(): Promise<void> {
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
      daysWeek TEXT NULL,
      id_reminders TEXT NULL
    );`;
    await this.createTable({ query });
  }

  async createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await this.dbService.dbConnection();
      // await db.open();
      await this.dbService.createTable({ query, db });
      // await db.close();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  setCurrentDate(params: { date: Date }): void {
    const { date } = params;
    this.eventStore.updateCurrentDate({ date });
  }

  async saveLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      event.syncStatus = true;
      await this.eventService.saveLocalEvent({
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
  async deleteLocalEvent(params: { id: number }): Promise<void> {
    const { id } = params;
    await this.eventService.deleteEvent({ id });
  }

  async deleteInativeEventOnServer(): Promise<void> {
    const localEvents = await this.getStoredEvents({ filterType: "none" });
    const events = localEvents.filter((event) => event.status == "inactive");
    await Promise.all(
      events.map(async (event) => {
        await this.eventService.deleteEventServer({
          id: event.idSync as number,
        });
      })
    );
  }

  getCurrentDate(): Date {
    return this.eventStore.date;
  }

  async getCurrentDateStored(): Promise<Date> {
    return (await storage.get("currentDate")) ?? new Date();
  }

  async setCurrentDateStored(params: { date: Date }): Promise<Date> {
    const { date } = params;
    return (await storage.set("currentDate", date)) ?? new Date();
  }

  async getViewCalendarStored(): Promise<ViewCalendar> {
    return (await storage.get("viewCalendar")) ?? "weekly";
  }

  async setViewCalendarStored(params: {
    mode: ViewCalendar;
  }): Promise<ViewCalendar> {
    const { mode } = params;
    return (await storage.set("viewCalendar", mode)) ?? "weekly";
  }

  /**
   * Set a reminder for event group
   *
   * @param {Object} params
   * @param {Number} params.event event is an array object of type Event
   * @returns {Promise<void>}
   */

  /**
   * Set a reminder for an event
   *
   * @param {Object} params
   * @param {Number} params.event event is an object of type Event
   * @returns {Promise<void>}
   */
  async setEventReminder(params: {
    event: Event;
  }): Promise<{ remindersId: number[] }> {
    const { event } = params;

    const dates = this.generatorReminder({ event });
    const remindersId: number[] = [];

    for (let index = 0; index < dates.length; index++) {
      const date = dates[index];
      const { reminderId } = await this.eventService.setEventReminder({
        reminder: date,
        extraInfo: "",
        message: event.description,
        title: event.name!,
      });
      remindersId.push(reminderId);
    }

    return { remindersId };
  }

  async discardEventReminders(params: { event: Event }): Promise<void> {
    const { event } = params;
    const idReminders = event.reminders.idReminders;

    for (let index = 0; index < idReminders.length; index++) {
      const id = idReminders[index];
      // console.log({ deleted: id });
      try {
        await this.eventService.cancelEventReminder({ id });
      } catch (error: any) {
        throw new Error(error);
      }
    }

    event.reminders.idReminders = [];
    await this.updateLocalEvent({ event });
  }

  generatorReminder(params: { event: Event }): Date[] {
    const { event } = params;
    const reminders: Date[] = [];
    event.reminders.start.setMilliseconds(0);
    event.reminders.start.setSeconds(0);

    let dates = eachDayOfInterval({
      start: event.reminders.start,
      end: event.reminders.end,
    });

    dates = dates.map((date) => {
      date.setHours(event.reminders.start.getHours());
      date.setMinutes(event.reminders.start.getMinutes());
      return date;
    });

    const repeatType = event.reminders.repeat?.type;
    if (repeatType == "daily") {
      let frecuency = event.reminders.repeat?.frecuency;
      if (frecuency! > 1) {
        const repeatDates = dates.filter((dt) => {
          const newDate = add(event.reminders.start, {
            days: frecuency,
          });

          if (newDate.toISOString() == dt.toISOString()) {
            frecuency! += event.reminders.repeat?.frecuency!;
            return dt;
          }
        });

        dates = repeatDates;
        dates.push(event.reminders.start);
      }
    }

    if (repeatType == "weekly") {
      let frecuency = event.reminders.repeat?.frecuency;
      let eventWeekDays = event.reminders.repeat?.daysWeek;
      const weekDays = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      eventWeekDays = eventWeekDays!.map((dayName) => {
        return weekDays[dayName];
      });

      const repeatDates = dates.filter((dt) => {
        const newDate = add(event.reminders.start, {
          weeks: frecuency,
        });

        if (newDate.toISOString() == dt.toISOString()) {
          frecuency! += event.reminders.repeat?.frecuency!;

          return dt;
        }
      });
      const newNewDays: Date[] = [];
      repeatDates.forEach((element) => {
        eventWeekDays?.forEach((dayNumber) => {
          const result = (dayNumber - element.getDay() + 7) % 7;
          newNewDays.push(
            new Date(
              element.getFullYear(),
              element.getMonth(),
              element.getDate() + result
            )
          );
        });
      });
      dates = newNewDays;
      dates.push(event.reminders.start);
    }

    if (repeatType == "monthly") {
      let frecuency = event.reminders.repeat?.frecuency;
      const repeatDates = dates.filter((dt) => {
        const newDate = add(event.reminders.start, {
          months: frecuency,
        });

        if (newDate.getTime() == dt.getTime()) {
          frecuency! += event.reminders.repeat?.frecuency!;
          return dt;
        }
      });
      dates = repeatDates;
      dates.push(event.reminders.start);
    }

    if (repeatType == "annually") {
      let frecuency = event.reminders.repeat?.frecuency;
      const repeatDates = dates.filter((dt) => {
        const newDate = add(event.reminders.start, {
          years: frecuency,
        });

        if (newDate.getTime() == dt.getTime()) {
          frecuency! += event.reminders.repeat?.frecuency!;
          return dt;
        }
      });
      dates = repeatDates;
      dates.push(event.reminders.start);
    }

    event.reminders.notifications!.forEach((notification) => {
      dates.forEach((date) => {
        const tr = {
          months: 0,
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
        };

        if (notification == "5mb") tr.minutes = 5;
        if (notification == "10mb") tr.minutes = 10;
        if (notification == "15mb") tr.minutes = 15;
        if (notification == "30mb") tr.minutes = 30;
        if (notification == "1hb") tr.hours = 1;
        if (notification == "1db") tr.days = 1;
        if (notification == "2db") tr.days = 2;
        if (notification == "1wb") tr.weeks = 1;
        if (notification == "1mb") tr.months = 2;

        const result = sub(date, tr);
        // reminders.push(result);
      });
    });
    return reminders;
  }
}
