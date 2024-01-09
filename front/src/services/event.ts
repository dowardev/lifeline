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

export async function createEvent(params: {
  event: Event;
}): Promise<{ id: string }> {
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

export async function saveLocalEvent(params: {
  db: SQLiteDBConnection;
  fields: any[];
  values: any[];
}): Promise<void> {
  const { fields, values, db } = params;
  try {
    let query = `
     INSERT INTO Events(
       ${fields.join(", ")}
     )
     
   `;
    query += `values (`;
    for (let index = 0; index < values.length; index++) {
      if (index < fields.length - 1) query += "?, ";
      else query += "? ";
    }
    query += `)`;
    await db.query(query, values);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function updateLocalEvent(params: {
  db: SQLiteDBConnection;
  fields: any[];
  values: any[];
  id: number;
}): Promise<void> {
  const { values, db, id, fields } = params;

  try {
    let query = `UPDATE Events SET `;

    fields.forEach((field, index) => {
      query += `${field} = ?`;
      if (index < fields.length - 1) {
        query += ", ";
      }
    });
    query += ` WHERE id="${id}"`;
    await db.query(query, values);
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getEventsLocal(params: {
  db: SQLiteDBConnection;
}): Promise<Array<Event>> {
  const { db } = params;
  const query = `SELECT * FROM Events`;
  try {
    const events = (await db.query(query)).values as Event[];
    return events.map((event) => {
      event.guests = JSON.parse(event.guests as any);
      event.reminders = JSON.parse(event.reminders as any);
      event.reminders.start = new Date(event.reminders.start);
      event.reminders.end = new Date(event.reminders.end);
      event.syncStatus = event.syncStatus == 0 ? false : true;
      return event;
    });
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
          repeat: JSON.parse(event.repeat),
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
  const query = `Delete FROM Events where id=${id}`;
  try {
    await db.query(query);
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

export function formatEvent(params: { event: Event }): {
  event: Event;
} {
  const { event } = params;
  // event = toRaw(event);
  event.reminders.start = new Date(event.reminders.start);
  event.reminders.end = new Date(event.reminders.end);
  return { event };
}
