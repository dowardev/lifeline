import { Schedule } from "@/utils/interfaces";
import { Storage } from "@ionic/storage";

const store = new Storage();
store.create();

export async function storeSchedule(params: { schedule: Schedule }) {
  const scheduleElement = params.schedule;
  let schedule = (await getSchedule()) ?? ({} as Schedule);

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
              (e) => e.idElement === element.idElement
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

  if (Object.keys(schedule).length == 0) {
    schedule = scheduleElement;
  } else {
    schedule = newSchedule;
  }

  await store.set("schedule", schedule);
}

export async function getSchedule(): Promise<Schedule | null> {
  return await store.get("schedule");
}
