import { useDocument } from "@/composables/useDocument";
import { useScheduleStore } from "@/store/scheduleStore";
import { Schedule, Event, ScheduleElement } from "@/utils/interfaces";
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

    const newSchedule: Schedule = {};

    await Promise.all(
      events.map(async (event) => {
        const id = new Date().getTime().toString();
        const idElement = event.id;
        const title = event.name;
        const message = "Recordatorio";
        const startDate = new Date(event.reminders?.start as string);
        const endDate = new Date(event.reminders?.end as string);

        const scheduleElement = generateScheduleElement({
          id,
          idElement,
          title,
          message,
          startDate,
          endDate,
          type: "Event",
        });

        let schedule = (await getScheduleService()) ?? ({} as Schedule);

        let year: number, month: number, day: number;

        [schedule, scheduleElement].forEach((obj) => {
          Object.keys(obj).forEach((yearStr) => {
            year = parseInt(yearStr);
            if (!newSchedule.hasOwnProperty(year)) {
              newSchedule[year] = {};
            }
            Object.keys(obj[year]).forEach((monthStr) => {
              month = parseInt(monthStr);
              if (!newSchedule[year].hasOwnProperty(month)) {
                newSchedule[year][month] = {};
              }
              Object.keys(obj[year][month]).forEach((dayStr) => {
                day = parseInt(dayStr);
                if (!newSchedule[year][month].hasOwnProperty(day)) {
                  newSchedule[year][month][day] = [];
                }
                obj[year][month][day].forEach((element) => {
                  const existingElement = newSchedule[year][month][day].find(
                    (e) => e.idElement === element.idElement
                  );

                  if (existingElement) {
                    // Si el elemento ya existe, actualizamos sus propiedades
                    Object.assign(existingElement, element);
                  } else {
                    // Si el elemento no existe, lo agregamos al arreglo
                    newSchedule[year][month][day].push(element);
                  }
                });
              });
            });
          });
        });

        if (Object.keys(schedule).length == 0) {
          schedule = scheduleElement;
        } else {
          schedule = newSchedule;
        }
      })
    );
    await storeSchedule({ schedule: newSchedule });
  }

  function generateScheduleElement(params: {
    id: string;
    idElement: string;
    title: string;
    message: string;
    startDate: Date;
    endDate: Date;
    type: string;
  }): Schedule {
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
      date.getDate() <= endDate.getDate();
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

  function generateEventSchedule(params: {
    scheduleElement: Schedule;
    schedule: Schedule;
  }): Schedule {
    const { scheduleElement, schedule } = params;
    return generateSchedule({
      schedule,
      scheduleElement,
    });
  }

  function removeElementSchedule(params: {
    id: string;
    schedule: Schedule;
  }): Schedule {
    const { id, schedule } = params;

    for (const year in schedule) {
      for (const month in schedule[year]) {
        for (const day in schedule[year][month]) {
          const scheduleElements = schedule[year][month][day];
          const updatedElements: ScheduleElement[] = [];

          for (const key in scheduleElements) {
            if (scheduleElements.hasOwnProperty(key)) {
              const element = scheduleElements[key];
              if (element.idElement !== id) {
                updatedElements.push(element);
              }
            }
          }

          if (updatedElements.length === 0) {
            delete schedule[year][month][day];

            if (Object.keys(schedule[year][month]).length === 0) {
              delete schedule[year][month];

              if (Object.keys(schedule[year]).length === 0) {
                delete schedule[year];
              }
            }
          } else {
            schedule[year][month][day] = updatedElements;
          }
        }
      }
    }
    return schedule;
  }

  function generateSchedule(params: {
    schedule: Schedule;
    scheduleElement: any;
  }) {
    const { schedule, scheduleElement } = params;
    const newSchedule: Schedule = {};
    let year: number, month: number, day: number;

    [schedule, scheduleElement].forEach((obj) => {
      Object.keys(obj).forEach((yearStr) => {
        year = parseInt(yearStr);
        if (!newSchedule.hasOwnProperty(year)) {
          newSchedule[year] = {};
        }
        Object.keys(obj[year]).forEach((monthStr) => {
          month = parseInt(monthStr);
          if (!newSchedule[year].hasOwnProperty(month)) {
            newSchedule[year][month] = {};
          }
          Object.keys(obj[year][month]).forEach((dayStr) => {
            day = parseInt(dayStr);
            if (!newSchedule[year][month].hasOwnProperty(day)) {
              newSchedule[year][month][day] = [];
            }
            obj[year][month][day].forEach((element: any) => {
              newSchedule[year][month][day].push(element);
            });
          });
        });
      });
    });
    return newSchedule;
  }

  async function saveSchedule(params: { schedule: Schedule }) {
    const { schedule } = params;
    await storeSchedule({ schedule });
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
    saveSchedule,
    generateEventSchedule,
    generateScheduleElement,
    removeElementSchedule,
  };
};
