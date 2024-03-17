import { Event } from "@/utils/interfaces";
import { LocalNotifications } from "@capacitor/local-notifications";
import { eachDayOfInterval, sub } from "date-fns";
import { add } from "date-fns";

export class ReminderController {
  generatorReminder(params: { event: Event }): Date[] {
    const { event } = params;
    const reminders: Date[] = [];
    event.reminders.start.setMilliseconds(0);
    event.reminders.start.setSeconds(0);

    let dates = eachDayOfInterval({
      start: event.reminders.start,
      end: event.reminders.end,
    });

    dates = dates.map((date) => {
      date.setHours(event.reminders.start.getHours());
      date.setMinutes(event.reminders.start.getMinutes());
      return date;
    });

    const repeatType = event.reminders.repeat?.type;

    if (repeatType == "daily") {
      let frecuency = event.reminders.repeat?.frecuency;
      if (frecuency! > 1) {
        const repeatDates = dates.filter((dt) => {
          const newDate = add(event.reminders.start, {
            days: frecuency,
          });

          if (newDate.toISOString() == dt.toISOString()) {
            frecuency! += event.reminders.repeat?.frecuency!;
            return dt;
          }
        });

        dates = repeatDates;
        dates.push(event.reminders.start);
      }
    }

    if (repeatType == "weekly") {
      let frecuency = event.reminders.repeat?.frecuency;
      let eventWeekDays = event.reminders.repeat?.daysWeek;
      const weekDays = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      eventWeekDays = eventWeekDays!.map((dayName) => {
        return weekDays[dayName];
      });

      const repeatDates = dates.filter((dt) => {
        const newDate = add(event.reminders.start, {
          weeks: frecuency,
        });

        if (newDate.toISOString() == dt.toISOString()) {
          frecuency! += event.reminders.repeat?.frecuency!;

          return dt;
        }
      });
      const newNewDays: Date[] = [];
      repeatDates.forEach((element) => {
        eventWeekDays?.forEach((dayNumber) => {
          const result = (dayNumber - element.getDay() + 7) % 7;
          newNewDays.push(
            new Date(
              element.getFullYear(),
              element.getMonth(),
              element.getDate() + result
            )
          );
        });
      });
      dates = newNewDays;
      dates.push(event.reminders.start);
    }

    if (repeatType == "monthly") {
      let frecuency = event.reminders.repeat?.frecuency;
      const repeatDates = dates.filter((dt) => {
        const newDate = add(event.reminders.start, {
          months: frecuency,
        });

        if (newDate.getTime() == dt.getTime()) {
          frecuency! += event.reminders.repeat?.frecuency!;
          return dt;
        }
      });
      dates = repeatDates;
      dates.push(event.reminders.start);
    }

    if (repeatType == "annually") {
      let frecuency = event.reminders.repeat?.frecuency;
      const repeatDates = dates.filter((dt) => {
        const newDate = add(event.reminders.start, {
          years: frecuency,
        });

        if (newDate.getTime() == dt.getTime()) {
          frecuency! += event.reminders.repeat?.frecuency!;
          return dt;
        }
      });
      dates = repeatDates;
      dates.push(event.reminders.start);
    }

    event.reminders.notifications!.forEach((notification) => {
      dates.forEach((date) => {
        const tr = {
          months: 0,
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
        };

        if (notification == "5mb") tr.minutes = 5;
        if (notification == "10mb") tr.minutes = 10;
        if (notification == "15mb") tr.minutes = 15;
        if (notification == "30mb") tr.minutes = 30;
        if (notification == "1hb") tr.hours = 1;
        if (notification == "1db") tr.days = 1;
        if (notification == "2db") tr.days = 2;
        if (notification == "1wb") tr.weeks = 1;
        if (notification == "1mb") tr.months = 2;

        const result = sub(date, tr);
        reminders.push(result);
      });
    });
    return reminders;
  }

  async setReminder(params: {
    title: string;
    message: string;
    extraInfo: string;
    reminder: Date;
  }): Promise<{ reminderId: number }> {
    const { title, message, extraInfo, reminder } = params;

    const permission = await this.checkNotificationsPermissions();
    if (permission == false) throw new Error("no permissions");

    const reminderId = Math.floor(Math.random() * 1000);
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body: message,
          id: reminderId,
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
    return { reminderId };
  }

  async checkNotificationsPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display == "granted") {
      return true;
    } else {
      return false;
    }
  }
  async cancelReminder(params: { id: number }): Promise<void> {
    const { id } = params;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
