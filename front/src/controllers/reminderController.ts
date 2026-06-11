import { RepeatType } from "@/utils/types";
import { LocalNotifications } from "@capacitor/local-notifications";
import { add, sub, Duration } from "date-fns";

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
    const { frecuency } = params;
    const safeFrecuency = Math.max(frecuency, 1);

    const start = new Date(reminderStart.getTime());
    start.setMilliseconds(0);
    start.setSeconds(0);

    const end = new Date(reminderEnd.getTime());

    const weekDays: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const repeatUnit: { [key in RepeatType]: string } = {
      daily: "days",
      weekly: "weeks",
      monthly: "months",
      annually: "years",
    };
    const unit = repeatUnit[repeatType] as keyof Duration;

    const dates: Date[] = [];
    const current = new Date(start.getTime());

    if (repeatType === "weekly" && daysWeek && daysWeek.length > 0) {
      const allowedDays = new Set(
        daysWeek.map((d) => weekDays[d.toLowerCase()] ?? -1)
      );
      while (current <= end && dates.length < 2000) {
        if (allowedDays.has(current.getDay())) {
          const d = new Date(current.getTime());
          d.setHours(start.getHours());
          d.setMinutes(start.getMinutes());
          dates.push(d);
        }
        current.setDate(current.getDate() + 1);
      }
    } else {
      while (current <= end && dates.length < 2000) {
        dates.push(new Date(current.getTime()));
        const next = add(current, { [unit]: safeFrecuency } as Duration);
        current.setTime(next.getTime());
      }
    }

    const reminders: Date[] = [];
    const safeNotifications = notifications ?? [];
    safeNotifications.forEach((notification) => {
      dates.forEach((date) => {
        const tr = { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0 };
        if (notification == "5mb") tr.minutes = 5;
        if (notification == "10mb") tr.minutes = 10;
        if (notification == "15mb") tr.minutes = 15;
        if (notification == "30mb") tr.minutes = 30;
        if (notification == "1hb") tr.hours = 1;
        if (notification == "1db") tr.days = 1;
        if (notification == "2db") tr.days = 2;
        if (notification == "1wb") tr.weeks = 1;
        if (notification == "1mb") tr.months = 1;
        reminders.push(sub(date, tr));
      });
    });
    return reminders;
  }

  getEventReminders(params: { dateStart: Date; notifications: string[] }): Date[] {
    const { dateStart, notifications } = params;
    return notifications.map((notification) => {
      const tr = { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0 };
      if (notification == "5mb") tr.minutes = 5;
      if (notification == "10mb") tr.minutes = 10;
      if (notification == "15mb") tr.minutes = 15;
      if (notification == "30mb") tr.minutes = 30;
      if (notification == "1hb") tr.hours = 1;
      if (notification == "1db") tr.days = 1;
      if (notification == "2db") tr.days = 2;
      if (notification == "1wb") tr.weeks = 1;
      if (notification == "1mb") tr.months = 1;
      return sub(dateStart, tr);
    });
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

    const reminderId = Date.now() + Math.floor(Math.random() * 100000);
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

  async cancelReminder(params: { id: number }): Promise<void> {
    const { id } = params;
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async checkNotificationsPermissions(): Promise<boolean> {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display == "granted") {
      return true;
    } else {
      return false;
    }
  }
}
