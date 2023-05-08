import { Schedule } from "@/utils/interfaces";
import { Storage } from "@ionic/storage";

const store = new Storage();
store.create();

export async function storeSchedule(params: { schedule: Schedule }) {
  const scheduleElement = params.schedule;
  let schedule = (await getSchedule()) ?? ({} as Schedule);

  const newObj = {};

  [schedule, scheduleElement].forEach((obj) => {
    Object.keys(obj).forEach((year) => {
      if (!newObj.hasOwnProperty(year)) {
        newObj[year] = {};
      }
      Object.keys(obj[year]).forEach((month) => {
        if (!newObj[year].hasOwnProperty(month)) {
          newObj[year][month] = {};
        }
        Object.keys(obj[year][month]).forEach((day) => {
          if (!newObj[year][month].hasOwnProperty(day)) {
            newObj[year][month][day] = [];
          }
          obj[year][month][day].forEach((element) => {
            if (
              !newObj[year][month][day].some(
                (e) => e.idElement === element.idElement
              )
            ) {
              newObj[year][month][day].push(element);
            }
          });
        });
      });
    });
  });

  if (Object.keys(schedule).length == 0) {
    schedule = scheduleElement;
  } else {
    schedule = newObj;
  }
  await store.set("schedule", schedule);
}

export async function getSchedule(): Promise<Schedule | null> {
  return await store.get("schedule");
}
