import { defineStore } from "pinia";
import { Event } from "../services/interfaces";

interface EventsState {
  events: Event[];
}

export const useEventsStore = defineStore("events", {
  state: (): EventsState => ({
    events: [] as Event[],
  }),
  actions: {
    getEvents(events: Event[]) {
      this.events = events;
    },
    addEvent(event: Event) {
      this.events.push(event);
    },
  },
});
