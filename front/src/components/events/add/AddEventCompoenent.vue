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
                      <ion-item
                        button
                        class="transparent"
                        lines="full"
                        :disabled="calendarList.length === 0"
                        @click="isOpenPopoverCalendar = true"
                      >
                        <ion-label>Calendario</ion-label>
                        <ion-label slot="end" class="ion-text-wrap">{{
                          selectedCalendarName
                        }}</ion-label>
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

      <!-- popover calendar -->
      <ion-popover
        style="--width: 22rem"
        :is-open="isOpenPopoverCalendar"
        :backdrop-dismiss="false"
        @will-dismiss="resetCalendar()"
      >
        <ion-header mode="ios">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="isOpenPopoverCalendar = false">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>Calendario</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div v-if="selectableCalendarList.length === 0" class="ion-padding">
            <ion-note v-if="calendarLoadError" color="warning">
              <ion-icon :icon="warningOutline" style="vertical-align: middle"></ion-icon>
              No se pudo cargar la lista de calendarios: {{ calendarLoadError }}.
              Probá cerrar y reabrir el modal.
            </ion-note>
            <ion-note v-else>
              No tenés calendarios. El evento se creará con
              <strong>calendar_id</strong> vacío; LBDS-292 lo
              auto-provisionará en el primer sync.
            </ion-note>
          </div>
          <ion-radio-group
            v-else
            :value="event.calendarId.value"
            @ion-change="onCalendarRadioChange($event)"
          >
            <!--
              LBDS-298 F5: a single tap fires both the @click on
              the item AND the @ion-change on the radio group.
              The earlier implementation had both handlers write
              to `event.calendarId` independently, which created
              two divergent code paths and a race on popover
              dismissal. We now route BOTH paths through
              `selectCalendar`: @click for pointer taps, and
              @ion-change for keyboard navigation (arrow keys +
              Enter/Space, required for WCAG 2.1 AA). The radio's
              :value binding keeps the visual state in sync.

              LBDS-305: the list mixes the local calendars with the
              mirrored external sources (Google / CalDAV / ICS) in
              one unified list. The source kind and account are
              already in the API (`cal.source`), so showing them
              inline is a pure design decision - tracked separately.
            -->
            <ion-item
              v-for="cal in selectableCalendarList"
              :key="cal.id"
              button
              @click="selectCalendar({ id: cal.id })"
            >
              <ion-radio
                :value="cal.id"
                label-placement="end"
                justify="start"
                >{{ cal.name }}</ion-radio
              >
              <!--
                LBDS-305: the source indicator. It is an ICON-ONLY
                button (not a text badge): a text badge truncated the
                calendar name ("Google C…"), because the picker is
                only 22rem wide. The icon carries the same signal in
                a fraction of the space, and the details (kind,
                account) open in a popover on tap.
              -->
              <ion-button
                v-if="cal.source"
                slot="end"
                fill="clear"
                class="calendar-source-trigger"
                :id="`source-trigger-${cal.id}`"
                :aria-label="`Fuente de ${cal.name}`"
                @click.stop="openSourcePopover({ id: cal.id, event: $event })"
              >
                <span
                  class="calendar-source-trigger-dot"
                  :style="{
                    background: cal.source.color,
                    color: pickForegroundColor(cal.source.color),
                  }"
                >
                  <ion-icon :icon="sourceKindIcon({ type: cal.source.type })"></ion-icon>
                </span>
              </ion-button>
            </ion-item>
          </ion-radio-group>
        </ion-content>
      </ion-popover>

      <!--
        LBDS-305 - the source detail popover. It is a SIBLING of the
        calendar picker popover (not nested inside it) so the two
        overlays stack cleanly: the picker stays open behind it and
        the user can dismiss the detail and keep browsing.
      -->
      <ion-popover
        class="calendar-source-popover"
        style="--width: 17rem"
        :is-open="openSourceId !== null"
        :event="sourcePopoverEvent"
        side="bottom"
        alignment="start"
        :backdrop-dismiss="true"
        @will-dismiss="closeSourcePopover()"
      >
        <ion-content class="ion-padding">
          <div v-if="openSource && openSource.source" class="calendar-source-card">
            <div class="calendar-source-card-head">
              <span
                class="calendar-source-card-icon"
                :style="{
                  background: openSource.source.color,
                  color: pickForegroundColor(openSource.source.color),
                }"
              >
                <ion-icon :icon="sourceKindIcon({ type: openSource.source.type })"></ion-icon>
              </span>
              <div class="calendar-source-card-titles">
                <div class="calendar-source-card-kind">
                  {{ sourceKindLabel({ type: openSource.source.type }) }}
                </div>
                <div class="calendar-source-card-name">{{ openSource.name }}</div>
              </div>
            </div>

            <div v-if="openSource.source.username" class="calendar-source-card-account">
              <ion-icon :icon="personCircleOutline"></ion-icon>
              <span>{{ openSource.source.username }}</span>
            </div>

            <p class="calendar-source-card-note">
              {{ sourceKindNote({ type: openSource.source.type }) }}
            </p>
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
  IonRadio,
  IonRadioGroup,
} from "@ionic/vue";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { add, format, sub } from "date-fns";
import {
  addOutline,
  arrowBackOutline,
  arrowForwardOutline,
  closeOutline,
  cloudOutline,
  globeOutline,
  logoGoogle,
  personCircleOutline,
  saveOutline,
  trashOutline,
  todayOutline,
  warningOutline,
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { email, helpers, maxLength, required } from "@vuelidate/validators";
import { db } from "@/db";
import {
  translateReminderOffset,
  normalizeOffsetCodes,
} from "@/utils/reminders";
import { pickForegroundColor } from "@/utils/colorContrast";
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
const isOpenPopoverCalendar = ref(false);
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

// LBDS-305 - the source whose detail popover is open. `null` means
// closed. The detail lives in a SECOND popover (a sibling of the
// picker) so the picker stays open behind it and the user can read
// the source and go back to browsing without losing the list.
const openSourceId = ref<number | null>(null);

// The click that opened it. Ionic anchors the popover to the event's
// target, so the detail opens RIGHT AT the indicator - the same
// place the `ion-select` of this form opens its own popover - instead
// of floating in the middle of the screen.
const sourcePopoverEvent = ref<Event | null>(null);

// The row whose detail popover is open. It looks the row up in the
// SAME list the picker renders (`selectableCalendarList`), so the
// detail can never show a row the picker is not offering (an
// archived mirror, for instance).
const openSource = computed<CalendarItem | null>(() => {
  if (openSourceId.value === null) return null;
  return selectableCalendarList.value.find((c) => c.id === openSourceId.value) ?? null;
});

function openSourcePopover(params: { id: number; event: Event }): void {
  sourcePopoverEvent.value = params.event;
  openSourceId.value = params.id;
}

function closeSourcePopover(): void {
  openSourceId.value = null;
  sourcePopoverEvent.value = null;
}

// LBDS-305 - the kind of the source: the icon of the indicator dot
// and the title of the detail popover.
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

const sourceKindIcon = (params: { type: string | null }): string => {
  switch (params.type) {
    case "google":
      return logoGoogle;
    case "caldav":
      return cloudOutline;
    case "ics":
      return globeOutline;
    default:
      return globeOutline;
  }
};

// One line of context about what the calendar is. It answers the
// question the kind alone leaves open: where does this come from and
// what happens to the events.
const sourceKindNote = (params: { type: string | null }): string => {
  switch (params.type) {
    case "google":
      return "Se sincroniza con tu cuenta de Google Calendar.";
    case "caldav":
      return "Se sincroniza con un servidor CalDAV.";
    case "ics":
      return "Es una suscripción de solo lectura.";
    default:
      return "Se sincroniza con una fuente externa.";
  }
};

// LBDS-298 - the calendar name shown in the "Calendario" row.
// Returns "Sin calendarios" when the user has zero calendars (the
// row stays rendered but disabled, so the user can see the picker
// exists and LBDS-292's auto-provision will populate it on the
// next sync). Falls back to "—" while the list is still loading.
// When the load itself failed, "Error al cargar" makes the row
// visually distinct from the "you have no calendars" case so the
// user knows the picker is broken and not just empty.
const selectedCalendarName = computed<string>(() => {
  if (calendarList.value.length === 0) {
    return calendarLoadError.value ? "Error al cargar" : "Sin calendarios";
  }
  const id = event.calendarId.value;
  if (id === null || id === undefined) return "—";
  const found = calendarList.value.find((c) => c.id === id);
  return found?.name ?? "—";
});

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
  } finally {
    // LBDS-305 - the list may have changed (a source disconnected
    // while its detail was open), so the open detail is dropped
    // instead of pointing at a row that is no longer offered.
    closeSourcePopover();
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
    event.calendarId.value = null;
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

// LBDS-298 - tapping a row in the popover selects it and closes the
// popover. Same UX pattern as the time-zone picker.
const selectCalendar = (params: { id: number }): void => {
  const { id } = params;
  event.calendarId.value = id;
  isOpenPopoverCalendar.value = false;
};

// LBDS-298 F5 - keyboard a11y path. `ion-radio-group` fires
// `ion-change` when the user moves the selection via keyboard
// (arrow keys to focus + Enter/Space to confirm) instead of
// pointer. Without this handler the visual radio state would
// change but `event.calendarId` would not, and the popover would
// stay open - a WCAG 2.1 AA violation. We parse the value (the
// radio passes the raw string from its `value` attribute, not
// the typed JS value) and route it through `selectCalendar` so
// pointer and keyboard paths share the same code.
const onCalendarRadioChange = (ev: CustomEvent<{ value: number | string | null }>): void => {
  const next = ev.detail?.value
  if (typeof next === 'number') {
    selectCalendar({ id: next })
    return
  }
  if (typeof next === 'string' && next !== '') {
    const parsed = Number(next)
    if (!Number.isNaN(parsed)) selectCalendar({ id: parsed })
  }
}

const resetCalendar = (): void => {
  isOpenPopoverCalendar.value = false;
  // LBDS-305 - closing the picker must also close the source detail
  // popover. Otherwise it stays on screen with stale content, and the
  // next time the picker opens the detail comes back up on its own.
  closeSourcePopover();
};

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
 * LBDS-305 - the source indicator on each mirrored calendar row.
 *
 * It is an icon-only dot on purpose: a text badge squeezed the
 * calendar name in the 22rem picker ("Google C…"). The dot keeps the
 * row intact and the details (kind, account) open in a popover.
 *
 * The dot is painted with the source color (chosen by the user) and
 * its icon uses the foreground that reaches the better WCAG contrast
 * ratio against that color, so it stays readable whatever the color.
 */
.calendar-source-trigger {
  --padding-start: 0.25rem;
  --padding-end: 0.25rem;
  --padding-top: 0;
  --padding-bottom: 0;
  height: 2rem;
  margin: 0;
  z-index: 2;
}

.calendar-source-trigger-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  font-size: 0.85rem;
  line-height: 1;
}

/*
 * LBDS-305 - the source detail card inside its own popover.
 */
.calendar-source-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.calendar-source-card-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.calendar-source-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  line-height: 1;
}

.calendar-source-card-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.calendar-source-card-kind {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.2;
}

.calendar-source-card-name {
  font-size: 0.8rem;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-source-card-account {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ion-color-step-100, rgba(0, 0, 0, 0.08));
  overflow-wrap: anywhere;
}

.calendar-source-card-note {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.35;
  opacity: 0.65;
}
</style>
