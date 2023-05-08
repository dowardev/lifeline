import { NewEvent, Event } from "@/utils/interfaces";
import {
  saveLocalEvent as saveLocalEventService,
  getEvents as getEventsService,
} from "../services/event";
import { useEventsStore } from "../store/eventsStore";

export const useEvent = () => {
  const eventStore = useEventsStore();

  async function saveEvent(params: {
    event: NewEvent;
  }): Promise<{ id: string }> {
    const eventData = params.event;
    let event = {} as Event;

    try {
      event = (
        await saveLocalEventService({
          event: eventData,
        })
      ).event;
      eventStore.addEvent({ event });

      return { id: event.id };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadEvents(): Promise<void> {
    const events = await getEventsService();

    if (events == null) return;

    events.forEach((event) => {
      eventStore.addEvent({ event: event });
    });
  }

  function getEvents(): Array<Event> | undefined {
    const events = eventStore.getEvents();
    return events != null ? JSON.parse(JSON.stringify(events)) : undefined;
  }

  return {
    saveEvent,
    loadEvents,
    getEvents,
  };
};
