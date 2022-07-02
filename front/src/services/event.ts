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

import { GetCalendars, GetCalendarsResponse } from "./interfaces";

export async function createEvent(event: Record<string, any>) {
  // const token = await userService()
  //   .getUserToken()
  //   .then((response) => {
  //     return response;
  //   });
  // return axios.post("http://localhost:8000/api/auth/create-event", event, {
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: "Bearer " + token,
  //   },
  // });
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
export async function getEvents(dateStart: string, dateEnd: string) {
  // const token = await userService()
  //   .getUserToken()
  //   .then((response) => {
  //     return response;
  //   });
  // return axios.get("http://localhost:8000/api/auth/get-events", {
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: "Bearer " + token,
  //   },
  //   params: { dateStart, dateEnd },
  // });
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

export async function getCalendars(
  params: GetCalendars
): Promise<Array<GetCalendarsResponse>> {
  const { onError, onResult, result } = useQuery(
    gql`
      query calendars {
        calendars {
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
      onResult((response) => resolve(response.data.calendars.calendars));
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
