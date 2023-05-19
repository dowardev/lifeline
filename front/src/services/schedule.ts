import { Schedule } from "@/utils/interfaces";
import { Storage } from "@ionic/storage";

const store = new Storage();
store.create();

export async function storeSchedule(params: { schedule: Schedule }) {
  const { schedule } = params;

  await store.set(
    "schedule",
    JSON.parse(JSON.stringify(Object.assign({}, schedule)))
  );
}

export async function getSchedule(): Promise<Schedule | null> {
  return await store.get("schedule");
}
