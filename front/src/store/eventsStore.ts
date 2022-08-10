import { defineStore } from "pinia";
import { Event } from "../services/interfaces";
import { getEvents as getEventsService } from "../services/event";
import { USER_EVENTS } from "../services/graphql";

interface EventsState {
  events: Event[];
  date: string;
}

export const useEventsStore = defineStore("events", {
  state: (): EventsState => ({
    events: [] as Event[],
    date: new Date().toISOString(),
  }),

  actions: {
    async getEvents(params: { refetch: boolean }) {
      try {
        this.events = await getEventsService({
          date: this.date,
          graphql: {
            name: USER_EVENTS,
            fragment: "Events",
            refetch: params.refetch,
          },
        });
      } catch (error) {
        console.error(error);
      }
    },

    addEvent(event: Event) {
      this.events.push(event);
    },
  },
});
