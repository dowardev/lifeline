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
                          :error-text="
                            v$.event.name.$errors[0]?.$message as string
                          "
                          :class="[
                            v$.event.name.$errors.length == 0
                              ? 'ion-valid'
                              : 'ion-invalid',
                          ]"
                          :value="event.name.value"
                          @ion-input="
                            event.name.value = $event.detail.value as string
                          "
                          @ion-focus="
                            ($refs.inputName as any).$el.classList.add(
                              'ion-touched',
                            );
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
                          @ion-input="
                            event.description.value = $event.target
                              .value as string
                          "
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
                      <ion-button
                        v-if="isMobile"
                        fill="clear"
                        @click="showMobileCalendar = true"
                      >
                        Disponibilidad
                      </ion-button>
                    </ion-list-header>

                    <ion-card class="shadow1">
                      <!-- dates -->
                      <ion-item
                        button
                        class="transparent"
                        lines="full"
                        @click="isOpenPopoverTiempo = true"
                      >
                        <ion-label>Tiempo</ion-label>
                        <ion-label slot="end" class="ion-text-wrap">
                          {{
                            format(new Date(event.reminders.value.start), "Pp")
                          }}
                          <br />
                          {{
                            format(new Date(event.reminders.value.end), "Pp")
                          }}
                        </ion-label>
                      </ion-item>

                      <!-- notifications -->
                      <ion-item
                        button
                        class="transparent"
                        lines="full"
                        @click="isOpenPopoverNotifications = true"
                      >
                        <ion-label>Notificaciones</ion-label>
                        <ion-label slot="end" class="ion-text-wrap">
                          {{ formatTextNotifications() }}
                        </ion-label>
                      </ion-item>

                      <!-- repeat -->
                      <ion-item
                        v-if="event.reminders.value.repeat"
                        button
                        class="transparent"
                        @click="isOpenPopoverRepeat = true"
                      >
                        <ion-label>Repetir</ion-label>
                        <ion-label slot="end" class="ion-text-wrap">
                          {{ formatTextRepeat() }}
                        </ion-label>
                      </ion-item>

                      <!-- time zone -->
                      <ion-item
                        class="transparent"
                        button
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
                      <!-- calendar -->
                      <ion-item lines="full" class="transparent">
                        <ion-select
                          class="calendar-select"
                          label="Calendario"
                          :placeholder="calendarPlaceholder"
                          ok-text="Confirmar"
                          cancel-text="Cancelar"
                          :value="event.calendarId.value"
                          :disabled="selectableCalendarList.length === 0"
                          :interface="
                            isPlatform('desktop') ? 'popover' : 'alert'
                          "
                          :interface-options="{
                            cssClass: 'calendar-select-popover',
                          }"
                          @ion-change="onCalendarSelectChange($event)"
                        >
                          <!--
                            LBDS-305: one option per calendar, local and
                            mirrored alike.

                            `ion-select` renders every option as TEXT
                            (`<ion-radio>{option.textContent}</ion-radio>`),
                            so the source kind and the account go in the
                            label itself - there is no markup to put an
                            icon or a color in. That is what tells two
                            Google accounts with the same calendar name
                            apart.
                          -->
                          <ion-select-option
                            v-for="cal in selectableCalendarList"
                            :key="cal.id"
                            :value="cal.id"
                          >{{ calendarOptionLabel({ cal }) }}</ion-select-option>
                        </ion-select>

                        <!--
                          LBDS-305: the old custom popover explained the
                          zero-calendars case inside itself. With the
                          `ion-select` there is no popover to open, so
                          the note lives next to the control - otherwise
                          the user only sees a disabled "Sin calendarios"
                          without knowing what happens to the event.
                        -->
                        <ion-note
                          v-if="
                            selectableCalendarList.length === 0 &&
                            !calendarLoadError
                          "
                          class="calendar-select-note"
                        >
                          No tenés calendarios. El evento se creará con
                          <strong>calendar_id</strong> vacío; LBDS-292 lo
                          auto-provisionará en el primer sync.
                        </ion-note>
                      </ion-item>

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
                              :disabled="isAnonymous"
                              :error-text="
                                v2$.emailGuest.$errors[0]?.$message as string
                              "
                              :class="[
                                v2$.emailGuest.$errors.length == 0
                                  ? 'ion-valid'
                                  : 'ion-invalid',
                              ]"
                              :value="emailGuest"
                              @ion-input="
                                emailGuest = $event.detail.value as string
                              "
                              @ion-focus="
                                ($refs.inputGuest as any).$el.classList.add(
                                  'ion-touched',
                                )
                              "
                              @ion-blur="
                                ($refs.inputGuest as any).$el.classList.remove(
                                  'ion-touched',
                                );
                                v2$.emailGuest.$touch();
                              "
                            ></ion-input>
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
                              :disabled="
                                isAnonymous || emailGuest.trim() === ''
                              "
                              @click="addGuest()"
                              ><ion-icon :icon="addOutline"></ion-icon
                            ></ion-button>
                          </div>
                        </div>
                      </div>
                      <ion-item
                        v-if="isAnonymous"
                        lines="none"
                        class="transparent"
                      >
                        <ion-note class="ion-padding-vertical">
                          Iniciá sesión para invitar por correo electrónico.
                        </ion-note>
                      </ion-item>
                      <ion-item
                        v-for="(guest, indexGuest) in event.guests.value"
                        :key="indexGuest"
                        @mouseenter="showButtonsOptionGuest = indexGuest"
                        @mouseleave="showButtonsOptionGuest = -1"
                      >
                        <ion-label>{{ guest.email }}</ion-label>

                        <ion-button
                          v-if="showButtonsOptionGuest === indexGuest && !isAnonymous"
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
        style="--width: 24rem"
        :is-open="isOpenPopoverTiempo"
        :backdrop-dismiss="false"
        @will-dismiss="isOpenPopoverTiempo = false"
      >
        <RemindersComponent
          :dates="{
            start: event.reminders.value.start,
            end: event.reminders.value.end,
          }"
          :segment-option="'date-start'"
          :notifications="event.reminders.value.notifications"
          :repeat="event.reminders.value.repeat"
          :id-reminders="event.reminders.value.idReminders"
          :dates-only="true"
          @update-data-reminders="handleUpdateReminders($event)"
        />
      </ion-popover>

      <ion-popover
        style="--width: 24rem"
        :is-open="isOpenPopoverNotifications"
        :backdrop-dismiss="false"
        @will-dismiss="isOpenPopoverNotifications = false"
      >
        <RemindersComponent
          :dates="{
            start: event.reminders.value.start,
            end: event.reminders.value.end,
          }"
          :segment-option="'reminders'"
          :notifications="event.reminders.value.notifications"
          :repeat="event.reminders.value.repeat"
          :id-reminders="event.reminders.value.idReminders"
          :hide-segment="true"
          @update-data-reminders="handleUpdateReminders($event)"
        />
      </ion-popover>

      <ion-popover
        style="--width: 24rem"
        :is-open="isOpenPopoverRepeat"
        :backdrop-dismiss="false"
        @will-dismiss="isOpenPopoverRepeat = false"
      >
        <RemindersComponent
          :dates="{
            start: event.reminders.value.start,
            end: event.reminders.value.end,
          }"
          :segment-option="'repeats'"
          :notifications="event.reminders.value.notifications"
          :repeat="event.reminders.value.repeat"
          :id-reminders="event.reminders.value.idReminders"
          :hide-segment="true"
          @update-data-reminders="handleUpdateReminders($event)"
        />
      </ion-popover>

      <!-- popover timezones -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverTimezones"
        :backdrop-dismiss="false"
        @will-dismiss="resetTimeZones()"
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
              :value="searchTimeZone"
              @ion-input="
                searchTimeZone = $event.detail.value as string;
                filterZones(searchTimeZone);
              "
              @ion-cancel="clearTimeZones()"
              @ion-clear="clearTimeZones()"
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div v-if="filteredZones.length == 0">
            <ion-accordion-group>
              <ion-accordion
                v-for="group in timeZoneGroups"
                :key="group.header"
                :value="group.header"
              >
                <ion-item slot="header">
                  <ion-label>{{ group.header }}</ion-label>
                </ion-item>
                <div slot="content">
                  <ion-item
                    v-for="zone in group.zones"
                    :key="zone"
                    button
                    @click="selectZone({ zone })"
                    ><ion-label>{{
                      getTimeZoneLabel(zone)
                    }}</ion-label></ion-item
                  >
                </div>
              </ion-accordion>
            </ion-accordion-group>
          </div>

          <!-- search time zone -->
          <div v-if="filteredZones.length > 0">
            <ion-item
              v-for="zone in filteredZones"
              :key="zone"
              button
              @click="selectZone({ zone })"
              ><ion-label>{{ getTimeZoneLabel(zone) }}</ion-label></ion-item
            >
          </div>
        </ion-content>
      </ion-popover>

      <!-- end popovers -->
      <!-- modals -->
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
  IonAccordion,
  IonAccordionGroup,
  IonLabel,
  IonModal,
  modalController,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonItem,
  IonNote,
} from "@ionic/vue";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { add, format, sub } from "date-fns";
import {
  addOutline,
  arrowBackOutline,
  arrowForwardOutline,
  closeOutline,
  saveOutline,
  trashOutline,
  todayOutline,
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { email, helpers, maxLength, required } from "@vuelidate/validators";
import { db } from "@/db";
import {
  translateReminderOffset,
  normalizeOffsetCodes,
} from "@/utils/reminders";
import { useCalendarStore } from "@/store/calendarStore";

// 2. Controllers / Composables
import { EventController } from "@/controllers/eventController";
import { SystemController } from "@/controllers/systemController";
import { CalendarController } from "@/controllers/calendarController";
import { AuthController } from "@/controllers/authController";
const eventController = new EventController();
const systemController = new SystemController();
const calendarController = new CalendarController();
const authController = new AuthController();

// 3. Components
import FullyCalendarVue3 from "@/components/calendar/fullcalendar/FullyCalendarVue3.vue";
import RemindersComponent from "../reminders/RemindersComponent.vue";

// 4. Interface and types imports
import type { EventReminderRepeat, Event } from "@/utils/interfaces";
import type { EventItem } from "@/store/eventStore";
import type { CalendarItem } from "@/store/calendarStore";

// 5. Main (props, emits)
const props = defineProps({
  eventData: { type: Object as () => Event, default: () => null },
  initialDate: { type: Object as () => Date | null, default: () => null },
  initialEndDate: { type: Object as () => Date | null, default: () => null },
});

const emits = defineEmits(["create", "update", "delete"]);

// 6. Vars and const
const isOpenPopoverTiempo = ref(false);
const isOpenPopoverNotifications = ref(false);
const isOpenPopoverRepeat = ref(false);
const timeZoneNames = systemController.getTimeZoneNames();
const timeZoneGroups = systemController.groupTimeZones(timeZoneNames);
const getTimeZoneLabel = systemController.getTimeZoneLabel;
const isOpenPopoverTimezones = ref(false);
const filteredZones = ref(Array<string>());
const searchTimeZone = ref("");
const showButtonsOptionGuest = ref(-1);
const emailGuest = ref("");
// LBDS-298 - calendar picker state. The row is hidden when the user
// has zero calendars; otherwise it shows the picked calendar's name
// and opens a popover with one `ion-radio` per calendar.
const event = {
  name: ref(""),
  description: ref(""),
  reminders: ref({
    start: new Date() as Date,
    end: new Date(Date.now() + 60 * 60 * 1000) as Date,
    notifications: Array<string>(),
    repeat: { type: "daily", frecuency: 1 } as {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    },
    idReminders: [] as number[],
  }),
  timezone: ref(Intl.DateTimeFormat().resolvedOptions().timeZone),
  guests: ref(Array<{ email: string }>()),
  availability: ref("available"),
  // LBDS-298 - id of the calendar the new/edited event will belong
  // to. `null` while the list is still loading OR when the user has
  // zero calendars (the row is hidden, the create payload omits
  // `calendar_id`, and LBDS-292's auto-provision takes over).
  calendarId: ref<number | null>(null),
};

const currentDate = ref(
  calendarController.getCurrentDate({
    mode: calendarController.getCalendarModeView(),
  }) ?? new Date(),
);
const modalDatetimeAvailability = ref();
const closeModalDatetimeAvailability = (): void =>
  modalDatetimeAvailability.value.$el.dismiss();
const isMobile = ref(window.innerWidth < 768);
const showMobileCalendar = ref(false);
const calendarEvents = computed<EventItem[]>(() => eventController.getEvents());
const messageError = {
  email: "Correo electrónico no valido",
  required: "Campo requerido",
};
const rules = {
  event: {
    name: {
      required: helpers.withMessage(messageError.required, required),
      maxLength: helpers.withMessage("Máximo 255 caracteres", maxLength(255)),
    },
    reminders: {
      start: {
        required: helpers.withMessage(messageError.required, required),
      },
      end: {
        required: helpers.withMessage(messageError.required, required),
      },
    },
    timezone: {
      required: helpers.withMessage(messageError.required, required),
      maxLength: helpers.withMessage("Máximo 100 caracteres", maxLength(100)),
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
const pageTitle = ref("Agregar evento");
const handleUpdateReminders = (params: {
  data: {
    start: Date;
    end: Date;
    remindersChecked: string[];
    dateRepeat: any;
    idReminders: any[];
  };
}): void => {
  const { data } = params;
  event.reminders.value = {
    start: data.start,
    end: data.end,
    notifications: data.remindersChecked,
    repeat: data.dateRepeat,
    idReminders: data.idReminders,
  };
};

// 7. Watch
watch(
  () => props.eventData,
  (val) => {
    console.log("[AdminEventComponent] eventData received:", val);
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
        : new Date(val.getTime() + 60 * 60 * 1000);
    }
  },
  { immediate: true },
);

watch(showMobileCalendar, (val) => {
  if (val) {
    nextTick(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }
});

// 8. Computed
// (calendarEvents computed defined above in vars/const)
const isAnonymous = computed(() => authController.isAnonymous());

// LBDS-298 - reactive view of the user's calendar list. The store is
// populated by `loadCalendars()` on mount; the picker row + popover
// both read from this computed.
const calendarList = computed(() => calendarController.getCalendarList());

// LBDS-305 - the picker must not offer rows whose source was
// disconnected (`selectable: false`). Filtering here means the
// empty state, the row count, and the radio list all see the same
// set. Archived rows still exist in the store so the events table
// can resolve their names, but they are ghost rows for the picker.
const selectableCalendarList = computed(() =>
  calendarList.value.filter((c) => c.selectable),
);

// LBDS-305 - the placeholder of the calendar select. It doubles as
// the error surface: when the list could not be loaded the user
// sees WHY instead of a bare "Sin calendarios" that would look like
// an empty account.
const calendarPlaceholder = computed<string>(() => {
  if (calendarLoadError.value) return "Error al cargar";
  if (selectableCalendarList.value.length === 0) return "Sin calendarios";
  return "Elegí un calendario";
});

// LBDS-305 - the select's own change handler. `ion-select` gives the
// typed value on `detail.value`; the option carries the calendar id.
const onCalendarSelectChange = (ev: CustomEvent<{ value: number | string | null }>): void => {
  const next = ev.detail?.value;
  if (next === null || next === undefined || next === "") {
    event.calendarId.value = null;
    return;
  }
  const id = Number(next);
  if (Number.isNaN(id)) return;
  event.calendarId.value = id;
};

// LBDS-305 - the label of a calendar option.
//
// `ion-select` renders the options as plain text, so the source kind
// and the account are part of the label: "Google Calendar (Google) ·
// alice@gmail.com". The account is what tells two accounts with the
// same calendar name apart.
const calendarOptionLabel = (params: { cal: CalendarItem }): string => {
  const { cal } = params;
  if (!cal.source) return cal.name;
  const kind = sourceKindLabel({ type: cal.source.type });
  const account = cal.source.username;
  return account ? `${cal.name} (${kind}) · ${account}` : `${cal.name} (${kind})`;
};

// LBDS-305 - the kind of the source, shown in the option label.
const sourceKindLabel = (params: { type: string | null }): string => {
  switch (params.type) {
    case "google":
      return "Google";
    case "caldav":
      return "CalDAV";
    case "ics":
      return "Suscripción";
    default:
      return "Fuente externa";
  }
};


// LBDS-298 F3 - reactive read of the store's load error. When the
// `GET /calendars` request fails, the store sets `error`; the modal
// surfaces it next to the picker so the user can tell "the list
// failed to load" apart from "you have no calendars". The toast
// the existing `loadCalendars` already logs is a redundant signal.
const calendarLoadError = computed<string | null>(() => {
  return useCalendarStore().error
});

// 9. OnMounted
onMounted(async () => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener("resize", onResize);
  if (props.eventData) {
    pageTitle.value = "Actualizar evento";
    setEvent({ event: props.eventData });
  }
  await loadStoredEvents();
  // LBDS-298 - fetch the user's calendar list and pre-select the
  // picker. Order matters: `loadCalendars` populates the store, then
  // `preSelectCalendar` reads from it (the picker row depends on
  // `calendarList` having loaded before it can render with a name).
  await loadCalendars();
  preSelectCalendar();
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
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
    console.warn("[AdminEventComponent] No events in IndexedDB:", e);
  }
}

// LBDS-298 - fetches `GET /calendars` and populates the store. The
// row is hidden when the list is empty; if the request fails we log
// it and let the picker stay hidden rather than blocking the save
// flow.
async function loadCalendars(): Promise<void> {
  try {
    await calendarController.getCalendars();
  } catch (e) {
    console.warn("[AdminEventComponent] Failed to load calendars:", e);
  }
}

// LBDS-298 - chooses which calendar id to pre-select when the modal
// opens. For create flows, that's the default calendar (the one
// flagged `default: 1` or the first row). For updates, that's the
// event's existing `calendar_id` IF that calendar is still in the
// user's list; otherwise we fall back to the default. With zero
// calendars the field stays `null` and the picker row is hidden.
//
// `incoming === null` is an explicit state: the event was created
// without a calendar (e.g. before LBDS-292 auto-provision, or
// because the user deliberately cleared it). On edit we MUST
// preserve that null - otherwise a no-touch save would silently
// attach the user to the default calendar and break LBDS-292's
// contract.
function preSelectCalendar(): void {
  const list = calendarList.value;
  if (list.length === 0) {
    // The list could not be loaded (offline): keep the calendar the
    // event already belongs to. Clearing it would detach the event
    // from its calendar on the server the next time it syncs.
    event.calendarId.value = props.eventData?.calendar_id ?? null;
    return;
  }
  const incoming = props.eventData?.calendar_id;
  if (incoming === null) {
    // LBDS-298 F4: explicit null on the incoming event stays null
    // on edit. The update path then sends `calendar_id: null`,
    // which `EventController.updateEvent` serialises as the
    // `null` clear-the-field case (different from the `undefined`
    // no-op case).
    event.calendarId.value = null;
    return;
  }
  if (incoming !== undefined && list.some((c) => c.id === incoming)) {
    event.calendarId.value = incoming;
    return;
  }
  const def = calendarController.getDefaultCalendar();
  event.calendarId.value = def?.id ?? null;
}

const filterZones = (query: string): void => {
  filteredZones.value = timeZoneNames.filter((name: string) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );
};

const selectZone = (params: { zone: string }): void => {
  const zone = params.zone;
  event.timezone.value = zone;
  isOpenPopoverTimezones.value = false;
};

const clearTimeZones = (): void => {
  searchTimeZone.value = "";
  filteredZones.value = [];
};

const resetTimeZones = (): void => {
  isOpenPopoverTimezones.value = false;
  clearTimeZones();
};

const addGuest = (): void => {
  const email = emailGuest.value.trim();
  if (!email) return;
  if (!Array.isArray(event.guests.value)) event.guests.value = [];
  event.guests.value.push({ email });
  emailGuest.value = "";
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
      notifications: normalizeOffsetCodes(event.reminders.value.notifications),
      repeat: event.reminders.value.repeat,
      idReminders: event.reminders.value.idReminders,
    };
    eventData.description = event.description.value;
    eventData.availability = event.availability.value;
    eventData.timezone = event.timezone.value;
    // LBDS-298 - propagate the picker selection to the parent so the
    // controller call sends `calendar_id`. `null` (no calendar, row
    // hidden) means "let LBDS-292 auto-provision" and is the only
    // state where the field is omitted from the outgoing payload.
    eventData.calendar_id = event.calendarId.value;

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

function formatTextNotifications(): string {
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

function formatTextRepeat(): string {
  const type = event.reminders.value.repeat.type;
  let text = translateRepeat({
    repeat: type,
  });
  const len = (event.reminders.value.repeat.daysWeek?.length ?? 0) - 1;
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
  const notification = params.notification;

  return translateReminderOffset(notification);
}

async function closePage(): Promise<void> {
  await modalController.dismiss();
}

function onCalendarDateClick(params: { date: Date; endDate?: Date }): void {
  event.reminders.value.start = params.date;
  event.reminders.value.end =
    params.endDate || new Date(params.date.getTime() + 60 * 60 * 1000);
  showMobileCalendar.value = false;
}

function setEvent(params: { event: Event }): void {
  const eventData = params.event;
  event.name.value = eventData.name!;
  event.description.value = eventData.description;
  event.reminders.value.start = eventData.reminders!.start;
  event.reminders.value.end = eventData.reminders!.end;
  event.reminders.value.notifications =
    eventData.reminders!.notifications ?? [];
  event.reminders.value.idReminders = eventData.reminders!.idReminders ?? [];
  event.reminders.value.repeat = eventData.reminders!.repeat!;
  event.timezone.value = eventData.timezone!;
  event.guests.value = Array.isArray(eventData.guests) ? eventData.guests : [];
  event.availability.value = eventData.availability!;
  // LBDS-298 - hydrate the picker from the existing event. The
  // preSelectCalendar() pass that runs after `loadCalendars()` will
  // reconcile this against the live calendar list (falling back to
  // the default if the event's calendar was deleted).
  if (eventData.calendar_id !== undefined && eventData.calendar_id !== null) {
    event.calendarId.value = eventData.calendar_id;
  }
}

async function deleteEvent(): Promise<void> {
  const { id } = props.eventData;
  emits("delete", { data: { id } });
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

/*
 * LBDS-305 - the calendar select.
 *
 * The select lists the local calendars and the mirrored external
 * sources in ONE list. `ion-select` renders each option as text, so
 * the source kind and the account travel in the option label.
 */
.calendar-select {
  --max-width: 100%;
}

/* LBDS-305 - the note under the select when the user has no calendars. */
.calendar-select-note {
  display: block;
  padding: 0 1rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.35;
}
</style>
