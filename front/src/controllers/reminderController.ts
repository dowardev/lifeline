import { RepeatType } from "@/utils/types";

// services
import { ReminderService } from "@/services/reminderService";

export class ReminderController {
  reminderService = new ReminderService();

  generatorReminder(params: {
    frecuency: number;
    reminderStart: Date;
    reminderEnd: Date;
    repeat: RepeatType;
    daysWeek?: string[];
    notifications?: string[];
  }): Date[] {
    try {
      return this.reminderService.generatorReminder(params);
    } catch (error) {
      throw error;
    }
  }

  async setReminder(params: {
    title: string;
    message: string;
    extraInfo: string;
    reminder: Date;
  }): Promise<{ reminderId: number }> {
    const reminder = (await this.reminderService.setReminder(params))
      .reminderId;
    return { reminderId: reminder };
  }

  async cancelReminder(params: { id: number }): Promise<void> {
    try {
      await this.reminderService.cancelReminder(params);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
