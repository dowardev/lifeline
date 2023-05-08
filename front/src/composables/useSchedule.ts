import { useDocument } from "@/composables/useDocument";
import { useScheduleStore } from "@/store/scheduleStore";
import { Schedule, Event } from "@/utils/interfaces";
import { LocalNotifications } from "@capacitor/local-notifications";
import { format } from "date-fns";
import { getEvent, getEvents as getEventsService } from "../services/event";
import {
  getSchedule as getScheduleService,
  storeSchedule,
} from "@/services/schedule";

export const useSchedule = () => {
  const scheduleStore = useScheduleStore();

  function loadReminders() {
    // const documents = useDocument().getUserDocuments();
    // if (!documents) return;
    //
    // documents.forEach(async (document) => {
    //   document.elements?.forEach((element) => {
    //     if (!element.data || !element.data.reminder) return;
    //
    //     const date = {
    //       start: format(
    //         new Date(element.data.reminder.reminderStart),
    //         "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
    //       ),
    //       end: format(
    //         new Date(element.data.reminder.reminderStart),
    //         "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
    //       ),
    //     };
    //
    //     const id = new Date().getTime();
    //     const reminder = { title: "", message: "", id, date } as Schedule;
    //
    //     reminderStore.addNotification({ reminder });
    //   });
    // });
  }
  // function loadReminders() {
  //   const documents = useDocument().getUserDocuments() ?? [];
  //
  //   documents.forEach(async (document) => {
  //     document.elements?.forEach(async (element) => {
  //       if (!element.data.reminder) return;
  //
  //       const reminder = format(
  //         new Date(element.data.reminder.reminderStart),
  //         "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
  //       );
  //       if (!reminder) return;
  //       const id = new Date().getTime();
  //
  //       await setReminders({ reminder, id });
  //
  //       element.data.reminder!.notificationId = id.toString();
  //     });
  //
  //     await useDocument().updateDocument({ document });
  //   });
  // }

  async function setReminders(params: { reminder: string; id: number }) {
    const reminder = params.reminder;
    const id = params.id;
    const permission = await checkNotificationsPermissions();
    if (permission == false) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "My notification",
          body: "This is my notification",
          id,
          schedule: {
            at: new Date(reminder),
          },
          sound: null,
          attachments: null,
          actionTypeId: "",
          extra: null,
          channelId: null,
        },
      ],
    });
  }

  async function checkNotificationsPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display == "granted") {
      return true;
    } else {
      return false;
    }
  }

  function getReminders(): Array<Schedule> | undefined {
    const reminders = scheduleStore.getReminders();
    return reminders != null
      ? JSON.parse(JSON.stringify(reminders))
      : undefined;
  }

  async function generateEventsSchedule(): Promise<void> {
    const events = await getEventsService();

    if (!events) return;

    await Promise.all(
      events.map(async (event) => {
        const id = new Date().getTime().toString();
        const idElement = event.id;
        const title = event.name;
        const message = "Recordatorio";
        const startDate = new Date(event.reminders?.start as string);
        const endDate = new Date(event.reminders?.end as string);

        const scheduleElement = generateSchedule({
          id,
          idElement,
          title,
          message,
          startDate,
          endDate,
          type: "Event",
        });

        await storeSchedule({ schedule: scheduleElement });
      })
    );
  }

  function generateSchedule(params: {
    id: string;
    idElement: string;
    title: string;
    message: string;
    startDate: Date;
    endDate: Date;
    type: string;
  }) {
    const id = params.id;
    const idElement = params.idElement;
    const title = params.title;
    const message = params.message;
    const startDate = params.startDate;
    const endDate = params.endDate;
    const type = params.type;

    const eventsByDate: Schedule = {};

    for (
      let date = startDate;
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      if (!eventsByDate[year]) {
        eventsByDate[year] = {};
      }

      if (!eventsByDate[year][month]) {
        eventsByDate[year][month] = {};
      }

      if (!eventsByDate[year][month][day]) {
        eventsByDate[year][month][day] = [];
      }

      eventsByDate[year][month][day].push({
        id: id + new Date().getTime(),
        idElement,
        title,
        message,
        date: startDate.toISOString(),
        type,
      });
    }
    return eventsByDate;
  }

  async function loadSchedule(): Promise<void> {
    const schedule = await getScheduleService();

    if (schedule == null) return;

    scheduleStore.setSchedule({ schedule });
  }

  function getSchedule(): Schedule | undefined {
    const schedule = scheduleStore.getSchedule();
    return schedule != null ? schedule : undefined;
  }

  async function generateEventSchedule(params: {
    eventId: string;
  }): Promise<void> {
    const eventId = params.eventId;
    const event = await getEvent({ id: eventId });

    if (event == null) return;

    const id = new Date().getTime().toString();
    const idElement = event.id;
    const title = event.name;
    const message = "Recordatorio";
    const startDate = new Date(event.reminders?.start as string);
    const endDate = new Date(event.reminders?.end as string);

    const scheduleElement = generateSchedule({
      id,
      idElement,
      title,
      message,
      startDate,
      endDate,
      type: "Event",
    });

    await storeSchedule({ schedule: scheduleElement });
  }

  return {
    loadReminders,
    setReminders,
    checkNotificationsPermissions,
    getReminders,
    generateEventsSchedule,
    loadSchedule,
    getSchedule,
    generateEventSchedule,
  };
};
