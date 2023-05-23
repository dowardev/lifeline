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

  // function loadReminders() {
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
  // }
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

  async function loadReminders(): Promise<ScheduleElement[]> {
    const schedule = getSchedule() ?? [];
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const next7Days = new Date().getTime() + 7 * millisecondsInDay;

    const next7DaysElements: ScheduleElement[] = [];

    for (const year in schedule) {
      for (const month in schedule[year]) {
        for (const day in schedule[year][month]) {
          const scheduleElements = schedule[year][month][day];
          const date = new Date(Number(year), Number(month) - 1, Number(day));

          if (date.getTime() <= next7Days) {
            next7DaysElements.push(...scheduleElements);
          }
        }
      }
    }
    return next7DaysElements;
  }

  async function generateScheduleReminders(): Promise<
    { id: number; title: string; message: string; date: string }[]
  > {
    const schedule = getSchedule() ?? [];
    const currentDate = new Date();
    const next7Days = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const scheduledItemsByDate: Map<string, ScheduleElement[]> = new Map();

    // Construye el índice de elementos programados por fecha
    for (const year in schedule) {
      for (const month in schedule[year]) {
        for (const day in schedule[year][month]) {
          const scheduleElements = schedule[year][month][day];
          const date = new Date(Number(year), Number(month) - 1, Number(day));

          for (const element of scheduleElements) {
            if (element.reminder) {
              const dateString = date.toISOString().substring(0, 10); // Usar la fecha como clave en formato 'yyyy-mm-dd'
              const scheduledItems = scheduledItemsByDate.get(dateString) || [];
              scheduledItems.push(element);
              scheduledItemsByDate.set(dateString, scheduledItems);
            }
          }
        }
      }
    }

    // Filtra los elementos que están dentro de los próximos 7 días y crea un nuevo objeto con las propiedades requeridas
    const next7DaysElements: {
      id: number;
      title: string;
      message: string;
      date: string;
    }[] = [];

    for (const [dateString, scheduledItems] of scheduledItemsByDate) {
      const date = new Date(dateString);

      if (date <= next7Days) {
        for (const element of scheduledItems) {
          next7DaysElements.push({
            id: new Date().getTime(),
            title: element.title,
            message: element.message,
            date: element.date,
          });
        }
      }
    }

    return next7DaysElements;
  }

  async function setReminders(params: {
    reminder: Date;
    id: number;
    title: string;
    message: string;
    extraInfo?: string;
  }) {
    const { id, reminder, title, message, extraInfo } = params;
    const permission = await checkNotificationsPermissions();
    if (permission == false) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body: message,
          id,
          schedule: {
            at: reminder,
          },
          sound: null,
          attachments: null,
          actionTypeId: "",
          extra: extraInfo,
          channelId: null,
        },
      ],
    }).catch((e) => {
      console.error(e);
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
        const message = event.description;
        const startDate = new Date(event.reminders?.start as string);
        const endDate = new Date(event.reminders?.end as string);
        const reminder =
          event.reminders!.notifications.length > 0 ? true : false;
        const repeat = event.reminders?.repeat ?? {};

        const scheduleElement = generateScheduleElement({
          id,
          idElement,
          title,
          message,
          startDate,
          endDate,
          type: "Event",
          reminder,
          repeat,
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
    reminder: boolean;
    repeat: {
      frecuency?: number;
      type?: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  }): Schedule {
    const {
      id,
      idElement,
      title,
      message,
      startDate,
      endDate,
      type,
      reminder,
      repeat: { frecuency = 1, type: repeatType = "daily", daysWeek = [] },
    } = params;

    const normalizedDaysWeek = daysWeek.map((day) => day.toLowerCase()); // Normalize day names to lowercase

    const eventsByDate: Schedule = {};
    let currentDate = new Date(startDate);
    let lastDate = new Date(currentDate);
    lastDate.setFullYear(lastDate.getFullYear() + frecuency);

    while (currentDate <= endDate || lastDate <= endDate) {
      if (repeatType === "weekly") {
        const dayOfWeek = currentDate.getDay();
        const currentDayName = getDayName(dayOfWeek);
        if (!normalizedDaysWeek.includes(currentDayName.toLowerCase())) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue; // Skip the current iteration if the day of the week is not included
        }
      } else if (repeatType === "monthly") {
        const dayOfMonth = currentDate.getDate();
        if (dayOfMonth !== startDate.getDate()) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue; // Skip the current iteration if it's not the same day as the start date
        }
      } else if (repeatType === "annually") {
        const month = currentDate.getMonth();
        const dayOfMonth = currentDate.getDate();
        if (
          month !== startDate.getMonth() ||
          dayOfMonth !== startDate.getDate()
        ) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue; // Skip the current iteration if it's not the same month and day as the start date
        }
      }

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const day = currentDate.getDate();

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
        date: currentDate.toISOString(),
        type: repeatType,
        reminder,
      });

      if (repeatType === "annually") {
        currentDate.setFullYear(currentDate.getFullYear() + frecuency);
        lastDate.setFullYear(lastDate.getFullYear() + frecuency);
      } else if (repeatType === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + frecuency);
        lastDate.setMonth(lastDate.getMonth() + frecuency);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
        lastDate.setDate(lastDate.getDate() + 1);
      }
    }

    return eventsByDate;
  }

  function getDayName(dayOfWeek: number): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  }

  async function loadSchedule(): Promise<void> {
    const schedule = await getScheduleService();

    if (schedule == null) return;

    scheduleStore.setSchedule({ schedule });
  }

  function getSchedule(): Schedule | undefined {
    const schedule = scheduleStore.getSchedule();
    return Object.keys(schedule).length > 0 ? schedule : undefined;
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
    generateScheduleElement,
    removeElementSchedule,
    generateScheduleReminders,
  };
};
