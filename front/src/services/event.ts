import axios from "axios";
import userService from "./user.vue";
import { Storage } from "@ionic/storage";
import { format } from "date-fns";

const store = new Storage();
store.create();

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

export async function createEvent(params: {
  event: Event;
}): Promise<{ id: string }> {
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
export async function getEventLocal(id: number) {
  const events = await storage.get("events");

  const event = (JSON.parse(events) as Array<any>).filter(
    (element) => parseInt(element["id" as any]) == id
  );

  return event;
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
  event: Event;
}): Promise<{ id: string }> {
  const eventData = params.event;
  let event = {} as Event;
  const id = Date.now().toString();

  (eventData as Event).id = "";
  event = eventData as Event;
  event.id = id;

  const events = (await getEventsLocal()) ?? [];
  events?.push(eventData as Event);
  await store.set("events", events);

  return { id };
}

export async function updateLocalEvent(params: {
  event: Event;
}): Promise<void> {
  const eventData = params.event;
  let events = (await getEventsLocal()) ?? [];
  events = events?.map((event) => {
    if (event.id == eventData.id || event.idSync == eventData.idSync)
      event = eventData;
    return event;
  });
  await store.set("events", events);
}

export async function getEventsLocal(): Promise<Array<Event> | null> {
  return await store.get("events");
}

export async function getEvents(params: {
  graphql: Graphql;
}): Promise<Array<Event> | null> {
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
        idSync: event.id,
        tags: JSON.parse(event.tags),
        timezone: event.time_zone,
        name: event.title,
        reminders: {
          start: event.date_start,
          end: event.date_end,
          repeat: JSON.parse(event.repeat),
          notifications: JSON.parse(event.notifications) ?? [],
        },
        availability: event.availability,
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
  const event = (await store.get("events")).filter(
    (event: Event) => event.id == id
  );
  return event[0];
}

export async function deleteEvent(params: { eventId: string }): Promise<void> {
  const id = params.eventId;
  const events = (await getEventsLocal()) ?? [];

  const index = events?.findIndex((element) => element.id == id);
  if (index != undefined) {
    events?.splice(index, 1);
    await store.set("events", events);
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
  await store.remove("events");
}
