import { SystemController } from "./systemController";
import { CalendarViewDates, Event, Graphql } from "@/utils/interfaces";
import { useEventsStore } from "../store/eventsStore";
import {
  CREATE_EVENTS,
  SYNC_EVENTS,
  UPDATE_EVENTS,
  USER_EVENTS,
} from "@/utils/graphql";
import { SQLite } from "@/js/sqlite";
import lodash from "lodash";
import { storage } from "@/main";
import { ViewCalendar, ViewMode } from "@/utils/types";
import { EventService } from "@/services/event";
import { ReminderController } from "./reminderController";
import { CalendarController } from "./calendarController";
import { endOfMonth, format, startOfMonth } from "date-fns";
import messages from "../utils/messages.json";
import { ApiController } from "./apiController";

// services
import { DB } from "./db";
import { TokenController } from "./tokenController";
import { UserController } from "./userController";

export class EventController {
  dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  // private eventService = new EventService();
  private calendarController = new CalendarController();
  apiController = new ApiController();

  // stores
  private eventStore = useEventsStore();

  /**
   * Perform all the necessary procedure to add a event both generally, locally and from the store
   *
   * @param {Object} params
   * @param {Event} params.event event
   *
   * @returns {Promise<void>}
   */
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
    const data = {
      id: event.idSync ?? "",
      name: event.name,
      dateStart: event.reminders.start,
      dateEnd: event.reminders.end,
      notifications: JSON.stringify(event.reminders.notifications),
      repeat: JSON.stringify(event.reminders.repeat),
      guests: JSON.stringify(event.guests),
      timeZone: event.timezone,
      description: event.description,
      availability: event.availability,
      syncStatus: event.syncStatus ?? false,
    };

    try {
      const apiController = new ApiController();
      const query = apiController.graphqlMutationBuilder({
        name: SYNC_EVENTS,
        fragment: "SyncEvents",
        mutationName: "syncEvents",
        inputName: "SyncEventsInput",
      });

      await apiController.executeGrapMutatation({
        query,
        input: data,
      });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Get all events from sqlite
   *
   * @returns {Promise<Event[]>}
   */
  // Temporarily disabled
  // async getStoredEvents(params: {
  //   filterType: "none" | "date";
  //   dates?: { start: Date; end: Date } | undefined;
  // }): Promise<Array<Event>> {
  //   const { filterType, dates } = params;
  //
  //   try {
  //     let events: Event[] = [];
  //
  //     if (filterType == "none") events = await this.getEventsLocal();
  //
  //     if (filterType == "date") {
  //       if (dates == undefined) throw new Error("Required dates");
  //       events = await this.getEventsLocalByDate({
  //         dates: dates as any,
  //       });
  //     }
  //     return events;
  //   } catch (error: any) {
  //     throw new Error(error);
  //   }
  // }

  async storeEventServer(params: { userId: number }): Promise<void> {
    const { userId } = params;
    const eventsStored =
      (await this.getUserLoggedStoredEvents({ filterType: "none", userId })) ??
      [];
    const eventsServer = (await this.getUserLoggedEventsServer()) ?? [];

    for (const event of eventsServer) {
      const result = eventsStored?.filter(
        (eventF) => eventF.idSync == event.idSync,
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
    userId: string;
  }): Promise<Event[]> {
    const { events: serverEvents, userId } = params;
    const localEvents = (
      (await this.getUserLoggedStoredEvents({ filterType: "none", userId })) ??
      []
    ).filter((event) => event.idSync! >= 0);

    const sharedIds = lodash.filter(serverEvents, (event) =>
      lodash.some(
        localEvents,
        (otherEvent) => event.idSync === otherEvent.idSync,
      ),
    );

    const newArray: Event[] = [];

    lodash.forEach(sharedIds, (event) => {
      const found = lodash.find(
        localEvents,
        (element) => element.idSync == event.idSync,
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
                event.reminders.start.getHours(),
              ) ||
              !lodash.isEqual(
                element.reminders.start.getMinutes(),
                event.reminders.start.getMinutes(),
              )
            ) {
              differences++;
            }
            if (
              !lodash.isEqual(
                element.reminders.end.getHours(),
                event.reminders.end.getHours(),
              ) ||
              !lodash.isEqual(
                element.reminders.end.getMinutes(),
                event.reminders.end.getMinutes(),
              )
            ) {
              differences++;
            }
            if (
              !lodash.isEqual(
                element.reminders.notifications,
                event.reminders.notifications,
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
    const eventsServer = (await this.getUserLoggedEventsServer()) ?? [];

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
  async pushNewEvent(params: {
    event: Event;
  }): Promise<{ id: number } | undefined> {
    const { event } = params;
    const data = {
      name: event.name,
      dateStart: event.reminders.start,
      dateEnd: event.reminders.end,
      notifications: JSON.stringify(event.reminders.notifications),
      repeat: JSON.stringify(event.reminders.repeat),
      guests: JSON.stringify(event.guests),
      timeZone: event.timezone,
      description: event.description,
      availability: event.availability,
      syncStatus: event.syncStatus ?? false,
    };

    try {
      const query = this.apiController.graphqlMutationBuilder({
        name: CREATE_EVENTS,
        fragment: "CreateEvent",
        mutationName: "createEvent",
        inputName: "CreateEventInput",
      });

      const id = (
        await this.apiController.executeGrapMutatation({
          query,
          input: data,
        })
      ).createEvent.id as number;
      return { id };
    } catch (error) {
      console.error(error);
    }
  }

  async pushUserLoggedEventsUpdated(params: { userId: number }): Promise<void> {
    const { userId } = params;
    try {
    } catch (error) {
      console.error(error);
    }
    const events = await this.getUserStoredEvents({
      filterType: "none",
      userId,
    });

    const result = events.filter(
      (event) => event.idSync != null && event.syncStatus == false,
    );

    try {
      await Promise.all(
        result.map(async (event) => {
          await this.updateUserLoggedEventServer({ event });
        }),
      );
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async pusUpdateEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    try {
      await this.updateUserLoggedEventServer({ event });
    } catch (error) {
      console.error(error);
    }
  }

  async removeAllEvents(): Promise<void> {
    await storage.remove("events");
  }

  // async sync(): Promise<void> {
  //   try {
  //     await this.pushEventsUpdated();
  //     await this.syncEventsFromServer();
  //     await this.deleteInativeEventOnServer();
  //   } catch (error: any) {
  //     throw error;
  //   }
  // }

  // async syncAction(): Promise<void> {
  //   const mode = await this.getViewCalendarStored();
  //   const dates = {
  //     start: new Date(
  //       startOfMonth(this.calendarController.getCurrentDate({ mode })),
  //     ),
  //     end: new Date(
  //       endOfMonth(this.calendarController.getCurrentDate({ mode })),
  //     ),
  //   };
  //
  //   try {
  //     await this.sync();
  //   } catch (error: any) {
  //     throw error;
  //   }
  // }

  async deleteEvents(): Promise<void> {
    const query = `Delete FROM Events`;
    try {
      await this.dbc.deleteData({
        query: query,
      });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async deleteReminders(): Promise<void> {
    const query = `Delete FROM Reminders`;
    try {
      await this.dbc.deleteData({ query });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async updateLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    const {
      availability,
      description,
      guests,
      id,
      idSync,
      name,
      status,
      syncStatus,
      timezone,
    } = event;
    const { start, end } = event.reminders;
    const { daysWeek } = event.reminders.repeat!;
    const eventId = id;

    try {
      const valuesEvent = [];
      const fieldsEvent = [];

      if (availability) {
        valuesEvent.push(availability);
        fieldsEvent.push("availability");
      }
      if (description) {
        valuesEvent.push(description);
        fieldsEvent.push("description");
      }
      if (guests) {
        valuesEvent.push(JSON.stringify(guests));
        fieldsEvent.push("guests");
      }
      if (idSync) {
        valuesEvent.push(idSync);
        fieldsEvent.push("idSync");
      }
      if (name) {
        valuesEvent.push(name);
        fieldsEvent.push("name");
      }
      if (syncStatus) {
        valuesEvent.push(syncStatus);
        fieldsEvent.push("syncStatus");
      }
      if (timezone) {
        valuesEvent.push(timezone);
        fieldsEvent.push("timezone");
      }
      if (status) {
        valuesEvent.push(status);
        fieldsEvent.push("status");
      }

      let queryEvent = `UPDATE Events SET `;

      fieldsEvent.forEach((field, index) => {
        queryEvent += `${field} = ?`;
        if (index < fieldsEvent.length - 1) {
          queryEvent += ", ";
        }
      });
      queryEvent += ` WHERE id="${eventId}"`;
      await this.dbc.updateData({
        query: queryEvent,
        values: valuesEvent,
      });

      const valuesReminders = [];
      const fieldsReminders = [];

      if (start) {
        valuesReminders.push(start.toISOString());
        fieldsReminders.push("start");
      }
      if (end) {
        valuesReminders.push(end.toISOString());
        fieldsReminders.push("end");
      }
      // if (notifications) {
      //   valuesReminders.push(JSON.stringify(notifications));
      //   fieldsReminders.push("notifications");
      // }
      // if (frecuency) {
      //   valuesReminders.push(frecuency);
      //   fieldsReminders.push("frecuency");
      // }
      // if (type) {
      //   valuesReminders.push(type);
      //   fieldsReminders.push("type");
      // }
      if (daysWeek) {
        valuesReminders.push(JSON.stringify(daysWeek ?? []));
        fieldsReminders.push("daysWeek");
      }
      // if (idReminders) {
      //   valuesReminders.push(JSON.stringify(idReminders ?? []));
      //   fieldsReminders.push("idReminders");
      // }

      let queryReminder = `UPDATE Reminders SET `;

      fieldsReminders.forEach((field, index) => {
        queryReminder += `${field} = ?`;
        if (index < fieldsReminders.length - 1) {
          queryReminder += ", ";
        }
      });
      queryReminder += ` WHERE event_id="${eventId}"`;
      await this.dbc.updateData({
        query: queryReminder,
        values: valuesReminders,
      });
      // console.log((await this.getEventsLocal())[0].reminders.idReminders);
    } catch (error: any) {
      throw new Error(error);
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

  async removeEventServer(params: { id: number }): Promise<void> {
    const { id } = params;
    const apiController = new ApiController();

    try {
      const qr = apiController.getQuery({ name: "DELETE_EVENT" });

      const query = apiController.graphqlMutationBuilder({
        name: qr,
        fragment: "DeleteEvent",
        mutationName: "deleteEvent",
        inputName: "DeleteEventInput",
      });

      await apiController.executeGrapMutatation({
        query,
        input: { id },
      });
    } catch (error: any) {
      throw error;
    }
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
    // const db = await this.dbService.dbConnection();

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
        // const event = await this.getEventLocal({ db, id });
        // event.status = "inactive";
        // const { event: eventFormated } = this.eventService.formatEvent({
        //   event,
        // });
        // await this.updateLocalEvent({ event: eventFormated });
      } catch (error: any) {
        throw new Error(error);
      }
    }
    // await db.close();
  }

  // async createTableEvents(): Promise<void> {
  //   // const query = `CREATE TABLE IF NOT EXISTS Events
  //   // (
  //   //   id INTEGER PRIMARY KEY AUTOINCREMENT,
  //   //   name TEXT,
  //   //   guests TEXT,
  //   //   timezone TEXT,
  //   //   description TEXT,
  //   //   availability TEXT,
  //   //   idSync INT,
  //   //   syncStatus BOOLEAN,
  //   //   status TEXT
  //   // );`;
  //   const query = `CREATE TABLE IF NOT EXISTS Events
  //   (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT,
  //     guests TEXT,
  //     timezone TEXT,
  //     description TEXT,
  //     availability TEXT,
  //     idSync INT,
  //     syncStatus BOOLEAN,
  //     status TEXT,
  //     UNIQUE(idSync)
  //   );`;
  //   await this.dbc.createTable({ query });
  // }

  // async createTableReminders(): Promise<void> {
  //   const query = `CREATE TABLE IF NOT EXISTS Reminders (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     event_id INTEGER REFERENCES EVENTS(id),
  //     start TEXT,
  //     end TEXT,
  //     notifications TEXT NULL,
  //     repeat Boolean NULL,
  //     frecuency INT NULL,
  //     type TEXT NULL,
  //     daysWeek TEXT NULL,
  //     id_reminders TEXT NULL
  //   );`;
  //   await this.dbc.createTable({ query });
  // }

  async saveLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;
    const userId = this.userStore.user.id;
    event.reminders.start = new Date(event.reminders.start);
    event.reminders.end = new Date(event.reminders.end);
    event.idSync = null;
    event.status = "active";
    event.syncStatus = false;

    try {
      event.syncStatus = true;
      const valuesEvent = [
        userId,
        event.availability,
        event.description,
        JSON.stringify(event.guests),
        event.idSync,
        event.name,
        event.syncStatus,
        event.timezone,
        event.status,
      ];

      const fieldsEvent = [
        "user_id",
        "availability",
        "description",
        "guests",
        "idSync",
        "name",
        "syncStatus",
        "timezone",
        "status",
      ];
      const eventId = (
        await this.dbc.insertData({
          fields: fieldsEvent,
          values: valuesEvent,
          tableName: "Events",
        })
      ).id;

      // reminders
      const valuesReminders = [
        eventId,
        event.reminders.start
          .toISOString()
          .replace(/T/, " ")
          .replace(/\..+/, "") + "Z",
        event.reminders.end
          .toISOString()
          .replace(/T/, " ")
          .replace(/\..+/, "") + "Z",
        JSON.stringify(event.reminders.notifications),
        false,
        event.reminders.repeat?.frecuency,
        event.reminders.repeat?.type,
        JSON.stringify(event.reminders.repeat?.daysWeek ?? []),
        JSON.stringify(event.reminders.idReminders ?? []),
      ];
      const fieldsReminders = [
        "event_id",
        "start",
        "end",
        "notifications",
        "repeat",
        "frecuency",
        "type",
        "daysWeek",
        "id_reminders",
      ];

      await this.dbc.insertData({
        fields: fieldsReminders,
        values: valuesReminders,
        tableName: "Reminders",
      });
      await this.dbc.getData({ query: "SELECT * FROM Reminders" });
    } catch (error: any) {
      throw error;
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
    const queryReminders = `Delete FROM Reminders where event_id=${id}`;
    const queryEvents = `Delete FROM Events where id=${id}`;

    try {
      await this.dbc.deleteData({ query: queryReminders });
      await this.dbc.deleteData({ query: queryEvents });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async deleteUserLoggedInativeEventOnServer(): Promise<void> {
    const localEvents = await this.getUserLoggedStoredEvents({
      filterType: "none",
      userId: this.userStore.user.id,
    });
    const events = localEvents.filter((event) => event.status == "inactive");
    await Promise.all(
      events.map(async (event) => {
        await this.removeEventServer({
          id: event.idSync as number,
        });
      }),
    );
  }

  async getCurrentDateStored(params: { mode: ViewCalendar }): Promise<Date> {
    const { mode } = params;
    let dates = JSON.parse(
      await storage.get("calendarViewDates"),
    ) as CalendarViewDates;

    if (!dates) {
      dates = {
        day: new Date(),
        diary: new Date(),
        month: new Date(),
        week: new Date(),
        year: new Date(),
      };
    }
    return new Date(dates[mode]) ?? new Date();
  }

  async getCurrentDatesStored(): Promise<CalendarViewDates> {
    let dates = JSON.parse(
      await storage.get("calendarViewDates"),
    ) as CalendarViewDates;

    if (!dates) {
      dates = {
        day: new Date(),
        diary: new Date(),
        month: new Date(),
        week: new Date(),
        year: new Date(),
      };
    }
    dates.day = new Date(dates.day);
    dates.diary = new Date(dates.diary);
    dates.month = new Date(dates.month);
    dates.week = new Date(dates.week);
    dates.year = new Date(dates.year);

    return dates;
  }

  async getViewCalendarStored(): Promise<ViewCalendar> {
    return (await storage.get("viewCalendar")) ?? "week";
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
    frecuency: number;
    reminderEnd: Date;
    reminderStart: Date;
    repeatType: "daily" | "weekly" | "monthly" | "annually";
    daysWeek: string[];
    notifications: string[];
    description: string;
    name: string;
  }): Promise<{ remindersId: number[] }> {
    const {
      daysWeek,
      description,
      frecuency,
      name,
      notifications,
      reminderEnd,
      reminderStart,
      repeatType,
    } = params;
    const remindersController = new ReminderController();
    const dates = remindersController.generatorReminder({
      frecuency,
      reminderEnd,
      reminderStart,
      repeat: repeatType,
      daysWeek,
      notifications,
    });
    const remindersId: number[] = [];

    for (let index = 0; index < dates.length; index++) {
      const date = dates[index];
      const { reminderId } = await remindersController.setReminder({
        reminder: date,
        extraInfo: "",
        message: description,
        title: name,
      });
      remindersId.push(reminderId);
    }
    return { remindersId };
  }

  async discardEventReminders(params: {
    idReminders: number[];
  }): Promise<void> {
    const { idReminders } = params;
    const remindersController = new ReminderController();

    for (let index = 0; index < idReminders.length; index++) {
      const id = idReminders[index];
      // console.log({ deleted: id });
      try {
        await remindersController.cancelReminder({ id });
      } catch (error: any) {
        throw new Error(error);
      }
    }

    event.reminders.idReminders = [];
    await this.updateLocalEvent({ event });
  }

  countEvents(params: { date: Date }): number {
    const { date } = params;
    const events = this.getEvents();
    const count = events.filter(
      (event) => event.reminders.start.getDate() == date.getDate(),
    ).length;
    return count;
  }

  private async getEventsFromDB(): Promise<Array<Event>> {
    const query = `SELECT * FROM Events inner join Reminders on events.id = reminders.event_id`;

    try {
      const result = await this.dbc.getData({ query });
      const events: Event[] = [];

      result.forEach((event: any) => {
        events.push({
          id: event.id,
          userId: event.user_id,
          name: event.name,
          guests: JSON.parse(event.guests as any),
          reminders: {
            start: new Date(event.start),
            end: new Date(event.end),
            notifications: JSON.parse(event.notifications),
            repeat: {
              frecuency: event.frecuency,
              type: event.type,
              daysWeek: JSON.parse(event.daysWeek),
            },
            idReminders: JSON.parse(event.id_reminders ?? []),
          },
          timezone: event.timezone,
          description: event.description,
          availability: event.availability,
          idSync: event.idSync,
          syncStatus: event.syncStatus == 0 ? false : true,
          status: event.status,
        });
      });
      return events;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  private async getEventsLocalByDate(params: {
    dates: { start: Date; end: Date };
  }): Promise<Array<Event>> {
    const { dates } = params;
    const dateStart = format(dates.start, "yyyy-MM-dd HH:mm:ss");
    const dateEnd = format(dates.end, "yyyy-MM-dd HH:mm:ss");

    const query = `SELECT * FROM Events inner join Reminders on events.id = reminders.event_id
                    WHERE reminders.start>='${dateStart}' or reminders.end<='${dateEnd}'`;
    try {
      const result = await this.dbc.getData({ query });
      const events: Event[] = [];

      result.forEach((event: any) => {
        events.push({
          id: event.id,
          userId: event.user_id,
          name: event.name,
          guests: JSON.parse(event.guests as any),
          reminders: {
            start: new Date(event.start),
            end: new Date(event.end),
            notifications: JSON.parse(event.notifications),
            repeat: {
              frecuency: event.frecuency,
              type: event.type,
              daysWeek: JSON.parse(event.daysWeek),
            },
            idReminders: JSON.parse(event.id_reminders ?? []),
          },
          timezone: event.timezone,
          description: event.description,
          availability: event.availability,
          idSync: event.idSync,
          syncStatus: event.syncStatus == 0 ? false : true,
          status: event.status,
        });
      });
      return events;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getUserLoggedEventsServer(params: {
    userId: number;
  }): Promise<Event[] | undefined> {
    const { userId } = params;
    const apiController = new ApiController();
    const tokenController = new TokenController();

    try {
      const userToken = await tokenController.getUserToken({
        name: "auth_token",
        userId,
      });
      const qr = apiController.getQuery({ name: "USER_EVENTS" });
      const query = apiController.graphqlQueryBuilder({
        name: qr,
        fragment: "Events",
        mutationName: "events",
      });

      const response = await apiController.executeGrapQuery({
        query,
        options: { refetch: true },
        token: userToken,
      });
      if (!response.value.events.events) return [] as Event[];
      return (response.value.events.events as any[]).map((event: any) => {
        return {
          userId,
          idsync: event.id,
          description: event.description,
          guests: JSON.parse(event.guests),
          idSync: parseInt(event.id),
          timezone: event.time_zone,
          name: event.title,
          reminders: {
            start: new Date(event.date_start),
            end: new Date(event.date_end),
            repeat: {
              frecuency: JSON.parse(event.repeat).frecuency,
              type: JSON.parse(event.repeat).type,
              daysWeek: JSON.parse(event.repeat).daysWeek ?? [],
            },
            notifications: JSON.parse(event.notifications) ?? [],
            idReminders: [],
          },
          availability: event.availability,
          syncStatus: true,
          status: "active",
        };
      }) as Event[];
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }

  async updateUserLoggedEventServer(params: { event: Event }): Promise<void> {
    const { event } = params;
    const data = {
      id: event.idSync,
      name: event.name,
      dateStart: event.reminders.start,
      dateEnd: event.reminders.end,
      notifications: JSON.stringify(event.reminders.notifications),
      repeat: JSON.stringify(event.reminders.repeat),
      guests: JSON.stringify(event.guests),
      timeZone: event.timezone,
      description: event.description,
      availability: event.availability,
      syncStatus: event.syncStatus ?? false,
    };

    try {
      const query = this.apiController.graphqlMutationBuilder({
        name: UPDATE_EVENTS,
        fragment: "UpdateEvent",
        mutationName: "updateEvent",
        inputName: "UpdateEventInput",
      });

      await this.apiController.executeGrapMutatation({
        query,
        input: data,
      });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }

  async deleteUserEvents(params: { userId: string }): Promise<void> {
    const { userId } = params;

    const query = `Delete FROM Events WHERE userId='${userId}'`;
    // const query = `Delete FROM Events`;
    try {
      await this.dbc.deleteData({ query });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Adds an event to the event store.
   *
   * @param {Object} params - The parameters for adding an event.
   * @param {Event} params.event - The event to add to the store.
   */
  addEventToStore(params: { event: Event }): void {
    const { event } = params;
    this.eventStore.addEvent({ event });
  }

  /**
   * This function retrieves user events stored locally. The events can be filtered by date or not filtered at all.
   *
   * @param params - An object containing the following properties:
   * @param params.filterType - The type of filter to apply. It can be "none" for no filtering or "date" to filter by date. Default is "none".
   * @param params.dates - An object containing the start and end dates for the filter. This is required if filterType is "date".
   * @param params.userId - The ID of the user whose events are to be retrieved.
   *
   * @returns A promise that resolves to an array of Event objects.
   *
   * @throws Will throw an error if filterType is "date" but dates is undefined.
   */
  async getUserStoredEvents(params: {
    filterType?: "none" | "date";
    dates?: { start: Date; end: Date } | undefined;
    userId: number;
  }): Promise<Array<Event>> {
    const { filterType = "none", dates, userId } = params;

    try {
      let events: Event[] = [];

      if (filterType == "none") events = await this.getEventsFromDB();

      if (filterType == "date") {
        if (dates == undefined) throw new Error("Required dates");
        events = await this.getEventsLocalByDate({
          dates: dates as any,
        });
      }

      events = events.filter((event) => event.userId == userId);
      return events;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
