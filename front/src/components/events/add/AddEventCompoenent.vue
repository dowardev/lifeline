<template>
  <ion-page>
    <ion-header :translucent="true" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closePage()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button v-if="props.eventData" @click="deleteEvent()"
            ><ion-icon :icon="trashOutline" color="danger"></ion-icon
          ></ion-button>

          <ion-button v-if="!isPlatform('desktop')" id="open-modal-calendar"
            ><ion-icon :icon="calendarOutline"></ion-icon
          ></ion-button>

          <ion-button :disabled="v$.$invalid" @click="save()"
            ><ion-icon :icon="saveOutline"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- form -->
      <ion-row class="container">
        <ion-col
          size-lg="7"
          size-xl="8"
          class="hidde-scroll-chrome hidde-scroll-others container"
        >
          <!-- basic -->
          <ion-list>
            <ion-list-header>
              <ion-label>Básico</ion-label>
            </ion-list-header>

            <!-- name -->
            <ion-row class="ion-padding">
              <ion-col size-xs="11" size="10">
                <ion-input
                  ref="inputName"
                  label="Nombre"
                  placeholder="Visita al dentista"
                  label-placement="floating"
                  fill="solid"
                  autocomplete="on"
                  autocorrect="on"
                  type="text"
                  :error-text="v$.event.name.$errors[0]?.$message as string"
                  :class="[
                    v$.event.name.$errors.length == 0
                      ? 'ion-valid'
                      : 'ion-invalid',
                  ]"
                  :value="event.name.value"
                  @ion-input="event.name.value = $event.target.value as string"
                  @ion-focus="
                    ($refs.inputName as any).$el.classList.add('ion-touched');
                    v$.event.name.$touch();
                  "
                ></ion-input>
              </ion-col>
            </ion-row>

            <br />

            <!-- description -->
            <ion-row class="ion-padding">
              <ion-col size-xs="11" size="10">
                <ion-textarea
                  placeholder="Visita rutinaria"
                  fill="solid"
                  label="Descripcion"
                  label-placement="floating"
                  :auto-grow="true"
                  autocomplete="on"
                  autocorrect="on"
                  type="text"
                  :value="event.description.value"
                  @ion-input="
                    event.description.value = $event.target.value as string
                  "
                ></ion-textarea>
              </ion-col>
            </ion-row>
          </ion-list>

          <br />

          <!-- time -->
          <ion-list>
            <ion-list-header>
              <ion-label>Tiempo</ion-label>
            </ion-list-header>

            <ion-row class="ion-padding">
              <ion-col size-xs="11" size="10">
                <div style="display: flex">
                  <div style="width: 100%">
                    <!-- dates -->
                    <ion-textarea
                      label="Tiempo"
                      label-placement="floating"
                      fill="solid"
                      :value="
                        format(new Date(event.reminders.value.start), 'Pp') +
                        '\n' +
                        format(new Date(event.reminders.value.end), 'Pp')
                      "
                      @click="
                        popoverRemindersSegment = 'date-start';
                        isOpenPopoverReminders = true;
                      "
                    ></ion-textarea>

                    <!-- notifications -->
                    <section
                      v-if="event.reminders.value.notifications.length > 0"
                    >
                      <ion-textarea
                        label="Notificaciones"
                        label-placement="floating"
                        fill="solid"
                        :value="formatTextNotifications()"
                        @click="
                          popoverRemindersSegment = 'reminders';
                          isOpenPopoverReminders = true;
                        "
                      ></ion-textarea>
                    </section>

                    <!-- repeat -->
                    <section v-if="event.reminders.value.repeat">
                      <ion-textarea
                        label="Repetir"
                        label-placement="floating"
                        fill="solid"
                        :value="formatTextRepeat()"
                        @click="
                          popoverRemindersSegment = 'repeats';
                          isOpenPopoverReminders = true;
                        "
                      ></ion-textarea>
                    </section>
                  </div>
                </div>
              </ion-col>
            </ion-row>

            <br />

            <!-- time zone -->
            <ion-row class="ion-padding">
              <ion-col size-xs="11" size="10">
                <ion-item
                  fill="solid"
                  lines="none"
                  @click="isOpenPopoverTimezones = true"
                >
                  <ion-label>Zona horaria</ion-label>
                  <ion-label slot="end" class="ion-text-wrap"
                    >{{ event.timezone.value }}
                  </ion-label>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-list>

          <br />

          <!-- others -->
          <ion-list>
            <ion-list-header>
              <ion-label>Otros</ion-label>
            </ion-list-header>

            <!-- guests -->
            <ion-row class="ion-padding">
              <ion-col size-xs="11" size="10">
                <div style="display: flex">
                  <div style="width: 100%">
                    <ion-input
                      ref="inputGuest"
                      label="Invitados"
                      label-placement="floating"
                      fill="solid"
                      placeholder="Correo electronico"
                      autocomplete="on"
                      autocorrect="on"
                      type="email"
                      :error-text="
                            v2$.emailGuest.$errors[0]?.$message as string
                          "
                      :class="[
                        v2$.emailGuest.$errors.length == 0
                          ? 'ion-valid'
                          : 'ion-invalid',
                      ]"
                      :value="emailGuest"
                      @ion-input="emailGuest = $event.target.value as string"
                      @ion-focus="
                        ($refs.inputGuest as any).$el.classList.add(
                          'ion-touched'
                        )
                      "
                      @ion-blur="
                        ($refs.inputGuest as any).$el.classList.remove(
                          'ion-touched'
                        );
                        v2$.emailGuest.$touch();
                      "
                    ></ion-input>

                    <ion-item
                      v-for="(guest, indexGuest) in event.guests.value"
                      :key="indexGuest"
                      @mouseenter="showButtonsOptionGuest = indexGuest"
                      @mouseleave="showButtonsOptionGuest = -1"
                    >
                      <ion-label>{{ guest.email }}</ion-label>

                      <ion-button
                        v-if="showButtonsOptionGuest === indexGuest"
                        fill="clear"
                        color="danger"
                        @click="removeGuest({ index: indexGuest })"
                        ><ion-icon :icon="trashOutline"></ion-icon
                      ></ion-button>
                    </ion-item>
                  </div>

                  <div>
                    <div
                      style="display: flex; align-items: center; height: 50px"
                    >
                      <ion-button
                        fill="clear"
                        :disabled="v2$.$invalid"
                        @click="addGuest()"
                        ><ion-icon :icon="addOutline"></ion-icon
                      ></ion-button>
                    </div>
                  </div>
                </div>
              </ion-col>
            </ion-row>

            <br />

            <!-- availability -->
            <ion-row class="ion-padding">
              <ion-col size-xs="11" size="10">
                <ion-item fill="solid">
                  <ion-select
                    placeholder="Disponibilidad"
                    ok-text="Confirmar"
                    cancel-text="Cancelar"
                    :value="event.availability.value"
                    :interface="isPlatform('desktop') ? 'popover' : 'alert'"
                    @ion-change="
                      event.availability.value = $event.target.value as string
                    "
                  >
                    <ion-select-option value="available"
                      >Disponible</ion-select-option
                    >
                    <ion-select-option value="unavailable"
                      >Ocupado</ion-select-option
                    >
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-col>

        <ion-col size-lg="5" size-xl="4" class="container">
          <div class="center">
            <ion-item lines="none">
              <ion-button
                fill="clear"
                @click="currentDate = sub(currentDate, { days: 1 })"
                ><ion-icon :icon="arrowBackOutline"></ion-icon
              ></ion-button>

              <ion-datetime-button
                datetime="datetime-availability"
              ></ion-datetime-button>

              <ion-button
                fill="clear"
                @click="currentDate = add(currentDate, { days: 1 })"
                ><ion-icon :icon="arrowForwardOutline"></ion-icon
              ></ion-button>
            </ion-item>
          </div>

          <div>
            <ion-card id="card">
              <ion-card-content style="height: 73dvh">
                <CalendarDayComponent
                  :events-data="generateCalendar || []"
                  :date="currentDate"
                  :show-current-day="false"
                />
              </ion-card-content>
            </ion-card>
          </div>
        </ion-col>
      </ion-row>

      <!-- popovers -->
      <!-- popover reminders -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverReminders"
        :backdrop-dismiss="false"
        @will-dismiss="isOpenPopoverReminders = false"
      >
        <RemindersComponent
          :dates="{
            start: event.reminders.value.start,
            end: event.reminders.value.end,
          }"
          :segment-option="popoverRemindersSegment"
          :notifications="event.reminders.value.notifications"
          :repeat="event.reminders.value.repeat"
          :id-reminders="event.reminders.value.idReminders"
          @update-data-reminders="
            event.reminders.value = {
              start: $event.data.start,
              end: $event.data.end,
              notifications: $event.data.remindersChecked,
              repeat: $event.data.dateRepeat,
              idReminders: $event.data.idReminders,
            }
          "
        />
      </ion-popover>

      <!-- popover timezones -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverTimezones"
        :backdrop-dismiss="false"
      >
        <ion-header mode="ios">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="isOpenPopoverTimezones = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>Zona horaria</ion-title>
          </ion-toolbar>

          <ion-toolbar>
            <ion-searchbar
              :debounce="500"
              show-cancel-button="focus"
              @ion-input="filterZones($event.target.value as string)"
              @ion-cancel="filteredZones.length = 0"
              @ion-clear="filteredZones.length = 0"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div v-if="filteredZones.length == 0">
            <ion-item
              v-for="(timezoneElement, index) in timeZones"
              :key="index"
              button
              @click="selectZone({ zone: timezoneElement as any })"
              ><ion-label>{{ timezoneElement }}</ion-label></ion-item
            >
          </div>

          <!-- search time zone -->
          <div v-if="filteredZones.length > 0">
            <ion-item
              v-for="(timezoneElement, index) in filteredZones"
              :key="index"
              button
              @click="selectZone({ zone: timezoneElement })"
              ><ion-label>{{ timezoneElement }}</ion-label></ion-item
            >
          </div>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->

      <!-- modals -->
      <ion-modal trigger="open-modal-calendar">
        <ion-header :translucent="true" class="ion-no-border" mode="ios">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="modalController.dismiss()"
                ><ion-icon :icon="closeOutline"></ion-icon
              ></ion-button>
            </ion-buttons>

            <ion-title>Calendario</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <CalendarComponent />
        </ion-content>
      </ion-modal>

      <ion-modal ref="modalDatetimeAvailability" :keep-contents-mounted="true">
        <ion-header :translucent="true" mode="ios" class="ion-no-border">
          <ion-toolbar
            style="
              --background: var(--ion-background-light-color);
              --opacity: 1;
            "
          >
            <ion-buttons slot="start">
              <ion-button @click="closeModalDatetimeAvailability()"
                ><ion-icon :icon="closeOutline"></ion-icon
              ></ion-button>
            </ion-buttons>

            <ion-title>Selector</ion-title>

            <ion-buttons slot="end">
              <ion-button @click="currentDate = new Date()"
                ><ion-icon :icon="todayOutline"></ion-icon
              ></ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-datetime
          id="datetime-availability"
          ref="datetimeAvailability"
          presentation="date"
          :value="currentDate.toISOString()"
          @ion-change="currentDate = new Date($event.detail.value as any)"
        >
        </ion-datetime>
      </ion-modal>
      <!-- end modals -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRow,
  IonCol,
  IonInput,
  IonButton,
  IonPopover,
  IonSearchbar,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  isPlatform,
  IonItem,
  IonLabel,
  IonModal,
  modalController,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
} from "@ionic/vue";
import { computed, onMounted, ref, watch } from "vue";
import { add, compareAsc, format, getDay, sub } from "date-fns";
import {
  addOutline,
  arrowBackOutline,
  arrowForwardOutline,
  briefcaseOutline,
  calendarOutline,
  closeOutline,
  documentTextOutline,
  globeOutline,
  peopleOutline,
  personOutline,
  saveOutline,
  timeOutline,
  trashOutline,
  todayOutline,
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  eventData: { type: Object as () => Event, default: () => null },
});

const emits = defineEmits(["create", "update", "delete"]);

// components
import CalendarComponent from "./calendar/CalendarComponent.vue";
import RemindersComponent from "../reminders/RemindersComponent.vue";
import CalendarDayComponent from "@/components/calendar/day/CalendarDayComponent.vue";

// controllers
import { EventController } from "@/controllers/eventController";
import { ScheduleController } from "@/controllers/scheduleController";
import { SystemController } from "@/controllers/systemController";
import { ReminderController } from "@/controllers/reminderController";
import { CalendarController } from "@/js/calendarController";
const eventController = new EventController();
const scheduleController = new ScheduleController();
const systemController = new SystemController();
const reminderController = new ReminderController();
const calendarController = new CalendarController();

// interface
import {
  EventReminderNotification,
  EventReminderRepeat,
  Event,
  Schedule,
} from "@/utils/interfaces";

const isOpenPopoverReminders = ref(false);
const timeZones = (Intl as any)
  .supportedValuesOf("timeZone")
  .map((timeZone: string) => timeZone);
const isOpenPopoverTimezones = ref(false);
const filteredZones = ref(Array<string>());
const showButtonsOptionGuest = ref(-1);
// const repeats: string[] = [];
const emailGuest = ref("");
// event
const event = {
  name: ref(""),
  description: ref(""),
  reminders: ref({
    start: new Date() as Date,
    end: new Date() as Date,
    notifications: Array<string>(),
    repeat: { type: "daily", frecuency: 1 } as {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    },
    idReminders: [],
  }),
  timezone: ref(Intl.DateTimeFormat().resolvedOptions().timeZone),
  guests: ref(Array<{ email: string }>()),
  availability: ref("available"),
};
const events = ref([] as Event[]);
const currentDate = ref(
  calendarController.getCurrentDate({
    mode: calendarController.getCalendarModeView(),
  }) ?? new Date()
);
const modalDatetimeAvailability = ref();
const closeModalDatetimeAvailability = (): void =>
  modalDatetimeAvailability.value.$el.dismiss();

// validation
const messageError = {
  email: "Correo electrónico no valido",
  required: "Campo requerido",
};
const rules = {
  event: {
    name: {
      required: helpers.withMessage(messageError.required, required),
    },
  },
};
const rulesGuest = {
  emailGuest: {
    required: helpers.withMessage(messageError.required, required),
    email: helpers.withMessage(messageError.email, email),
  },
};
const v$ = useVuelidate(rules, { event });
const v2$ = useVuelidate(rulesGuest, { emailGuest });
// inputs
const inputName = ref(null);
const inputGuest = ref(null);

const pageTitle = ref("Agregar evento");
const popoverRemindersSegment = ref("date-start");

// mounted
onMounted(async () => {
  if (props.eventData) {
    pageTitle.value = "Actualizar evento";
    setEvent({ event: props.eventData });
  }
  events.value = await eventController.getEvents();
});

// computed
const generateCalendar = computed(() => {
  if (events.value.length == 0) return;
  const response = groupEvents({ events: events.value });
  return flattenEvents({ events: response });
});

// functions
const filterZones = (query: string) => {
  filteredZones.value = timeZones.filter((zone: string) =>
    zone.toLowerCase().includes(query.toLowerCase())
  );
};

const selectZone = (params: { zone: string }) => {
  const zone = params.zone;
  event.timezone.value = zone;
  isOpenPopoverTimezones.value = false;
};

const addGuest = () => {
  const email = emailGuest.value;
  event.guests.value.push({ email });
  emailGuest.value = "";
};

const removeGuest = (params: { index: number }) => {
  const index = params.index;
  event.guests.value.splice(index, 1);
};

async function save(): Promise<void> {
  const eventData = props.eventData ?? ({} as Event);

  try {
    eventData.name = event.name.value;
    eventData.guests = event.guests.value;
    eventData.reminders = {
      start: new Date(event.reminders.value.start),
      end: new Date(event.reminders.value.end),
      notifications: event.reminders.value.notifications,
      repeat: event.reminders.value.repeat,
      idReminders: event.reminders.value.idReminders,
    };
    eventData.description = event.description.value;
    eventData.availability = event.availability.value;
    eventData.timezone = event.timezone.value;

    if (!props.eventData) {
      emits("create", { data: { event: eventData } });
    } else {
      emits("update", { data: { event: eventData } });
    }
    closePage();
  } catch (error) {
    console.error(error);
  }
}

function formatTextNotifications() {
  let text = "";
  const len = event.reminders.value.notifications.length - 1;
  let index = 0;

  event.reminders.value.notifications.forEach((notification) => {
    if (len > index) text += translateNotifications({ notification }) + ", ";
    else text += translateNotifications({ notification });
    index++;
  });
  return text;
}

function formatTextRepeat() {
  const type = event.reminders.value.repeat.type;
  let text = translateRepeat({
    repeat: type,
  });
  const len = event.reminders.value.repeat.daysWeek?.length! - 1;
  let index = 0;
  let days = "";

  event.reminders.value.repeat.daysWeek?.forEach((day) => {
    if (len > index) days += translateDaysWeekRepear({ day }) + ", ";
    else days += translateDaysWeekRepear({ day });
    index++;
  });
  if (days != "") text = `${text}(${days})`;

  return text;
}

function translateRepeat(params: { repeat: string }) {
  const repeat = params.repeat as keyof EventReminderRepeat;

  let result = systemController.translateEventReminderRepeat({
    typeRepeat: repeat,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateDaysWeekRepear(params: { day: string }) {
  const day = params.day as any;

  let result = systemController.translateDay({
    dayName: day,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateNotifications(params: { notification: string }) {
  const notification = params.notification as keyof EventReminderNotification;

  const result = systemController.translateEventReminderNotification({
    notificationName: notification,
  });
  return result;
}

async function closePage() {
  await modalController.dismiss();
}

function setEvent(params: { event: Event }) {
  const eventData = params.event;
  event.name.value = eventData.name!;
  event.description.value = eventData.description;
  event.reminders.value.start = eventData.reminders!.start;
  event.reminders.value.end = eventData.reminders!.end;
  event.reminders.value.notifications =
    eventData.reminders!.notifications ?? [];
  event.reminders.value.repeat = eventData.reminders!.repeat;
  event.timezone.value = eventData.timezone!;
  event.guests.value = eventData.guests!;
  event.availability.value = eventData.availability!;
}

async function deleteEvent(): Promise<void> {
  const { id } = props.eventData;
  emits("delete", { data: { id } });
  await closePage();
}

async function postCreateEvent(params: {
  eventId: string;
  schedule: Schedule;
}) {
  const { eventId } = params;
  let { schedule } = params;
  const scheduleId = (Math.floor(Math.random() * 900) + 100).toString();

  const scheduleElement = scheduleController.generateScheduleElement({
    id: scheduleId,
    idElement: eventId,
    title: event.name.value,
    message: event.description.value,
    startDate: new Date(event.reminders.value.start),
    endDate: new Date(event.reminders.value.end),
    type: "Event",
    reminder: event.reminders.value.notifications.length > 0 ? true : false,
    repeat: event.reminders.value.repeat,
  });

  if (eventId)
    schedule = scheduleController.removeElementSchedule({
      id: eventId,
      schedule,
    });

  schedule = scheduleController.generateEventSchedule({
    scheduleElement,
    schedule,
  });
  await scheduleController.saveSchedule({ schedule });
  await scheduleController.loadSchedule();

  const notifications = reminderController.getEventReminders({
    dateStart: event.reminders.value.start,
    notifications: event.reminders.value.notifications,
  });

  if (notifications) {
    await Promise.all(
      notifications.map(async (notification) => {
        await scheduleController.setReminders({
          id: parseInt(scheduleId),
          reminder: notification,
          title: event.name.value,
          message: event.description.value,
        });
      })
    );
  }
}

function groupEvents(params: { events: Event[] }): {
  [year: string]: {
    [month: string]: {
      [day: string]: {
        [time: string]: {
          id: number;
          name: string;
          reminders: any;
        }[];
      };
    };
  };
} {
  const events = systemController.cloneObjet({
    obj: params.events,
  }) as Event[];

  return events.reduce(
    (
      groupedEvents: {
        [year: string]: {
          [month: string]: {
            [day: string]: {
              [time: string]: {
                id: number;
                name: string;
                reminders: any;
              }[];
            };
          };
        };
      },
      event: Event
    ) => {
      const reminderStart = event.reminders.start;
      const reminderEnd = event.reminders.end;
      const repeatType = event.reminders.repeat?.type ?? "daily";
      const daysWeek = event.reminders.repeat!.daysWeek;
      const frecuency = event.reminders.repeat?.frecuency ?? 1;

      reminderStart.setMilliseconds(0);
      reminderStart.setSeconds(0);

      const dates = eachPeriodOfInterval({
        start: reminderStart,
        end: reminderEnd,
        repeatType,
        frecuency,
        daysWeek,
      }).dates;

      dates.forEach((date) => {
        const yearKey = date.getFullYear().toString();
        const monthKey = (date.getMonth() + 1).toString();
        const dayKey = date.getDate().toString();
        const timeKey = `${date.getHours().toString()}:00`;

        if (!groupedEvents[yearKey]) {
          groupedEvents[yearKey] = {};
        }

        if (!groupedEvents[yearKey][monthKey]) {
          groupedEvents[yearKey][monthKey] = {};
        }

        if (!groupedEvents[yearKey][monthKey][dayKey]) {
          groupedEvents[yearKey][monthKey][dayKey] = {};
        }

        if (!groupedEvents[yearKey][monthKey][dayKey][timeKey]) {
          groupedEvents[yearKey][monthKey][dayKey][timeKey] = [];
        }

        groupedEvents[yearKey][monthKey][dayKey][timeKey].push({
          id: event.id!,
          name: event.name ?? "",
          reminders: event.reminders,
        });

        // Ordenar los eventos por hora
        groupedEvents[yearKey][monthKey][dayKey][timeKey].sort((a, b) => {
          const aTime =
            a.reminders.start.getHours() * 60 + a.reminders.start.getMinutes();
          const bTime =
            b.reminders.start.getHours() * 60 + b.reminders.start.getMinutes();
          return aTime - bTime;
        });
      });

      return groupedEvents;
    },
    {} as {
      [year: string]: {
        [month: string]: {
          [day: string]: {
            [time: string]: {
              id: number;
              name: string;
              reminders: any;
            }[];
          };
        };
      };
    }
  );
}

function eachPeriodOfInterval(params: {
  start: Date;
  end: Date;
  repeatType: string;
  frecuency: number;
  daysWeek?: string[];
}): { dates: Date[] } {
  const { end, repeatType, frecuency, daysWeek } = params;
  let { start: currentDate } = params;
  const dates = [];

  const repeatDict = {
    daily: "days",
    weekly: "weeks",
    monthly: "months",
    annually: "years",
  };

  const rep = repeatDict[repeatType as keyof typeof repeatDict];

  while (compareAsc(currentDate, end) <= 0) {
    if (repeatType === "weekly" && daysWeek) {
      const daysOfWeekNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      for (let i = 0; i < 7; i++) {
        if (
          daysWeek
            .map((day) => day.toLowerCase())
            .includes(daysOfWeekNames[getDay(currentDate)])
        ) {
          dates.push(new Date(currentDate));
        }
        currentDate = add(currentDate, { days: 1 });
      }
    } else {
      dates.push(new Date(currentDate));
      currentDate = add(currentDate, { [rep]: frecuency });
    }
  }

  return { dates };
}

function flattenEvents(params: {
  events: {
    [year: string]: {
      [month: string]: {
        [day: string]: {
          [time: string]: {
            id: number;
            name: string;
            reminders: any;
          }[];
        };
      };
    };
  };
}): {
  year: string;
  month: string;
  day: string;
  time: string;
  id: number;
  name: string;
  reminders: any;
}[] {
  const { events } = params;
  const flattened = [];

  for (const year in events) {
    for (const month in events[year]) {
      for (const day in events[year][month]) {
        for (const time in events[year][month][day]) {
          if (Array.isArray(events[year][month][day][time])) {
            for (const event of events[year][month][day][time]) {
              flattened.push({
                year: year,
                month: month,
                day: day,
                time: time,
                id: event.id,
                name: event.name,
                reminders: event.reminders,
              });
            }
          }
        }
      }
    }
  }
  return flattened;
}
</script>

<style scoped>
.hidde-scroll-chrome::-webkit-scrollbar {
  display: none;
}
.hidde-scroll-others {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
@media only screen and (min-width: 1024px) and (max-width: 1280px) {
  .form-container {
    height: 85vh;
    overflow: auto;
  }
  .calendar-container {
    height: 75vh;
  }
}

@media only screen and (min-width: 1281px) {
  .form-container {
    height: 85vh;
    overflow: auto;
  }
  .calendar-container {
    height: 75vh;
  }
}

.container {
  height: 84dvh;
  overflow: auto;
}
</style>
