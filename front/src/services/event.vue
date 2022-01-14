<script lang="ts">
import axios from "axios";
import userService from "./user.vue";
import { Storage } from "@ionic/storage";
const storage = new Storage();
storage.create();
import { format } from "date-fns";

export default function () {
  async function createEvent(event: Record<string, any>) {
    const token = await userService()
      .getUserToken()
      .then((response) => {
        return response;
      });
    return axios.post("http://localhost:8000/api/auth/create-event", event, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });
  }
  async function updateEvent(event: Record<string, any>) {
    const token = await userService()
      .getUserToken()
      .then((response) => {
        return response;
      });
    return axios.post("http://localhost:8000/api/auth/update-event", event, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });
  }
  async function getEvents(dateStart: string, dateEnd: string) {
    const token = await userService()
      .getUserToken()
      .then((response) => {
        return response;
      });

    return axios.get("http://localhost:8000/api/auth/get-events", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      params: { dateStart, dateEnd },
    });
  }
  async function getEvent(id: number) {
    const token = await userService()
      .getUserToken()
      .then((response) => {
        return response;
      });

    return axios.post(
      "http://localhost:8000/api/auth/get-event",
      { id },
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
  function formatDateTime(date: string, typeFormat: string) {
    return format(new Date(date), typeFormat);
  }
  return {
    createEvent,
    updateEvent,
    getEvents,
    getEvent,
    getEventLocal,
    formatDateTime,
  };
}
</script>
