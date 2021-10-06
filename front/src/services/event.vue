<script lang="ts">
import axios from "axios";
import user from "./user.vue";
const { getUserToken } = user();

export default function () {
  async function createEvent(
    title: string,
    time: {},
    reminders: Array<string>,
    repeats: {},
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
  return {
    createEvent,
    getEvents,
  };
}
</script>
