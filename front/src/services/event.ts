import axios from "axios";
import userService from "./user.vue";
import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();
import { format } from "date-fns";

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
} from "./interfaces";

export async function createEvent(params: Event): Promise<void> {
  const {
    onError,
    onDone,
    mutate: createEvent,
  } = useMutation(
    gql`
      mutation createEvent(
        $title: String
        $calendar: String
        $time_start: String
        $time_end: String
        $guests: String
        $notes: String
        $reminders: String
        $repeats: String
        $tags: String
        $timeZone: String
      ) {
        createEvent(
          input: {
            title: $title
            calendar: $calendar
            time_start: $time_start
            time_end: $time_end
            guests: $guests
            notes: $notes
            reminders: $reminders
            repeats: $repeats
            tags: $tags
            timeZone: $timeZone
          }
        )
      }
    `,
    {
      variables: {
        title: params.title,
        calendar: params.calendar,
        time_start: params.timeStart,
        time_end: params.timeEnd,
        guests: params.guests,
        notes: params.notes,
        reminders: params.reminders,
        repeats: params.repeats,
        tags: params.tags,
        timeZone: params.timeZone,
      },
    }
  );
  createEvent();

  return new Promise((resolve, reject) => {
    onDone(() => resolve());
    onError((error) => reject(error));
  });
}
export async function updateEvent(event: Record<string, any>) {
  // const token = await userService()
  //   .getUserToken()
  //   .then((response) => {
  //     return response;
  //   });
  // return axios.post("http://localhost:8000/api/auth/update-event", event, {
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: "Bearer " + token,
  //   },
  // });
}

export async function getEvents(params: GetEvents): Promise<Array<Event>> {
  const { onResult, onError, result, refetch } = useQuery(
    gql`
        query events($date: String!) {
          events(input:{date:$date}) {
            ...${params.graphql.fragment}
          }
        }
        ${params.graphql.name}
      `,
    { date: params.date },
    {
      fetchPolicy: "cache-first",
    }
  );

  return new Promise((resolve, reject) => {
    const format = (events: any) => {
      events.forEach((element: any) => {
        element.timeStart = element.time_start;
        delete element.time_start;
        element.timeEnd = element.time_end;
        delete element.time_end;
        element.timeZone = element.time_zone;
        delete element.time_zone;
        element.guests = JSON.parse(element.guests);
        element.reminders = JSON.parse(element.reminders);
        element.repeats = JSON.parse(element.repeats);
        element.tags = JSON.parse(element.tags);
      });
      return events;
    };

    if (result.value != undefined && params.graphql.refetch == false) {
      const events = JSON.parse(JSON.stringify(result.value.events.events));
      resolve(format(events));
    }

    if (params.graphql.refetch) {
      refetch()?.then((response) => resolve(response.data.events.events));
    }

    onResult((response) => {
      const events = JSON.parse(JSON.stringify(response.data.events.events));
      resolve(format(events));
    });

    onError((error) => {
      reject(error);
    });
  });
}

export async function getEvent(id: number) {
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
}
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
export async function removeEvent(id: string | number) {
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
}
