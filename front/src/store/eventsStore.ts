import { defineStore } from "pinia";
import { Event } from "@/utils/interfaces";
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

  getters: {
    getEvents(state) {
      return () => {
        return state.events;
      };
    },
  },

  actions: {
    async loadEvents(params: { refetch: boolean }) {
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

    addEvent(params: { event: Event }) {
      this.events.push(params.event);
    },
  },
});
