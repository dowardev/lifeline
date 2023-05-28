<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closePage()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button v-if="!isPlatform('desktop')" id="open-modal-calendar"
            ><ion-icon :icon="calendarOutline"></ion-icon
          ></ion-button>

          <ion-button :disabled="v$.$invalid" @click="save()"
            ><ion-icon :icon="saveOutline"></ion-icon
          ></ion-button>

          <ion-button v-if="props.eventData" @click="deleteEvent()"
            ><ion-icon :icon="trashOutline" color="danger"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div>
        <section>
          <ion-row>
            <ion-col size-lg="7" size-xl="8">
              <!-- basic -->
              <ion-list>
                <ion-list-header>
                  <ion-label>Basico</ion-label>
                </ion-list-header>

                <!-- name -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="personOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
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
                          @ion-input="
                            event.name.value = $event.target.value as string
                          "
                          @ion-focus="
                            ($refs.inputName as any).$el.classList.add(
                              'ion-touched'
                            );
                            v$.event.name.$touch();
                          "
                        ></ion-input>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>

                <br />

                <!-- description -->
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div>
                        <div
                          style="
                            display: flex;
                            align-items: center;
                            height: 50px;
                          "
                        >
                          <ion-button fill="clear" :disabled="true"
                            ><ion-icon :icon="documentTextOutline"></ion-icon
                          ></ion-button>
                        </div>
                      </div>

                      <div style="width: 100%">
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
                            event.description.value = $event.target
                              .value as string
                          "
                        ></ion-textarea>
                      </div>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-list>

              <br />

              <!-- time -->
              <ion-list>
                <ion-list-header>
                  <ion-label>Tiempo</ion-label>
                </ion-list-header>
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div>
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="globeOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <!-- dates -->
                        <ion-textarea
                          label="Tiempo"
                          label-placement="floating"
                          fill="solid"
                          :value="
                            format(
                              new Date(event.reminders.value.start),
                              'Pp'
                            ) +
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
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="timeOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
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
                      </div>
                    </div>
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
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div>
                        <div
                          style="
                            display: flex;
                            align-items: center;
                            height: 50px;
                          "
                        >
                          <ion-button fill="clear" :disabled="true"
                            ><ion-icon :icon="peopleOutline"></ion-icon
                          ></ion-button>
                        </div>
                      </div>

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
                          :error-text="v2$.emailGuest.$errors[0]?.$message as string"
                          :class="[
                            v2$.emailGuest.$errors.length == 0
                              ? 'ion-valid'
                              : 'ion-invalid',
                          ]"
                          :value="emailGuest"
                          @ion-input="
                            emailGuest = $event.target.value as string
                          "
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
                          style="
                            display: flex;
                            align-items: center;
                            height: 50px;
                          "
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
                <ion-row>
                  <ion-col size-xs="11" size="10">
                    <div style="display: flex">
                      <div style="display: flex; align-items: center">
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="briefcaseOutline"></ion-icon
                        ></ion-button>
                      </div>

                      <div style="width: 100%">
                        <ion-item fill="solid">
                          <ion-select
                            placeholder="Disponibilidad"
                            ok-text="Confirmar"
                            cancel-text="Cancelar"
                            :value="event.availability.value"
                            :interface="
                              isPlatform('desktop') ? 'popover' : 'alert'
                            "
                            @ion-change="
                              event.availability.value = $event.target
                                .value as string
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
                      </div>
                    </div>
                  </ion-col>
                </ion-row>
              </ion-list>
            </ion-col>
          </ion-row>
        </section>

        <!-- calendar component -->
        <section
          v-if="isPlatform('desktop')"
          style="
            height: 72vh;
            overflow: auto;
            overflow-x: auto;
            position: fixed;
            top: 11vh;
            right: 1rem;
            width: 32%;
          "
          class="ion-padding hidde-scroll"
        >
          <CalendarComponent :events="useEvent().getEvents()" />
        </section>
      </div>

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
          @update-data-reminders="
            event.reminders.value = {
              start: $event.data.start,
              end: $event.data.end,
              notifications: $event.data.remindersChecked,
              repeat: $event.data.dateRepeat,
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
        <ion-header
          :translucent="true"
          collapse="fade"
          mode="ios"
          class="ion-no-border"
        >
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
} from "@ionic/vue";
import { onMounted, ref } from "vue";
import { format } from "date-fns";
import {
  addOutline,
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
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { email, helpers, required } from "@vuelidate/validators";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  eventData: { type: Object as () => Event, default: () => null },
});

// components
import CalendarComponent from "./calendar/CalendarComponent.vue";
import RemindersComponent from "../reminders/RemindersComponent.vue";

// composables
import { useEvent } from "@/composables/useEvent";
import { useSchedule } from "@/composables/useSchedule";
import { useSystem } from "@/composables/useSystem";
import { useReminder } from "@/composables/useReminder";

import {
  EventReminderNotification,
  EventReminderRepeat,
  Event,
  Schedule,
} from "@/utils/interfaces";
import { userRegister } from "@/services/session";
import { LocalNotifications } from "@capacitor/local-notifications";

const isOpenPopoverReminders = ref(false);
const timeZones = Intl.supportedValuesOf("timeZone").map(
  (timeZone) => timeZone
);
let isOpenPopoverTimezones = ref(false);
const filteredZones = ref(Array<string>());
const showButtonsOptionGuest = ref(-1);
// const repeats: string[] = [];
let emailGuest = ref("");
// event
const event = {
  name: ref(""),
  description: ref(""),
  reminders: ref({
    start: new Date().toISOString(),
    end: new Date().toISOString(),
    notifications: Array<string>(),
    repeat: { type: "daily", frecuency: 1 } as {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    },
  }),
  timezone: ref(Intl.DateTimeFormat().resolvedOptions().timeZone),
  guests: ref(Array<{ email: string }>()),
  availability: ref("available"),
};

// validation
const messageError = {
  email: "Correo electronico no valido",
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
  // if (props.idEvent != "") {
  //   await useEvent().loadEvents();
  //   pageTitle.value = "Actualizar evento";
  //   const event = useEvent().getEvent({ idEvent: props.idEvent });
  //   if (!event) return;
  //   setEvent({ event });
  // }
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

async function save() {
  let eventId = props.eventData?.id;
  let schedule: Schedule = useSchedule().getSchedule() ?? ({} as Schedule);

  try {
    if (!eventId) {
      eventId = (await saveEvent()).id;
    } else {
      await updateEvent();
    }

    await postCreateEvent({ eventId, schedule });
    closePage();
  } catch (error) {
    console.error(error);
  }
}

async function saveEvent(): Promise<{ id: string }> {
  const eventFormated = {
    name: event.name.value,
    guests: event.guests.value,
    reminders: {
      start: event.reminders.value.start,
      end: event.reminders.value.end,
      notifications: event.reminders.value.notifications,
      repeat: event.reminders.value.repeat,
    },
    description: event.description.value,
    availability: event.availability.value,
    timezone: event.timezone.value,
  };
  const { id } = await useEvent().saveEvent({
    event: JSON.parse(JSON.stringify(eventFormated)),
  });
  return { id };
}

async function updateEvent() {
  const eventFormated = {
    id: props.eventData.id,
    name: event.name.value,
    guests: event.guests.value,
    reminders: {
      start: event.reminders.value.start,
      end: event.reminders.value.end,
      notifications: event.reminders.value.notifications,
      repeat: event.reminders.value.repeat,
    },
    description: event.description.value,
    availability: event.availability.value,
    timezone: event.timezone.value,
  };

  await useEvent().updateEvent({
    event: JSON.parse(JSON.stringify(eventFormated)),
  });
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
  let repeat = params.repeat as keyof EventReminderRepeat;

  let result = useSystem().translateEventReminderRepeat({
    typeRepeat: repeat,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateDaysWeekRepear(params: { day: string }) {
  let day = params.day as any;

  let result = useSystem().translateDay({
    dayName: day,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateNotifications(params: { notification: string }) {
  let notification = params.notification as keyof EventReminderNotification;

  let result = useSystem().translateEventReminderNotification({
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

async function deleteEvent() {
  const { id } = props.eventData;
  await useEvent().deleteEvent({ eventId: id });
  let schedule: Schedule = useSchedule().getSchedule() ?? ({} as Schedule);
  schedule = useSchedule().removeElementSchedule({
    id,
    schedule,
  });
  await useSchedule().saveSchedule({ schedule });
  await useSchedule().loadSchedule();
  await closePage();
}

async function postCreateEvent(params: {
  eventId: string;
  schedule: Schedule;
}) {
  const { eventId } = params;
  let { schedule } = params;

  console.log(
    JSON.parse(
      JSON.stringify({
        id: new Date().getTime().toString(),
        idElement: eventId,
        title: event.name.value,
        message: event.description.value,
        startDate: new Date(event.reminders.value.start),
        endDate: new Date(event.reminders.value.end),
        type: "Event",
        reminder: event.reminders.value.notifications.length > 0 ? true : false,
        repeat: event.reminders.value.repeat,
      })
    )
  );
  const scheduleElement = useSchedule().generateScheduleElement({
    id: new Date().getTime().toString(),
    idElement: eventId,
    title: event.name.value,
    message: event.description.value,
    startDate: new Date(event.reminders.value.start),
    endDate: new Date(event.reminders.value.end),
    type: "Event",
    reminder: event.reminders.value.notifications.length > 0 ? true : false,
    repeat: event.reminders.value.repeat,
  });
  console.log(scheduleElement);

  if (eventId)
    schedule = useSchedule().removeElementSchedule({
      id: eventId,
      schedule,
    });

  schedule = useSchedule().generateEventSchedule({
    scheduleElement,
    schedule,
  });
  await useSchedule().saveSchedule({ schedule });
  await useSchedule().loadSchedule();

  const notifications = useReminder().getEventReminders({
    dateStart: event.reminders.value.start,
    notifications: event.reminders.value.notifications,
  });

  if (notifications) {
    await Promise.all(
      notifications.map(async (notification) => {
        await useSchedule().setReminders({
          id: new Date().getTime(),
          reminder: notification,
          title: event.name.value,
          message: event.description.value,
        });
      })
    );
  }
}
</script>

<style scoped>
.hidde-scroll::-webkit-scrollbar {
  display: none;
}
</style>
