import { useDocument } from "@/composables/useDocument";
import { useScheduleStore } from "@/store/scheduleStore";
import { Schedule } from "@/utils/interfaces";
import { LocalNotifications } from "@capacitor/local-notifications";
import { format } from "date-fns";
import { getEvents as getEventsService } from "../services/event";
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

    if (events == null) return;

    const eventsByDate: Schedule = {};

    events.forEach((event) => {
      const startDate = new Date(event.reminders?.start as string);
      const endDate = new Date(event.reminders?.end as string);

      // Iteramos sobre los días entre el inicio y fin del evento
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
          id: event.id + new Date().getTime(),
          title: event.name,
          message: "Recordatorio",
          date: event.reminders?.start,
        });
      }
    });
    storeSchedule({ schedule: eventsByDate });
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

  return {
    loadReminders,
    setReminders,
    checkNotificationsPermissions,
    getReminders,
    generateEventsSchedule,
    loadSchedule,
    getSchedule,
  };
};
