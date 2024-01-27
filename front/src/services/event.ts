import axios from "axios";
import userService from "./user.vue";

import apolloClient from "../Apollo";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { provideApolloClient } from "@vue/apollo-composable";
provideApolloClient(apolloClient);

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
import {
  executeGrapMutation,
  executeGrapQuery,
  graphqlMutationBuilder,
  graphqlQueryBuilder,
} from "./graphql";
import { errorBuilder } from "@/utils/errors";
import { storage } from "@/main";
import { toRaw } from "vue";
import { cloneDeep, parseInt } from "lodash";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { dbConnection as dbConnectionService } from "@/services/dbService";

export async function createEvent(params: {
  event: Event;
}): Promise<{ id: number }> {
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
    const query = graphqlMutationBuilder({
      name: CREATE_EVENTS,
      fragment: "CreateEvent",
      mutationName: "createEvent",
      inputName: "CreateEventInput",
    });

    const { id } = (
      await executeGrapMutation({
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

export async function updateEvent(params: { event: Event }): Promise<void> {
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
    const query = graphqlMutationBuilder({
      name: UPDATE_EVENTS,
      fragment: "UpdateEvent",
      mutationName: "updateEvent",
      inputName: "UpdateEventInput",
    });

    await executeGrapMutation({
      query,
      input: data,
    });
  } catch (error: any) {
    if (error.message != "Unauthorized")
      throw errorBuilder({ message: error.message, typeError: "authError" });
    throw errorBuilder({ message: error.message });
  }
}

// export async function getEvents(params: GetEvents): Promise<Array<Event>> {
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

// export async function getEvent(id: number) {
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
export async function getEventLocal(params: {
  id: number;
  db: SQLiteDBConnection;
}): Promise<Event> {
  const { db, id } = params;
  const query = `SELECT * FROM Events where id=${id}`;
  try {
    const event = (await db.query(query)).values![0] as Event;
    event.guests = JSON.parse(event.guests as any);
    event.reminders = JSON.parse(event.reminders as any);
    event.reminders.start = new Date(event.reminders.start);
    event.reminders.end = new Date(event.reminders.end);
    event.syncStatus = event.syncStatus == 0 ? false : true;
    return event;
  } catch (error: any) {
    throw new Error(error);
  }
}

export function formatDateTime(date: string | Date, typeFormat: string) {
  if (typeof date == Date()) {
    return format(date as Date, typeFormat);
  }
  return format(new Date(date), typeFormat);
}

export async function getUserCalendars(
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
// export async function removeEvent(id: string | number) {
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

export async function saveLocalEvent(params: { event: Event }): Promise<void> {
  const { event } = params;

  const db = await dbConnectionService();
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
    const eventId = (await db.query(queryEvents, valuesEvent)).values![0].id;

    const valuesReminders = [
      eventId,
      event.reminders.start.toISOString(),
      event.reminders.end.toISOString(),
      JSON.stringify(event.reminders.notifications),
      false,
      event.reminders.repeat?.frecuency,
      event.reminders.repeat?.type,
      JSON.stringify(event.reminders.repeat?.daysWeek ?? []),
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
    await db.query(queryReminders, valuesReminders);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function updateLocalEvent(params: {
  db: SQLiteDBConnection;
  event: Event;
}): Promise<void> {
  const { db, event } = params;
  const eventId = event.id;
  console.log(
    await db.query(`select * from reminders where event_id=${eventId}`)
  );

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

    let queryEvent = `UPDATE Events SET `;

    fieldsEvent.forEach((field, index) => {
      queryEvent += `${field} = ?`;
      if (index < fieldsEvent.length - 1) {
        queryEvent += ", ";
      }
    });
    queryEvent += ` WHERE id="${eventId}"`;
    await db.query(queryEvent, valuesEvent);

    const valuesReminders = [
      event.reminders.start.toISOString(),
      event.reminders.end.toISOString(),
      JSON.stringify(event.reminders.notifications),
      false,
      event.reminders.repeat?.frecuency,
      event.reminders.repeat?.type,
      JSON.stringify(event.reminders.repeat?.daysWeek ?? []),
    ];
    const fieldsReminders = [
      "start",
      "end",
      "notifications",
      "repeat",
      "frecuency",
      "type",
      "daysWeek",
    ];

    let queryReminder = `UPDATE Reminders SET `;

    fieldsReminders.forEach((field, index) => {
      queryReminder += `${field} = ?`;
      if (index < fieldsReminders.length - 1) {
        queryReminder += ", ";
      }
    });
    queryReminder += ` WHERE event_id="${eventId}"`;
    await db.query(queryReminder, valuesReminders);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getEventsLocal(params: {
  db: SQLiteDBConnection;
}): Promise<Array<Event>> {
  const { db } = params;
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

export async function getEvents(params: {
  graphql: Graphql;
}): Promise<Event[] | null> {
  const { refetch = false, name, fragment } = params.graphql;

  try {
    const query = graphqlQueryBuilder({
      name,
      fragment,
      mutationName: "events",
    });

    let response = await executeGrapQuery({
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

export async function getEvent(params: { id: string }): Promise<Event | null> {
  const id = params.id;
  const event = (await storage.get("events")).filter(
    (event: Event) => event.id == id
  );
  return event[0];
}

export async function deleteEvent(params: {
  id: number;
  db: SQLiteDBConnection;
}): Promise<void> {
  const { db, id } = params;
  const queryReminders = `Delete FROM Reminders where event_id=${id}`;
  const queryEvents = `Delete FROM Events where id=${id}`;
  try {
    await db.query(queryReminders);
    await db.query(queryEvents);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function pushEvent(params: { event: Event }): Promise<void> {
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
    const query = graphqlMutationBuilder({
      name: SYNC_EVENTS,
      fragment: "SyncEvents",
      mutationName: "syncEvents",
      inputName: "SyncEventsInput",
    });

    await executeGrapMutation({
      query,
      input: data,
    });
  } catch (error: any) {
    if (error.message != "Unauthorized")
      throw errorBuilder({ message: error.message, typeError: "authError" });
    throw errorBuilder({ message: error.message });
  }
}

export async function removeAllLocalEvents(): Promise<void> {
  await storage.remove("events");
}

export async function deleteEvents(params: {
  db: SQLiteDBConnection;
}): Promise<void> {
  // await storage.remove("events");
  const { db } = params;
  const query = `Delete FROM Events`;
  try {
    await db.query(query);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function deleteReminders(params: {
  db: SQLiteDBConnection;
}): Promise<void> {
  // await storage.remove("events");
  const { db } = params;
  const query = `Delete FROM Reminders`;
  try {
    await db.query(query);
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
export async function deleteEventServer(params: { id: number }): Promise<void> {
  const { id } = params;

  try {
    const query = graphqlMutationBuilder({
      name: DELETE_EVENT,
      fragment: "DeleteEvent",
      mutationName: "deleteEvent",
      inputName: "DeleteEventInput",
    });

    await executeGrapMutation({
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

export function generateEventId(): string {
  return Math.random().toString(36).slice(2, 18);
}

// TODO: remove
export function formatEvent(params: { event: Event }): {
  event: Event;
} {
  const { event } = params;
  // event = toRaw(event);
  event.reminders.start = new Date(event.reminders.start);
  event.reminders.end = new Date(event.reminders.end);
  return { event };
}
