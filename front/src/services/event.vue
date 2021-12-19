<script lang="ts">
import axios from "axios";
import user from "./user.vue";
const {getUserToken} = user();
import {Storage} from "@ionic/storage";
const storage = new Storage();
storage.create();

export default function () {
  async function createEvent(
    title: string,
    time: Record<string, any>,
    reminders: Array<string>,
    repeats: Record<string, any>,
    calendar: string,
    notes: string
  ) {
    const token = await getUserToken().then((response) => {
      return response;
    });
    return axios.post(
      "http://localhost:8000/api/auth/create-event",
      {
        title,
        time,
        reminders,
        repeats,
        calendar,
        notes,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      }
    );
  }
  async function updateEvent(
    id: number,
    title: string,
    time: Record<string, any>,
    reminders: Array<string>,
    repeats: Record<string, any>,
    calendar: string,
    notes: string
  ) {
    const token = await getUserToken().then((response) => {
      return response;
    });
    return axios.post(
      "http://localhost:8000/api/auth/update-event",
      {
        id,
        title,
        time,
        reminders,
        repeats,
        calendar,
        notes,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      }
    );
  }
  async function getEvents() {
    const token = await getUserToken().then((response) => {
      return response;
    });

    return axios.get("http://localhost:8000/api/auth/get-events", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });
  }
  async function getEvent(id: number) {
    const token = await getUserToken().then((response) => {
      return response;
    });

    return axios.post(
      "http://localhost:8000/api/auth/get-event",
      {id},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      }
    );
  }
  async function getEventLocal(id: number) {
    const events = await storage.get("events").then((response) => {
      return response;
    });

    const event = (JSON.parse(events) as Array<any>).filter(
      (element) => parseInt(element["id" as any]) == id
    );

    return event;
  }
  function formatDate(date: any) {
    const d = new Date(date);
    let hour = d.getHours() % 12 || 12;
    let minute = d.getMinutes() as any;
    minute = minute == 0 ? "00" : d.getMinutes();
    const am = d.getHours() >= 12 ? "pm" : "am";
    const timeFormatted = hour + ":" + minute + " " + am;

    const dateFormatted =
      d.getDate() +
      "-" +
      d.getMonth() +
      "-" +
      d.getFullYear() +
      " " +
      timeFormatted;

    hour = d.getHours();
    minute = d.getMinutes() as any;
    minute = minute == 0 ? "00" : "0";
    const timeUnformatted = hour + ":" + minute;

    const dateUnformatted =
      d.getFullYear() +
      "-" +
      d.getMonth() +
      "-" +
      d.getDate() +
      " " +
      timeUnformatted;

    return {dateFormatted, dateUnformatted};
  }
  return {
    createEvent,
    updateEvent,
    getEvents,
    getEvent,
    getEventLocal,
    formatDate,
  };
}
</script>
