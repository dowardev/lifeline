import { Schedule } from "@/utils/interfaces";

import { storage } from "@/main";

export async function storeSchedule(params: {
  schedule: Schedule;
}): Promise<void> {
  const { schedule } = params;

  await storage.set(
    "schedule",
    JSON.parse(JSON.stringify(Object.assign({}, schedule))),
  );
}

export async function getSchedule(): Promise<Schedule> {
  const schedule = await storage.get("schedule");
  return schedule == null ? ({} as Schedule) : schedule;
}

export async function deleteSchedule(): Promise<void> {
  await storage.remove("schedule");
}
