import { NewEvent, Event } from "@/utils/interfaces";
import {
  saveLocalEvent as saveLocalEventService,
  getEvents as getEventsService,
  updateLocalEvent,
  deleteEvent as deleteEventService,
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

  async function updateEvent(params: { event: Event }): Promise<void> {
    const eventData = params.event;

    try {
      await updateLocalEvent({
        event: eventData,
      });
      eventStore.updateEvent({ event: eventData });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function loadEvents(): Promise<void> {
    const events = (await getEventsService()) ?? [];
    eventStore.updateEvents({ events });
  }

  function getEvents(): Array<Event> | undefined {
    const events = eventStore.getEvents();

    return events != null ? JSON.parse(JSON.stringify(events)) : undefined;
  }

  function getEvent(params: { idEvent: string }): Event | undefined {
    const idEvent = params.idEvent;
    const event = eventStore.getEvent({ idEvent });

    return event != null ? JSON.parse(JSON.stringify(event)) : undefined;
  }

  async function deleteEvent(params: { eventId: string }) {
    const eventId = params.eventId;
    await deleteEventService({ eventId });
    eventStore.removeEvent({ eventId });
  }

  return {
    saveEvent,
    loadEvents,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
  };
};
