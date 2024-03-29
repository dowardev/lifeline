import { Event } from "@/utils/interfaces";
import { RepeatType } from "@/utils/types";
import { LocalNotifications } from "@capacitor/local-notifications";
import { eachDayOfInterval, sub } from "date-fns";
import { add } from "date-fns";

export class ReminderController {
  generatorReminder(params: {
    frecuency: number;
    reminderStart: Date;
    reminderEnd: Date;
    repeat: RepeatType;
    daysWeek?: string[];
    notifications?: string[];
  }): Date[] {
    const {
      reminderStart,
      reminderEnd,
      repeat: repeatType,
      daysWeek,
      notifications,
    } = params;
    const reminders: Date[] = [];
    let { frecuency } = params;

    reminderStart.setMilliseconds(0);
    reminderStart.setSeconds(0);

    let dates = eachDayOfInterval({
      start: reminderStart,
      end: reminderEnd,
    });

    const repeatDict = {
      daily: "days",
      weekly: "weeks",
      monthly: "months",
      annually: "years",
    };

    const rep = repeatDict[repeatType as keyof typeof repeatDict];
    dates = dates
      .map((date) => {
        date.setHours(reminderStart.getHours());
        date.setMinutes(reminderStart.getMinutes());
        const newDate = add(reminderStart, {
          [rep]: frecuency ?? 0,
        });
        if (newDate.toISOString() == date.toISOString()) {
          frecuency! += frecuency ?? 0;
          return date;
        }
        return null;
      })
      .filter((date) => date !== null) as Date[];
    dates.push(reminderStart);

    if (repeatType == "weekly") {
      const eventWeekDays = daysWeek;
      const weekDays: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      const weekNumberDays = eventWeekDays!.map((dayName) => {
        return weekDays[dayName.toString()];
      });
      const newNewDays: Date[] = [];
      dates.forEach((element) => {
        weekNumberDays?.forEach((dayNumber) => {
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
    }

    dates.push(reminderStart);

    notifications!.forEach((notification) => {
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
    // console.log(reminders);
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
