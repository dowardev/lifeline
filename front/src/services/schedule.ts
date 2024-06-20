import { Schedule } from "@/utils/interfaces";

import { storage } from "@/main";

export class ScheduleService {
  async storeSchedule(params: { schedule: Schedule }): Promise<void> {
    const { schedule } = params;

    await storage.set(
      "schedule",
      JSON.parse(JSON.stringify(Object.assign({}, schedule))),
    );
  }

  async getSchedule(): Promise<Schedule> {
    const schedule = await storage.get("schedule");
    return schedule == null ? ({} as Schedule) : schedule;
  }

  async deleteSchedule(): Promise<void> {
    await storage.remove("schedule");
  }
}
