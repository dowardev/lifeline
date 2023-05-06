import { Schedule } from "@/utils/interfaces";
import { Storage } from "@ionic/storage";

const store = new Storage();
store.create();

export async function storeSchedule(params: { schedule: Schedule }) {
  const schedule = params.schedule;
  await store.set("schedule", schedule);
}

export async function getSchedule(): Promise<Schedule | null> {
  return await store.get("schedule");
}
