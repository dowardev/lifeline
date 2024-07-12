import { useScheduleStore } from "@/store/scheduleStore";
import { Schedule, Event, ScheduleElement } from "@/utils/interfaces";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useEventsStore } from "@/store/eventsStore";
import { ScheduleService } from "@/services/schedule";

const scheduleService = new ScheduleService();

import { ReminderController } from "../js/reminderController";
import { EventController } from "../js/eventController";

export class ScheduleController {
  scheduleStore = useScheduleStore();
  reminderController = new ReminderController();
  eventController = new EventController();

  //  loadReminders() {
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
  //  loadReminders() {
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

  async loadReminders(): Promise<ScheduleElement[]> {
    const schedule = this.getSchedule() ?? [];
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

  async generateScheduleReminders(): Promise<
    { id: number; title: string; message: string; date: string }[]
  > {
    const schedule = this.getSchedule() ?? [];
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

  async setReminders(params: {
    reminder: Date;
    id: number;
    title: string;
    message: string;
    extraInfo?: string;
  }) {
    const { id, reminder, title, message, extraInfo } = params;
    const permission = await this.checkNotificationsPermissions();
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
          actionTypeId: "",
          extra: extraInfo,
        },
      ],
    }).catch((e) => {
      console.error(e);
    });
  }

  async checkNotificationsPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display == "granted") {
      return true;
    } else {
      return false;
    }
  }

  getReminders(): Array<Schedule> | undefined {
    const reminders = this.scheduleStore.getReminders();
    return reminders != null
      ? JSON.parse(JSON.stringify(reminders))
      : undefined;
  }

  generateEventsSchedule(params: { events: Event[]; date: Date }): Schedule {
    const { events, date } = params;
    let schedule = {};

    events.forEach((event) => {
      const id = event.id;
      const idElement = event.id;
      const title = event.name;
      const message = event.description;
      const startDate = event.reminders?.start;
      const endDate = event.reminders?.end;
      const reminder =
        event.reminders!.notifications!.length > 0 ? true : false;
      const repeat = event.reminders?.repeat ?? {};

      const scheduleElement = this.generateScheduleElement({
        id: id as number,
        title: title as string,
        message,
        startDate,
        endDate,
        type: "Event",
        reminder,
        repeat,
      });

      const { schedule: newSchedule } = this.mergeSchedule({
        schedule,
        scheduleElement,
      });
      schedule = newSchedule;
    });

    return schedule;
  }

  /**
   * Generate events schedule
   * @param {Object} params
   * @param {Number} params.id local id from event
   * @param {String} params.title title from event
   * @param {String} params.message message that will be presented when the notification is displayed
   * @param {Date} params.startDate date from which the event begins to repeat
   * @param {Date} params.endDate date from which the event ends repeating
   * @param {"daily" | "weekly" | "monthly" | "annually"}params.type date event repetition type
   * @param {Boolean} params.reminder show reminder
   * @param {Object} params.repeat data on the repetition of the event
   * @param {Number=} params.repeat.frecuency frequency at which the event will repeat
   * @param {"daily" | "weekly" | "monthly" | "annually"=} params.repeat.frecuency.type date event repetition type
   * @param {String[]} params.repeat.frecuency.daysWeek arrangement that indicates the days of the week in which the event will be repeated, it is only necessary if the type is weekly
   */
  generateScheduleElement(params: {
    id: number;
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
      title,
      message,
      startDate,
      endDate,
      type,
      reminder,
      repeat: { frecuency = 1, type: repeatType = "daily", daysWeek = [] },
    } = params;

    const normalizedDaysWeek = daysWeek.map((day) => day.toLowerCase());

    const eventsByDate: Schedule = {};
    const currentDate = new Date(startDate);
    const lastDate = new Date(currentDate);
    lastDate.setFullYear(lastDate.getFullYear() + frecuency);

    while (currentDate <= endDate || lastDate <= endDate) {
      if (repeatType === "weekly") {
        const dayOfWeek = currentDate.getDay();
        const currentDayName = this.getDayName(dayOfWeek);
        if (!normalizedDaysWeek.includes(currentDayName.toLowerCase())) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue;
        }
      } else if (repeatType === "monthly") {
        const dayOfMonth = currentDate.getDate();
        if (dayOfMonth !== startDate.getDate()) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue;
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
          continue;
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
        id,
        title,
        message,
        date: currentDate.toISOString(),
        type,
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

  getDayName(dayOfWeek: number): string {
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

  async loadSchedule(): Promise<void> {
    const schedule = (await scheduleService.getSchedule()) ?? ({} as Schedule);
    this.setSchedule({ schedule });
  }

  getSchedule(): Schedule {
    const schedule = this.useEventsStore().calendarSchedule;
    return Object.keys(schedule).length > 0 ? schedule : ({} as Schedule);
  }

  async getLocalSchedule(): Promise<Schedule> {
    return await scheduleService.getSchedule();
  }

  removeElementSchedule(params: { id: string; schedule: Schedule }): Schedule {
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

  async saveScheduleLocal(params: { schedule: Schedule }): Promise<void> {
    const { schedule } = params;
    await scheduleService.storeSchedule({ schedule });
  }

  setSchedule(params: { schedule: Schedule }): void {
    const { schedule } = params;
    this.scheduleStore.setSchedule({ schedule });
  }

  mergeSchedule(params: { schedule: Schedule; scheduleElement: Schedule }): {
    schedule: Schedule;
  } {
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
            obj[year][month][day].forEach((element) => {
              const existingElement = newSchedule[year][month][day].find(
                (e) => e.idElement === element.idElement,
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

    return { schedule: newSchedule };
  }

  async generateEventReminders(params: { event: Event }): Promise<void> {
    const { event } = params;

    const notifications = this.reminderController.getEventReminders({
      dateStart: event.reminders.start,
      notifications: event.reminders.notifications ?? [],
    });

    if (notifications) {
      await Promise.all(
        notifications.map(async (notification) => {
          await this.setReminders({
            id: new Date().getMilliseconds(),
            reminder: notification,
            title: event.name!,
            message: event.description,
          });
        }),
      );
    }
  }

  async generateEventsReminders(params: { events: Event[] }): Promise<void> {
    const { events } = params;

    await Promise.all(
      events.map(async (event) => {
        const notifications = this.reminderController.getEventReminders({
          dateStart: event.reminders.start,
          notifications: event.reminders.notifications ?? [],
        });

        if (notifications) {
          await Promise.all(
            notifications.map(async (notification) => {
              await this.setReminders({
                id: new Date().getMilliseconds(),
                reminder: notification,
                title: event.name!,
                message: event.description,
              });
            }),
          );
        }
      }),
    );
  }

  generateEventSchedule(params: { event: Event }): {
    schedule: Schedule;
  } {
    const { event } = params;

    const id = new Date().getTime().toString();
    const idElement = event.id;
    const title = event.name;
    const message = event.description;
    const startDate = event.reminders?.start;
    const endDate = event.reminders?.end;
    const reminder = event.reminders!.notifications.length > 0 ? true : false;
    const repeat = event.reminders?.repeat ?? {};

    const scheduleElement = this.generateScheduleElement({
      id,
      id: idElement,
      title,
      message,
      startDate,
      endDate,
      type: "Event",
      reminder,
      repeat,
    });

    // const { schedule: newSchedule } = generateSchedule({
    //   schedule,
    //   scheduleElement,
    // });
    // schedule = newSchedule;

    return { schedule: scheduleElement };
  }

  async deleteSchedule(): Promise<void> {
    await scheduleService.deleteSchedule();
  }

  async generateSchedules(params: {
    schedule: Schedule;
  }): Promise<{ schedule: Schedule }> {
    const { schedule } = params;
    // const localSchedule = await getLocalSchedule();
    // const storeSchedule = getSchedule();
    // schedule =
    //   Object.keys(storeSchedule).length == 0 ? localSchedule : storeSchedule;

    // events
    const events = await this.eventController.getEvents();
    const { schedule: eventsSchedule } = this.generateEventsSchedule({
      events,
      schedule,
    });

    const { schedule: newSchedule } = this.mergeSchedule({
      schedule,
      scheduleElement: eventsSchedule,
    });
    return { schedule: newSchedule };
  }

  generateScheduleElementForDate(params: {
    idElement: string;
    title: string;
    message: string;
    date: Date;
    type: string;
    reminder: boolean;
    repeat: {
      frecuency?: number;
      type?: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  }): Schedule {
    const {
      idElement,
      title,
      message,
      type,
      reminder,
      repeat: { frecuency = 1, type: repeatType = "daily", daysWeek = [] },
      date,
    } = params;

    const normalizedDaysWeek = daysWeek.map((day) => day.toLowerCase());

    const eventsByDate: Schedule = {};

    const currentDate = new Date(date);
    const lastDate = new Date(currentDate);
    lastDate.setFullYear(lastDate.getFullYear() + frecuency);

    while (currentDate <= lastDate) {
      if (repeatType === "weekly") {
        const dayOfWeek = currentDate.getDay();
        const currentDayName = this.getDayName(dayOfWeek);
        if (!normalizedDaysWeek.includes(currentDayName.toLowerCase())) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue;
        }
      } else if (repeatType === "monthly") {
        const dayOfMonth = currentDate.getDate();
        if (dayOfMonth !== date.getDate()) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue;
        }
      } else if (repeatType === "annually") {
        const month = currentDate.getMonth();
        const dayOfMonth = currentDate.getDate();
        if (month !== date.getMonth() || dayOfMonth !== date.getDate()) {
          currentDate.setDate(currentDate.getDate() + 1);
          lastDate.setDate(lastDate.getDate() + 1);
          continue;
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
        id: idElement,
        idElement,
        title,
        message,
        date: currentDate.toISOString(),
        type,
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
}
