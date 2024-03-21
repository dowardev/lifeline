import axios from "axios";
import userService from "./user.vue";

import apolloClient from "../Apollo";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@vue/apollo-composable";
// import { provideApolloClient } from "@vue/apollo-composable";
// provideApolloClient(apolloClient);

import {
  GetCalendars,
  GetCalendarsResponse,
  Event,
  GetEvents,
  Graphql,
} from "@/utils/interfaces";
import { NewEvent } from "@/utils/interfaces";
import {
  CREATE_EVENTS,
  DELETE_EVENT,
  SYNC_EVENTS,
  UPDATE_EVENTS,
  USER_EVENTS,
} from "@/utils/graphql";
import { errorBuilder } from "@/utils/errors";
import { storage } from "@/main";
import { toRaw } from "vue";
import { cloneDeep, parseInt } from "lodash";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { DBService } from "@/services/dbService";
import { format, formatISO } from "date-fns";
import { GrapQLService } from "./graphql";
import { LocalNotifications } from "@capacitor/local-notifications";

const dbService = new DBService();
const grapService = new GrapQLService();

export class EventService {
  async createEvent(params: { event: Event }): Promise<{ id: number }> {
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
      const query = grapService.graphqlMutationBuilder({
        name: CREATE_EVENTS,
        fragment: "CreateEvent",
        mutationName: "createEvent",
        inputName: "CreateEventInput",
      });

      const { id } = (
        await grapService.executeGrapMutation({
          query,
          input: data,
        })
      ).createEvent;

      return { id };
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  async updateEventServer(params: { event: Event }): Promise<void> {
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
      const query = grapService.graphqlMutationBuilder({
        name: UPDATE_EVENTS,
        fragment: "UpdateEvent",
        mutationName: "updateEvent",
        inputName: "UpdateEventInput",
      });

      await grapService.executeGrapMutation({
        query,
        input: data,
      });
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  //  async  getEvents(params: GetEvents): Promise<Array<Event>> {
  //   const { onResult, onError, result, refetch } = useQuery(
  //     gql`
  //         query events($date: String!) {
  //           events(input:{date:$date}) {
  //             ...${params.graphql.fragment}
  //           }
  //         }
  //         ${params.graphql.name}
  //       `,
  //     { date: params.date },
  //     {
  //       fetchPolicy: "cache-first",
  //     }
  //   );
  //
  //   return new Promise((resolve, reject) => {
  //     const format = (events: any) => {
  //       events.forEach((element: any) => {
  //         element.timeStart = element.time_start;
  //         delete element.time_start;
  //         element.timeEnd = element.time_end;
  //         delete element.time_end;
  //         element.timeZone = element.time_zone;
  //         delete element.time_zone;
  //         element.guests = JSON.parse(element.guests);
  //         element.reminders = JSON.parse(element.reminders);
  //         element.repeats = JSON.parse(element.repeats);
  //         element.tags = JSON.parse(element.tags);
  //       });
  //       return events;
  //     };
  //
  //     if (result.value != undefined && params.graphql.refetch == false) {
  //       const events = JSON.parse(JSON.stringify(result.value.events.events));
  //       resolve(format(events));
  //     }
  //
  //     if (params.graphql.refetch) {
  //       refetch()?.then((response) => resolve(response.data.events.events));
  //     }
  //
  //     onResult((response) => {
  //       const events = JSON.parse(JSON.stringify(response.data.events.events));
  //       resolve(format(events));
  //     });
  //
  //     onError((error) => {
  //       reject(error);
  //     });
  //   });
  // }

  //  async  getEvent(id: number) {
  // const token = await userService()
  //   .getUserToken()
  //   .then((response) => {
  //     return response;
  //   });
  // return axios.post(
  //   "http://localhost:8000/api/auth/get-event",
  //   { id },
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + token,
  //     },
  //   }
  // );
  // }
  async getEventLocal(params: { id: number }): Promise<Event> {
    const { id } = params;

    const query = `SELECT * FROM Events inner join Reminders on events.id = reminders.event_id where events.id=${id}`;
    try {
      const result = (await dbService.executeQuery({ query }))
        .values![0] as any;
      console.log(result);
      const event = {
        id: result.id,
        name: result.name,
        guests: JSON.parse(result.guests as any),
        reminders: {
          start: new Date(result.start),
          end: new Date(result.end),
          notifications: JSON.parse(result.notifications),
          repeat: {
            frecuency: result.frecuency,
            type: result.type,
            daysWeek: JSON.parse(result.daysWeek),
          },
          idReminders: JSON.parse(result.id_reminders ?? []),
        },
        timezone: result.timezone,
        description: result.description,
        availability: result.availability,
        idSync: result.idSync,
        syncStatus: result.syncStatus == 0 ? false : true,
        status: result.status,
      };
      return event;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  formatDateTime(date: string | Date, typeFormat: string) {
    if (typeof date == Date()) {
      return format(date as Date, typeFormat);
    }
    return format(new Date(date), typeFormat);
  }

  async getUserCalendars(
    params: GetCalendars
  ): Promise<Array<GetCalendarsResponse>> {
    const { onError, onResult, result } = useQuery(
      gql`
      query calendars {
        userAuth{
         ...${params.graphql.fragment}
        }
      }
      ${params.graphql.name}
    `
    );

    return new Promise((resolve, reject) => {
      if (result.value && result.value.calendars.user != undefined)
        resolve([result.value.calendars.calendars]);
      else {
        onResult((response) => resolve(response.data.userAuth.calendars));
      }

      onError((error) => {
        reject(error);
      });
    });
  }
  //  async  removeEvent(id: string | number) {
  // const token = await userService()
  //   .getUserToken()
  //   .then((response) => {
  //     return response;
  //   });
  // return axios.post(
  //   "http://localhost:8000/api/auth/remove-event",
  //   { id },
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + token,
  //     },
  //   }
  // );
  // }

  async saveLocalEvent(params: { event: Event }): Promise<void> {
    const { event } = params;

    try {
      const valuesEvent = [
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
        "availability",
        "description",
        "guests",
        "idSync",
        "name",
        "syncStatus",
        "timezone",
        "status",
      ];

      let queryEvents = `
        INSERT INTO Events(
       ${fieldsEvent.join(", ")}
     )
     
   `;
      queryEvents += `values (`;
      for (let index = 0; index < valuesEvent.length; index++) {
        if (index < fieldsEvent.length - 1) queryEvents += "?, ";
        else queryEvents += "? ";
      }
      queryEvents += `)RETURNING "Id"`;
      const eventId = (
        await dbService.executeQuery({
          query: queryEvents,
          values: valuesEvent,
        })
      ).values![0].id;

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

      let queryReminders = `
        INSERT INTO Reminders(
       ${fieldsReminders.join(", ")}
     )
   `;

      queryReminders += `values (`;
      for (let index = 0; index < valuesReminders.length; index++) {
        if (index < fieldsReminders.length - 1) queryReminders += "?, ";
        else queryReminders += "? ";
      }
      queryReminders += `)`;
      await dbService.executeQuery({
        query: queryReminders,
        values: valuesReminders,
      });
      // console.log(await this.getEventsLocal());
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async updateLocalEvent(params: {
    availability?: string;
    daysWeek?: string[];
    description?: string;
    end?: Date;
    frecuency?: number;
    guests?: Array<{ email: string }>;
    id: number;
    idReminders?: number[];
    idSync: number;
    name?: string;
    notifications?: string[];
    start?: Date;
    status?: string;
    syncStatus: boolean;
    timezone?: string;
    type?: "daily" | "weekly" | "monthly" | "annually";
  }): Promise<void> {
    const {
      availability,
      description,
      guests,
      idSync,
      name,
      syncStatus,
      timezone,
      status,
      start,
      end,
      notifications,
      frecuency,
      type,
      daysWeek,
      idReminders,
      id,
    } = params;

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
      await dbService.executeQuery({
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
      if (notifications) {
        valuesReminders.push(JSON.stringify(notifications));
        fieldsReminders.push("notifications");
      }
      if (frecuency) {
        valuesReminders.push(frecuency);
        fieldsReminders.push("frecuency");
      }
      if (type) {
        valuesReminders.push(type);
        fieldsReminders.push("type");
      }
      if (daysWeek) {
        valuesReminders.push(JSON.stringify(daysWeek ?? []));
        fieldsReminders.push("daysWeek");
      }
      if (idReminders) {
        valuesReminders.push(JSON.stringify(idReminders ?? []));
        fieldsReminders.push("idReminders");
      }

      let queryReminder = `UPDATE Reminders SET `;

      fieldsReminders.forEach((field, index) => {
        queryReminder += `${field} = ?`;
        if (index < fieldsReminders.length - 1) {
          queryReminder += ", ";
        }
      });
      queryReminder += ` WHERE event_id="${eventId}"`;
      await dbService.executeQuery({
        query: queryReminder,
        values: valuesReminders,
      });
      // console.log((await this.getEventsLocal())[0].reminders.idReminders);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getEventsLocal(): Promise<Array<Event>> {
    const db = await dbService.dbConnection();
    if ((await db.isDBOpen()).result == false) await db.open();

    const query = `SELECT * FROM Events inner join Reminders on events.id = reminders.event_id`;
    try {
      const result = (await db.query(query)).values as any[];
      const events: Event[] = [];

      result.forEach((event: any) => {
        events.push({
          id: event.id,
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

  async getEvents(params: { graphql: Graphql }): Promise<Event[] | null> {
    const { refetch = false, name, fragment } = params.graphql;

    try {
      const query = grapService.graphqlQueryBuilder({
        name,
        fragment,
        mutationName: "events",
      });

      let response = await grapService.executeGrapQuery({
        query,
        options: { refetch },
      });
      if (!response.value.events.events) return [] as Event[];
      response = (response.value.events.events as any[]).map((event: any) => {
        return {
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
          },
          availability: event.availability,
          syncStatus: true,
          status: "active",
        };
      });
      return response;
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  async getEvent(params: { id: string }): Promise<Event | null> {
    const id = params.id;
    const event = (await storage.get("events")).filter(
      (event: Event) => event.id == id
    );
    return event[0];
  }

  async deleteEvent(params: { id: number }): Promise<void> {
    const { id } = params;
    const queryReminders = `Delete FROM Reminders where event_id=${id}`;
    const queryEvents = `Delete FROM Events where id=${id}`;
    const db = await dbService.dbConnection();

    if ((await db.isDBOpen()).result == false) await db.open();

    try {
      await db.query(queryReminders);
      await db.query(queryEvents);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async pushEvent(params: { event: Event }): Promise<void> {
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
      const query = grapService.graphqlMutationBuilder({
        name: SYNC_EVENTS,
        fragment: "SyncEvents",
        mutationName: "syncEvents",
        inputName: "SyncEventsInput",
      });

      await grapService.executeGrapMutation({
        query,
        input: data,
      });
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  async removeAllLocalEvents(): Promise<void> {
    await storage.remove("events");
  }

  async deleteEvents(): Promise<void> {
    // await storage.remove("events");
    const query = `Delete FROM Events`;
    try {
      const db = await dbService.dbConnection();
      if ((await db.isDBOpen()).result == false) await db.open();
      await db.query(query);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async deleteReminders(): Promise<void> {
    // await storage.remove("events");
    const query = `Delete FROM Reminders`;
    try {
      await dbService.executeQuery({ query });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  /**
   * Delete event on the server
   *
   * @param {Object} params
   * @param {Number} params.id id of the event on the server (idSync)
   * @returns {Promise<void>}
   */
  async deleteEventServer(params: { id: number }): Promise<void> {
    const { id } = params;

    try {
      const query = grapService.graphqlMutationBuilder({
        name: DELETE_EVENT,
        fragment: "DeleteEvent",
        mutationName: "deleteEvent",
        inputName: "DeleteEventInput",
      });

      await grapService.executeGrapMutation({
        query,
        input: { id },
      });
    } catch (error: any) {
      if (error.message == "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      if (error.message == "NetworkError when attempting to fetch resource.")
        throw errorBuilder({
          message: "No internet connection",
          typeError: "system",
        });
      throw errorBuilder({ message: error.message });
    }
  }

  generateEventId(): string {
    return Math.random().toString(36).slice(2, 18);
  }

  // TODO: remove
  formatEvent(params: { event: Event }): {
    event: Event;
  } {
    const { event } = params;
    // event = toRaw(event);
    event.reminders.start = new Date(event.reminders.start);
    event.reminders.end = new Date(event.reminders.end);
    return { event };
  }

  async getEventsLocalByDate(params: {
    dates: { start: Date; end: Date };
  }): Promise<Array<Event>> {
    const { dates } = params;
    const dateStart = format(dates.start, "yyyy-MM-dd HH:mm:ss");
    const dateEnd = format(dates.end, "yyyy-MM-dd HH:mm:ss");

    const query = `SELECT * FROM Events inner join Reminders on events.id = reminders.event_id
                    WHERE reminders.start>='${dateStart}' or reminders.end<='${dateEnd}'`;
    try {
      const result = (await dbService.executeQuery({ query })).values as any[];
      const events: Event[] = [];

      result.forEach((event: any) => {
        events.push({
          id: event.id,
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
}
