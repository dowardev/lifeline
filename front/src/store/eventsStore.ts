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

    getEvent(state) {
      return (params: { idEvent: string }) => {
        const idEvent = params.idEvent;
        const document = state.events.filter((event) => {
          if (event.id == idEvent) return event;
        });
        return document[0];
      };
    },
  },

  actions: {
    // async loadEvents(params: { refetch: boolean }) {
    //   try {
    //     this.events = await getEventsService({
    //       date: this.date,
    //       graphql: {
    //         name: USER_EVENTS,
    //         fragment: "Events",
    //         refetch: params.refetch,
    //       },
    //     });
    //   } catch (error) {
    //     console.error(error);
    //   }
    // },

    addEvent(params: { event: Event }) {
      this.events.push(params.event);
    },

    updateEvent(params: { event: Event }) {
      const event = params.event;
      this.events = this.events.map((element) => {
        if (element.id == event.id) element = { ...element, ...event };
        return element;
      });
    },

    updateEvents(params: { events: Array<Event> }) {
      const events = params.events;
      const combinedArray: Event[] = [...events];

      this.events.forEach((item) => {
        const index = combinedArray.findIndex(
          (element) => element.id === item.id
        );
        if (index === -1) {
          combinedArray.push(item);
        } else {
          combinedArray[index] = item;
        }
      });

      this.events = combinedArray;
    },

    removeEvent(params: { eventId: string }) {
      const id = params.eventId;
      const index = this.events.findIndex((element) => element.id == id);
      if (index != undefined) this.events?.splice(index, 1);
    },
  },
});
