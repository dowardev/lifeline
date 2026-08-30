<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

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

          <ion-button :disabled="v$.$invalid" @click="save()"
            ><ion-icon :icon="saveOutline"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="event-form-content">
      <ion-grid style="height: 100%">
        <ion-row style="height: 100%">
          <!-- left column: form -->
          <ion-col
            v-show="!(isMobile && showMobileCalendar)"
            size-lg="7"
            size-xl="8"
            class="container form-column"
          >
            <div class="form-wrapper">
              <!-- basic -->
              <ion-row>
                <ion-col size-xs="11" size="10">
                  <ion-list>
                    <ion-list-header>
                      <ion-label>Básico</ion-label>
                    </ion-list-header>

                    <ion-card class="shadow1">
                      <!-- name -->
                      <ion-item class="transparent" lines="full">
                        <ion-input
                          ref="inputName"
                          label="Nombre"
                          placeholder="Visita al dentista"
                          label-placement="floating"
                          autocomplete="on"
                          autocorrect="on"
                          type="text"
                          :error-text="v$.event.name.$errors[0]?.$message as string"
                          :class="[v$.event.name.$errors.length == 0 ? 'ion-valid' : 'ion-invalid']"
                          :value="event.name.value"
                          @ion-input="event.name.value = $event.target.value as string"
                          @ion-focus="
                            ($refs.inputName as any).$el.classList.add('ion-touched');
                            v$.event.name.$touch();
                          "
                        ></ion-input>
                      </ion-item>

                      <!-- description -->
                      <ion-item class="transparent" lines="full">
                        <ion-textarea
                          placeholder="Visita rutinaria"
                          label="Descripcion"
                          label-placement="floating"
                          :auto-grow="true"
                          autocomplete="on"
                          autocorrect="on"
                          type="text"
                          :value="event.description.value"
                          @ion-input="event.description.value = $event.target.value as string"
                        ></ion-textarea>
                      </ion-item>
                    </ion-card>
                  </ion-list>
                </ion-col>
              </ion-row>

              <!-- time -->
              <ion-row>
                <ion-col size-xs="11" size="10">
                  <ion-list>
                    <ion-list-header>
                      <ion-label>Tiempo</ion-label>
                      <ion-button v-if="isMobile" fill="clear" @click="showMobileCalendar = true">
                        Disponibilidad
                      </ion-button>
                    </ion-list-header>

                    <ion-card class="shadow1">
                      <!-- dates -->
                      <ion-item class="transparent" lines="full">
                        <ion-textarea
                          label="Tiempo"
                          label-placement="floating"
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
                      </ion-item>

                      <!-- notifications -->
                      <ion-item
                        v-if="event.reminders.value.notifications.length > 0"
                        class="transparent"
                        lines="full"
                      >
                        <ion-textarea
                          label="Notificaciones"
                          label-placement="floating"
                          :value="formatTextNotifications()"
                          @click="
                            popoverRemindersSegment = 'reminders';
                            isOpenPopoverReminders = true;
                          "
                        ></ion-textarea>
                      </ion-item>

                      <!-- repeat -->
                      <ion-item v-if="event.reminders.value.repeat" class="transparent">
                        <ion-textarea
                          label="Repetir"
                          label-placement="floating"
                          :value="formatTextRepeat()"
                          @click="
                            popoverRemindersSegment = 'repeats';
                            isOpenPopoverReminders = true;
                          "
                        ></ion-textarea>
                      </ion-item>

                      <!-- time zone -->
                      <ion-item
                        class="transparent"
                        lines="full"
                        @click="isOpenPopoverTimezones = true"
                      >
                        <ion-label>Zona horaria</ion-label>
                        <ion-label slot="end" class="ion-text-wrap"
                          >{{ event.timezone.value }}
                        </ion-label>
                      </ion-item>
                    </ion-card>
                  </ion-list>
                </ion-col>
              </ion-row>

              <!-- others -->
              <ion-row>
                <ion-col size-xs="11" size="10">
                  <ion-list>
                    <ion-list-header>
                      <ion-label>Otros</ion-label>
                    </ion-list-header>

                    <ion-card class="shadow1">
                      <!-- guests -->
                      <div style="display: flex">
                        <div style="width: 100%">
                          <ion-item lines="full" class="transparent">
                            <ion-input
                              ref="inputGuest"
                              label="Invitados"
                              label-placement="floating"
                              placeholder="Correo electronico"
                              autocomplete="on"
                              autocorrect="on"
                              type="email"
                              :error-text="v2$.emailGuest.$errors[0]?.$message as string"
                              :class="[
                                v2$.emailGuest.$errors.length == 0 ? 'ion-valid' : 'ion-invalid',
                              ]"
                              :value="emailGuest"
                              @ion-input="emailGuest = $event.target.value as string"
                              @ion-focus="
                                ($refs.inputGuest as any).$el.classList.add('ion-touched')
                              "
                              @ion-blur="
                                ($refs.inputGuest as any).$el.classList.remove('ion-touched');
                                v2$.emailGuest.$touch();
                              "
                            ></ion-input>
                          </ion-item>
                        </div>

                        <div>
                          <div style="display: flex; align-items: center; height: 50px">
                            <ion-button fill="clear" :disabled="v2$.$invalid" @click="addGuest()"
                              ><ion-icon :icon="addOutline"></ion-icon
                            ></ion-button>
                          </div>
                        </div>
                      </div>
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

                      <!-- availability -->
                      <ion-item lines="full" class="transparent">
                        <ion-select
                          placeholder="Disponibilidad"
                          ok-text="Confirmar"
                          cancel-text="Cancelar"
                          :value="event.availability.value"
                          :interface="isPlatform('desktop') ? 'popover' : 'alert'"
                          @ion-change="event.availability.value = $event.target.value as string"
                        >
                          <ion-select-option value="available">Disponible</ion-select-option>
                          <ion-select-option value="unavailable">Ocupado</ion-select-option>
                        </ion-select>
                      </ion-item>
                    </ion-card>
                  </ion-list>
                </ion-col>
              </ion-row>
            </div>
          </ion-col>

          <!-- right column: calendar -->
          <ion-col
            v-show="!isMobile || showMobileCalendar"
            size-lg="5"
            size-xl="4"
            class="container calendar-column"
          >
            <div v-show="isMobile && showMobileCalendar">
              <ion-item lines="none">
                <ion-button fill="clear" @click="showMobileCalendar = false">
                  Cerrar calendario
                </ion-button>
              </ion-item>
            </div>

            <div class="center ion-padding-bottom">
              <ion-item lines="none">
                <ion-button fill="clear" @click="currentDate = sub(currentDate, { days: 1 })"
                  ><ion-icon :icon="arrowBackOutline"></ion-icon
                ></ion-button>

                <ion-datetime-button datetime="datetime-availability"></ion-datetime-button>

                <ion-button fill="clear" @click="currentDate = add(currentDate, { days: 1 })"
                  ><ion-icon :icon="arrowForwardOutline"></ion-icon
                ></ion-button>
              </ion-item>
            </div>

            <div class="calendar-wrapper">
              <FullyCalendarVue3
                :events="calendarEvents"
                :current-view="'day'"
                :current-date="currentDate"
                :is-mobile="isMobile"
                @date-click="onCalendarDateClick"
              />
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>

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
      <ion-modal ref="modalDatetimeAvailability" :keep-contents-mounted="true">
        <ion-header :translucent="true" mode="ios" class="ion-no-border">
          <ion-toolbar style="--background: var(--ion-background-light-color); --opacity: 1">
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
// 1. Imports (ionic/vue/ionicons)
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRow,
  IonCol,
  IonGrid,
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
} from '@ionic/vue';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { add, format, sub } from 'date-fns';
import {
  addOutline,
  arrowBackOutline,
  arrowForwardOutline,
  closeOutline,
  saveOutline,
  trashOutline,
  todayOutline,
} from 'ionicons/icons';
import useVuelidate from '@vuelidate/core';
import { email, helpers, maxLength, required } from '@vuelidate/validators';
import { db } from '@/db';

// 2. Controllers / Composables
import { EventController } from '@/controllers/eventController';
import { SystemController } from '@/controllers/systemController';
import { CalendarController } from '@/controllers/calendarController';
const eventController = new EventController();
const systemController = new SystemController();
const calendarController = new CalendarController();

// 3. Components
import FullyCalendarVue3 from '@/components/calendar/fullcalendar/FullyCalendarVue3.vue';
import RemindersComponent from '../reminders/RemindersComponent.vue';

// 4. Interface and types imports
import type { EventReminderNotification, EventReminderRepeat, Event } from '@/utils/interfaces';
import type { EventItem } from '@/store/eventStore';

// 5. Main (props, emits)
const props = defineProps({
  eventData: { type: Object as () => Event, default: () => null },
  initialDate: { type: Object as () => Date | null, default: () => null },
  initialEndDate: { type: Object as () => Date | null, default: () => null },
});

const emits = defineEmits(['create', 'update', 'delete']);

// 6. Vars and const
const isOpenPopoverReminders = ref(false);
const timeZones = (Intl as any).supportedValuesOf('timeZone').map((timeZone: string) => timeZone);
const isOpenPopoverTimezones = ref(false);
const filteredZones = ref(Array<string>());
const showButtonsOptionGuest = ref(-1);
const emailGuest = ref('');
const event = {
  name: ref(''),
  description: ref(''),
  reminders: ref({
    start: new Date() as Date,
    end: new Date() as Date,
    notifications: Array<string>(),
    repeat: { type: 'daily', frecuency: 1 } as {
      frecuency: number;
      type: 'daily' | 'weekly' | 'monthly' | 'annually';
      daysWeek?: string[];
    },
    idReminders: [],
  }),
  timezone: ref(Intl.DateTimeFormat().resolvedOptions().timeZone),
  guests: ref(Array<{ email: string }>()),
  availability: ref('available'),
};

const currentDate = ref(
  calendarController.getCurrentDate({
    mode: calendarController.getCalendarModeView(),
  }) ?? new Date(),
);
const modalDatetimeAvailability = ref();
const closeModalDatetimeAvailability = (): void => modalDatetimeAvailability.value.$el.dismiss();
const isMobile = ref(window.innerWidth < 768);
const showMobileCalendar = ref(false);
const calendarEvents = computed<EventItem[]>(() => eventController.getEvents());
const messageError = {
  email: 'Correo electrónico no valido',
  required: 'Campo requerido',
};
const rules = {
  event: {
    name: {
      required: helpers.withMessage(messageError.required, required),
      maxLength: helpers.withMessage('Máximo 255 caracteres', maxLength(255)),
    },
    reminders: {
      start: {
        required: helpers.withMessage(messageError.required, required),
      },
      end: {
        required: helpers.withMessage(messageError.required, required),
      },
    },
    timeZone: {
      required: helpers.withMessage(messageError.required, required),
      maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100)),
    },
    availability: {
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
const inputName = ref(null);
const inputGuest = ref(null);
const pageTitle = ref('Agregar evento');
const popoverRemindersSegment = ref('date-start');

// 7. Watch
watch(
  () => props.eventData,
  (val) => {
    console.log('[AdminEventComponent] eventData received:', val);
    if (val) setEvent({ event: val });
  },
  { immediate: true },
);

watch(
  () => props.initialDate,
  (val) => {
    if (val) {
      event.reminders.value.start = val;
      event.reminders.value.end = props.initialEndDate
        ? props.initialEndDate
        : new Date(val.getTime() + 30 * 60 * 1000);
    }
  },
  { immediate: true },
);

watch(showMobileCalendar, (val) => {
  if (val) {
    nextTick(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }
});

// 8. Computed
// (calendarEvents computed defined above in vars/const)

// 9. OnMounted
onMounted(async () => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener('resize', onResize);
  if (props.eventData) {
    pageTitle.value = 'Actualizar evento';
    setEvent({ event: props.eventData });
  }
  await loadStoredEvents();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

// 10. Functions (named parameters pattern)
function onResize(): void {
  isMobile.value = window.innerWidth < 768;
}

async function loadStoredEvents(): Promise<void> {
  const storeEvents = eventController.getEvents();
  if (storeEvents.length > 0) return;
  try {
    const localEvents = await db.events.limit(200).toArray();
    if (localEvents.length > 0) {
      eventController.setEvents({ events: localEvents as EventItem[] });
    }
  } catch (e) {
    console.warn('[AdminEventComponent] No events in IndexedDB:', e);
  }
}

const filterZones = (query: string): void => {
  filteredZones.value = timeZones.filter((zone: string) =>
    zone.toLowerCase().includes(query.toLowerCase()),
  );
};

const selectZone = (params: { zone: string }): void => {
  const zone = params.zone;
  event.timezone.value = zone;
  isOpenPopoverTimezones.value = false;
};

const addGuest = (): void => {
  const email = emailGuest.value;
  event.guests.value.push({ email });
  emailGuest.value = '';
};

const removeGuest = (params: { index: number }): void => {
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
      emits('create', { data: { event: eventData } });
    } else {
      emits('update', { data: { event: eventData } });
    }
    closePage();
  } catch (error) {
    console.error(error);
  }
}

function formatTextNotifications(): string {
  let text = '';
  const len = event.reminders.value.notifications.length - 1;
  let index = 0;

  event.reminders.value.notifications.forEach((notification) => {
    if (len > index) text += translateNotifications({ notification }) + ', ';
    else text += translateNotifications({ notification });
    index++;
  });
  return text;
}

function formatTextRepeat(): string {
  const type = event.reminders.value.repeat.type;
  let text = translateRepeat({
    repeat: type,
  });
  const len = (event.reminders.value.repeat.daysWeek?.length ?? 0) - 1;
  let index = 0;
  let days = '';

  event.reminders.value.repeat.daysWeek?.forEach((day) => {
    if (len > index) days += translateDaysWeekRepear({ day }) + ', ';
    else days += translateDaysWeekRepear({ day });
    index++;
  });
  if (days != '') text = `${text}(${days})`;

  return text;
}

function translateRepeat(params: { repeat: string }): string {
  const repeat = params.repeat as keyof EventReminderRepeat;

  let result = systemController.translateEventReminderRepeat({
    typeRepeat: repeat,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateDaysWeekRepear(params: { day: string }): string {
  const day = params.day as any;

  let result = systemController.translateDay({
    dayName: day,
  });
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function translateNotifications(params: { notification: string }): string {
  const notification = params.notification as keyof EventReminderNotification;

  const result = systemController.translateEventReminderNotification({
    notificationName: notification,
  });
  return result;
}

async function closePage(): Promise<void> {
  await modalController.dismiss();
}

function onCalendarDateClick(params: { date: Date; endDate?: Date }): void {
  event.reminders.value.start = params.date;
  event.reminders.value.end = params.endDate || new Date(params.date.getTime() + 30 * 60 * 1000);
  showMobileCalendar.value = false;
}

function setEvent(params: { event: Event }): void {
  const eventData = params.event;
  event.name.value = eventData.name!;
  event.description.value = eventData.description;
  event.reminders.value.start = eventData.reminders!.start;
  event.reminders.value.end = eventData.reminders!.end;
  event.reminders.value.notifications = eventData.reminders!.notifications ?? [];
  event.reminders.value.repeat = eventData.reminders!.repeat!;
  event.timezone.value = eventData.timezone!;
  event.guests.value = eventData.guests!;
  event.availability.value = eventData.availability!;
}

async function deleteEvent(): Promise<void> {
  const { id } = props.eventData;
  emits('delete', { data: { id } });
  await closePage();
}
</script>

<style scoped>
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
  overflow: auto;
  min-height: 0;
}

.form-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.calendar-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.form-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.calendar-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.event-form-content {
  --padding-bottom: 0;
  --padding-end: 0;
  height: 100%;
  overflow: auto;
}
</style>
