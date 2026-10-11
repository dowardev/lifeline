<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" mode="md" />
        </ion-buttons>

        <ion-title>Agenda</ion-title>

        <ion-buttons slot="end">
          <ion-button fill="clear" @click="openModalAdd()">
            <ion-icon :icon="addOutline" />
          </ion-button>
          <ion-button id="main-options-trigger" fill="clear">
            <ion-icon :icon="ellipsisVerticalOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="calendar-page-content">
      <ion-grid class="ion-no-padding calendar-page-grid">
        <ion-row class="ion-height-100">
          <ion-col style="padding: 0" size="12" class="ion-padding calendar-main-col">
            <div class="calendar-header-controls ion-padding-bottom ion-padding-end">
              <div class="calendar-controls-left">
                <ion-button
                  fill="clear"
                  size="small"
                  :disabled="currentView === 'diary'"
                  @click="previousDate"
                >
                  <ion-icon :icon="chevronBackOutline" />
                </ion-button>
                <span class="date-display-text" @click="onOpenDatePopover($event)">
                  {{ getCurrentDateDisplay() }}
                </span>
                <ion-button
                  fill="clear"
                  size="small"
                  :disabled="currentView === 'diary'"
                  @click="nextDate"
                >
                  <ion-icon :icon="chevronForwardOutline" />
                </ion-button>
              </div>

              <div class="calendar-controls-right">
                <ion-select
                  class="ion-hide-lg-up view-select"
                  :value="currentView"
                  interface="popover"
                  placeholder="Vista"
                  @ion-change="onViewChange"
                >
                  <ion-select-option value="day">D&iacute;a</ion-select-option>
                  <ion-select-option value="week">Semana</ion-select-option>
                  <ion-select-option value="diary">Agenda</ion-select-option>
                </ion-select>

                <ion-segment
                  class="ion-hide-lg-down"
                  :value="currentView"
                  @ion-change="onViewChange"
                >
                  <ion-segment-button value="day">D&iacute;a</ion-segment-button>
                  <ion-segment-button value="week">Semana</ion-segment-button>
                  <ion-segment-button value="diary">Agenda</ion-segment-button>
                </ion-segment>
              </div>
            </div>

            <div class="calendar-scroll-wrapper">
              <FullyCalendarVue3
                :key="`${calendarKey}-${isMobile}`"
                ref="calendarRef"
                :events="events"
                :external-events="externalEvents"
                :current-view="currentView"
                :current-date="currentDate"
                locale="es"
                @date-click="handleDateClick"
                @event-click="handleEventClick"
                @event-update="handleEventUpdate"
                @view-change="handleViewChange"
                @date-change="handleDateChange"
              />
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>

    <!-- popover main calendar (date picker from header) -->
    <ion-popover
      :class="{ 'popover-main-calendar-ios': isPlatform('ios') }"
      :is-open="popoverMainCalendar.open"
      :event="popoverMainCalendar.event"
      @did-dismiss="popoverMainCalendar.open = false"
    >
      <ion-content>
        <ion-datetime
          ref="popoverDatetimeRef"
          :presentation="'date'"
          :value="currentDate.toISOString()"
          :max="getDateTimeMax()"
          :first-day-of-week="1"
          @ion-change="onHeaderDateChange"
        />

        <ion-item lines="none">
          <ion-button
            slot="end"
            fill="clear"
            @click="
              today;
              popoverMainCalendar.open = false;
            "
          >
            <ion-icon slot="start" :icon="todayOutline" />
            Hoy
          </ion-button>
        </ion-item>
      </ion-content>
    </ion-popover>

    <!-- popover main options -->
    <ion-popover trigger="main-options-trigger" trigger-action="click" :dismiss-on-select="true">
      <ion-content>
        <ion-list v-if="isPlatform('mobile')">
          <ion-list-header>
            <ion-label>General</ion-label>
          </ion-list-header>

          <ion-row>
            <ion-col>
              <ion-button fill="clear" size="small" @click="previousDate">
                <ion-icon :icon="chevronBackOutline" />
              </ion-button>

              <ion-button fill="clear" size="small" @click="nextDate">
                <ion-icon :icon="chevronForwardOutline" />
              </ion-button>

              <ion-button
                fill="clear"
                size="small"
                style="width: 92px"
                @click="onOpenDatePopover($event)"
              >
                {{ getCurrentDateDisplay() }}
              </ion-button>

              <ion-item
                button
                lines="none"
                :disabled="
                  currentDate.getDate() == new Date().getDate() &&
                  currentDate.getMonth() == new Date().getMonth() &&
                  currentDate.getFullYear() == new Date().getFullYear()
                "
                @click="today"
              >
                <ion-icon slot="start" :icon="todayOutline" />
              </ion-item>
            </ion-col>
          </ion-row>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Otros</ion-label>
          </ion-list-header>

          <ion-row>
            <ion-col>
              <ion-item button lines="none" @click="syncDataEvents">
                <ion-icon slot="start" :icon="syncOutline" />
                <ion-label class="ion-text-wrap">Sincronizar</ion-label>
              </ion-item>

              <ion-item button lines="none" @click="reschedule">
                <ion-icon slot="start" :icon="stopwatchOutline" />
                <ion-label class="ion-text-wrap">Reagendar elementos vencidos</ion-label>
              </ion-item>
            </ion-col>
          </ion-row>
        </ion-list>
      </ion-content>
    </ion-popover>

    <ion-toast
      :message="toastMessage"
      :duration="3000"
      :is-open="toastIsOpen"
      mode="ios"
      @did-dismiss="toastIsOpen = false"
    />

    <!-- modal add event -->
    <ion-modal
      class="modal-event"
      :backdrop-dismiss="false"
      :is-open="isOpenModalAddEvent"
      @did-dismiss="onModalAddDismiss"
    >
      <AdminEventComponent
        :initial-date="clickedDate"
        :initial-end-date="clickedEndDate"
        @create="saveEvent({ event: $event.data.event })"
      />
    </ion-modal>

    <!-- modal external event (read-only) -->
    <ion-modal :is-open="isOpenModalExternalEvent" @did-dismiss="isOpenModalExternalEvent = false">
      <ion-page>
        <ion-header mode="ios" class="ion-no-border">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="isOpenModalExternalEvent = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
            <ion-title>Evento externo</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content v-if="selectedExternalEvent">
          <ExternalEventDetailComponent :event="selectedExternalEvent" />
        </ion-content>
      </ion-page>
    </ion-modal>

    <!-- modal update event -->
    <ion-modal
      class="modal-event"
      :backdrop-dismiss="false"
      :is-open="isOpenModalUpdateEvent"
      @did-dismiss="onModalUpdateDismiss"
    >
      <AdminEventComponent
        :event-data="getEventById({ id: selectedEventId })"
        @update="updateEvent({ event: $event.data.event })"
        @delete="deleteEvent({ eventId: $event.data.id })"
      />
    </ion-modal>

    <!-- modal reschedule -->
    <ion-modal
      :is-open="isOpenModalRescheduleTasks"
      @did-dismiss="isOpenModalRescheduleTasks = false"
    >
      <ion-page>
        <ion-header mode="ios" class="ion-no-border">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="isOpenModalRescheduleTasks = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
            <ion-title>Reagendar elementos vencidos</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content>
          <div style="overflow-y: scroll; height: 100vh">
            <RescheduleComponent />
          </div>
        </ion-content>
      </ion-page>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonModal,
  IonPage,
  IonPopover,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
  isPlatform,
} from '@ionic/vue';
import { ref, onMounted, onUnmounted, reactive, computed, watch } from 'vue';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  ellipsisVerticalOutline,
  stopwatchOutline,
  syncOutline,
  todayOutline,
} from 'ionicons/icons';
import { format, add, sub } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/db';
import messages from '@/utils/messages.json';

// 2. Controllers / Composables
import { CalendarController } from '@/controllers/calendarController';
import { EventController } from '@/controllers/eventController';
import { SystemController } from '@/controllers/systemController';
import { useCalendarModals } from '@/composables/useCalendarModals';
import { useExternalSyncOnEnter } from '@/composables/useExternalSync';
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { useReminder } from '@/composables/useReminder';
import { NotificationPermissionError } from '@/controllers/reminderController';
import { normalizeOffsetCodes } from '@/utils/reminders';
import type { RepeatType } from '@/utils/types';

const calendarController = new CalendarController();
const eventController = new EventController();
const systemController = new SystemController();

// Syncs when this page opens (TTL-gated) and notifies when a background sync
// finishes, so the external overlay can be re-read instead of staying on the
// pre-sync snapshot.
const { lastSyncedAt } = useExternalSyncOnEnter();
const authStore = useAuthStore();

// 3. Components
import FullyCalendarVue3 from '@/components/calendar/fullcalendar/FullyCalendarVue3.vue';
import AdminEventComponent from '@/components/events/add/AddEventCompoenent.vue';
import ExternalEventDetailComponent from '@/components/events/ExternalEventDetailComponent.vue';
import RescheduleComponent from '@/components/events/schedule-elements/RescheduleElements.vue';

// 4. Interface and types imports
import type { EventItem } from '@/store/eventStore';
import type { ViewCalendar } from '@/store/calendarStore';
import type { Event as CalendarEvent } from '@/utils/interfaces';
import type { ExternalCalendarEvent } from '@/services/externalEventService';

// 6. Vars and const
const calendarRef = ref<InstanceType<typeof FullyCalendarVue3> | null>(null);
const events = ref<EventItem[]>([]);
const eventStore = useEventStore();
const externalEvents = ref<ExternalCalendarEvent[]>([]);
const isOpenModalExternalEvent = ref(false);
const selectedExternalEvent = ref<ExternalCalendarEvent | null>(null);
const isOpenModalAddEvent = ref(false);
const isOpenModalUpdateEvent = ref(false);
const isOpenModalRescheduleTasks = ref(false);
const selectedEventId = ref(0);
const clickedDate = ref<Date | null>(null);
const clickedEndDate = ref<Date | null>(null);
const toastIsOpen = ref(false);
const toastMessage = ref('');

const { openModalAdd, openModalUpdate, onModalAddDismiss, onModalUpdateDismiss } =
  useCalendarModals({
    isOpenModalAddEvent,
    isOpenModalUpdateEvent,
    clickedDate,
    clickedEndDate,
    selectedEventId,
  });

const popoverMainCalendar = reactive({
  open: false,
  event: null as Event | null,
});
// 7. Watch
watch(
  () => eventController.getEvents(),
  async (response) => {
    events.value = normalizeEvents({ events: response });
  },
  { immediate: true, deep: true },
);

watch(lastSyncedAt, () => {
  void loadStoredEvents();
});

// LBDS-231 - the outbox reconciler runs after the processor drains a
// successful row. The CalendarPage only refreshes its local events
// ref from the store on `lastSyncedAt` ticks, so the reconciler
// bumps the shared clock and we mirror loadStoredEvents here too.
watch(
  () => eventStore.lastSyncedAt,
  () => {
    void loadStoredEvents();
  },
);

// 8. Computed
const currentView = computed(() => calendarController.getCalendarModeView());
const currentDate = computed(() => calendarController.getCurrentDate({ mode: currentView.value }));
const calendarKey = computed(() => {
  const view = currentView.value;
  const date = currentDate.value;
  return `${view}-${date.getFullYear()}-${date.getMonth()}`;
});
const isMobile = ref(window.innerWidth < 768);
function onResize(): void {
  isMobile.value = window.innerWidth < 768;
}

// 9. OnMounted
onMounted(async () => {
  window.addEventListener('resize', onResize);
  const mode = await calendarController.getStoredCalendarModeView();
  calendarController.setCalendarModeView({ mode });
  calendarController.setCurrentDate({ date: currentDate.value, mode });
  loadStoredEvents();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

// 10. Functions
function getCurrentDateDisplay(): string {
  const date = currentDate.value;
  return capitalizeFirstLetter(format(date, 'MMMM yyyy', { locale: es }));
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDateTimeMax(): string {
  return add(new Date(), { years: 10 }).toISOString();
}

function goToPrevious(): void {
  const mode = calendarController.getCalendarModeView();
  const currentDateVal = currentDate.value;
  const days = mode === 'week' ? 7 : 1;
  const newDate = new Date(sub(currentDateVal, { days }));
  calendarController.setCurrentDate({ date: newDate, mode });
  calendarController.setCurrentDateStored({ date: newDate, mode });
}

function goToNext(): void {
  const mode = calendarController.getCalendarModeView();
  const currentDateVal = currentDate.value;
  const days = mode === 'week' ? 7 : 1;
  const newDate = new Date(add(currentDateVal, { days }));
  calendarController.setCurrentDate({ date: newDate, mode });
  calendarController.setCurrentDateStored({ date: newDate, mode });
}

function today(): void {
  const mode = calendarController.getCalendarModeView();
  const now = new Date();
  calendarController.setCurrentDate({ date: now, mode });
  calendarController.setCurrentDateStored({ date: now, mode });
}

function previousDate(): void {
  goToPrevious();
}

function nextDate(): void {
  goToNext();
}

function onViewChange(event: CustomEvent): void {
  const mode = event.detail.value as ViewCalendar;
  calendarController.setCalendarModeView({ mode });
}

function onHeaderDateChange(event: CustomEvent): void {
  popoverMainCalendar.open = false;
  const value = event.detail.value;
  const dateStr = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : '';
  if (!dateStr) return;
  const date = new Date(dateStr);
  const mode = calendarController.getCalendarModeView();
  calendarController.setCurrentDate({ date, mode });
  calendarController.setCurrentDateStored({ date, mode });
}

async function syncDataEvents(): Promise<void> {
  toastMessage.value = messages.syncStart;
  toastIsOpen.value = true;
  try {
    await eventController.loadEvents();
    toastMessage.value = messages.syncEnd;
    toastIsOpen.value = true;
  } catch (error) {
    toastMessage.value = 'Error de sincronizaci&oacute;n';
    toastIsOpen.value = true;
    console.error(error);
  }
}

async function loadStoredEvents(): Promise<void> {
  try {
    externalEvents.value = await eventController.loadExternalEvents();
  } catch (e) {
    console.warn('[CalendarPage] No external events or error loading:', e);
  }
  const storeEvents = eventController.getEvents();
  if (storeEvents.length > 0) {
    events.value = normalizeEvents({ events: storeEvents });
    return;
  }
  try {
    const localEvents = await db.events.limit(200).toArray();
    if (localEvents.length > 0) {
      const itemEvents = localEvents as EventItem[];
      eventController.setEvents({ events: itemEvents });
      events.value = normalizeEvents({ events: itemEvents });
    }
  } catch (e) {
    console.warn('[CalendarPage] No events in IndexedDB or error loading:', e);
  }
}

function normalizeEvents(params: { events: EventItem[] }): EventItem[] {
  return params.events.map((event) => {
    const anyEvent = event as unknown as Record<string, unknown>;
    // LBDS-231 - defensive unwrap for rows that the old reconciler stored
    // with the server's `{ event: {...} }` wrapper instead of flattening it.
    // The new reconciler (`eventController.ts`) stores them at the row root,
    // so this branch only matters for already-persisted rows from before the
    // fix landed.
    const wrapped = anyEvent.event as Record<string, unknown> | undefined
    const source: Record<string, unknown> =
      wrapped && typeof wrapped === 'object' ? { ...anyEvent, ...wrapped } : anyEvent
    // No `if (title && date_start) return event` shortcut: the reconciler
    // writes `dateStart` (camelCase, the local key) plus `dateStart` (also
    // the server key after the unwrap fix), and never `date_start`. The
    // shortcut skipped the `date_start` assignment and FullCalendar received
    // `start: ''`. Always normalise.
    return {
      id: event.id,
      user_id:
        (source.user_id as number) ||
        (source.userId as number) ||
        (authStore.localUser?.id ?? 0),
      title: event.title || (source.name as string) || '',
      calendar_id: (source.calendar_id as number) || 1,
      date_start:
        event.date_start ||
        (event.dateStart as string) ||
        ((source.reminders
          ? (source.reminders as Record<string, unknown>).start instanceof Date
            ? ((source.reminders as Record<string, unknown>).start as Date).toISOString()
            : ((source.reminders as Record<string, unknown>).start as string) || ''
          : '') as string),
      date_end:
        event.date_end ||
        (event.dateEnd as string) ||
        ((source.reminders
          ? (source.reminders as Record<string, unknown>).end instanceof Date
            ? ((source.reminders as Record<string, unknown>).end as Date).toISOString()
            : ((source.reminders as Record<string, unknown>).end as string) || undefined
          : undefined) as string | undefined),
      notifications: event.notifications || (source.notifications as string) || '',
      repeat: event.repeat || (source.repeat as string) || '',
      time_zone: event.time_zone || (source.timezone as string) || '',
      guests: event.guests || (source.guests as string) || '',
      description: event.description || (source.description as string) || '',
      availability: event.availability || (source.availability as string) || '',
      id_reminders:
        event.id_reminders ||
        (source.id_reminders as number[]) ||
        (anyEvent.idReminders as number[]) ||
        [],
    } as EventItem;
  });
}

function eventToEventItem(params: { event: CalendarEvent }): EventItem {
  const { event } = params;
  const dateStart =
    event.reminders?.start instanceof Date
      ? event.reminders.start.toISOString()
      : event.reminders?.start || '';
  const dateEnd =
    event.reminders?.end instanceof Date
      ? event.reminders.end.toISOString()
      : event.reminders?.end || '';

  return {
    id: event.id || 0,
    user_id: event.userId ?? authStore.localUser?.id ?? 0,
    title: event.name || '',
    calendar_id: 1,
    date_start: dateStart,
    date_end: dateEnd,
    notifications: event.reminders?.notifications?.join(',') || '',
    repeat: event.reminders?.repeat?.type || '',
    time_zone: event.timezone || '',
    guests: event.guests ? JSON.stringify(event.guests) : '',
    description: event.description || '',
    availability: event.availability || '',
    id_reminders: event.reminders?.idReminders || [],
  };
}

function getEventById(params: { id: number }): CalendarEvent | undefined {
  const event = eventController.getEvent({ idEvent: params.id });
  if (!event) return undefined;
  const eventItem = event as unknown as Record<string, unknown>;
  const startVal =
    (eventItem.date_start as string) ||
    (eventItem.reminders
      ? ((eventItem.reminders as Record<string, unknown>).start as string)
      : '') ||
    '';
  const endVal =
    (eventItem.date_end as string) ||
    (eventItem.reminders ? ((eventItem.reminders as Record<string, unknown>).end as string) : '') ||
    '';
  const notifications = parseStoredNotifications(
    (eventItem.notifications as string | string[] | undefined) ??
      ((eventItem.reminders as Record<string, unknown> | undefined)?.notifications as
        | string
        | string[]
        | undefined) ??
      '',
  );
  const repeat = parseStoredRepeat(
    (eventItem.repeat as string | Record<string, unknown> | undefined) ??
      ((eventItem.reminders as Record<string, unknown> | undefined)?.repeat as
        | string
        | Record<string, unknown>
        | undefined) ??
      '',
  );
  const reminders = {
    start: startVal ? new Date(startVal) : new Date(),
    end: endVal ? new Date(endVal) : new Date(),
    notifications,
    repeat,
    idReminders: ((eventItem.id_reminders as number[]) ||
      (eventItem as any).reminders?.idReminders ||
      []) as number[],
  };
  return {
    id: eventItem.id as number,
    userId:
      (eventItem.user_id as number) ||
      (eventItem.userId as number) ||
      (authStore.localUser?.id ?? 0),
    name: (eventItem.title as string) || (eventItem.name as string) || '',
    reminders,
    timezone: (eventItem.time_zone as string) || (eventItem.timezone as string) || '',
    description: (eventItem.description as string) || '',
    availability: (eventItem.availability as string) || '',
    guests: parseGuests(eventItem.guests),
    idSync: null,
    syncStatus: true,
    status: 'active',
  } as unknown as CalendarEvent;
}

function parseGuests(raw: unknown): Array<{ email: string }> {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* ignore malformed guests */
    }
  }
  return [];
}

function parseStoredNotifications(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) return raw.filter((n): n is string => typeof n === 'string');
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
  }
  return [];
}

function parseStoredRepeat(raw: unknown): {
  frecuency: number;
  type: string;
  daysWeek?: string[];
} {
  if (typeof raw === 'string' && raw.trim()) {
    return { frecuency: 1, type: raw };
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      frecuency: (obj.frecuency as number) ?? 1,
      type: (obj.type as string) ?? 'unique',
      daysWeek: Array.isArray(obj.daysWeek) ? (obj.daysWeek as string[]) : undefined,
    };
  }
  return { frecuency: 1, type: 'unique' };
}

function reschedule(): void {
  isOpenModalRescheduleTasks.value = true;
}

function onOpenDatePopover(event: PointerEvent): void {
  popoverMainCalendar.event = event;
  popoverMainCalendar.open = true;
}

function handleDateClick(params: { date: Date; endDate?: Date }): void {
  clickedDate.value = params.date;
  clickedEndDate.value = params.endDate ?? null;
  openModalAdd();
}

function handleEventClick(params: { event: { id: string | number } }): void {
  const rawId = String(params.event.id);
  if (rawId.startsWith('ext-')) {
    const found = externalEvents.value.find((item) => item.key === rawId);
    if (found) {
      selectedExternalEvent.value = found;
      isOpenModalExternalEvent.value = true;
    }
    return;
  }
  const id = typeof params.event.id === 'string' ? parseInt(params.event.id, 10) : params.event.id;
  openModalUpdate({ id });
}

async function handleEventUpdate(params: {
  id: number;
  dateStart: string;
  dateEnd?: string;
}): Promise<void> {
  const { id, dateStart, dateEnd } = params;
  try {
    if (id > 0) {
      // Server-owned event (authenticated): persist the new times too.
      await eventController.updateEvent({ id, dateStart, dateEnd });
    }
    await eventController.updateLocalEvent({
      id,
      updates: {
        date_start: dateStart,
        date_end: dateEnd || undefined,
      },
    });
    await systemController.openToast({ message: 'Evento actualizado' });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: 'Problema al actualizar evento',
      color: 'danger',
    });
  }
}

function handleViewChange(view: string): void {
  const viewMap: Record<string, string> = {
    timeGridWeek: 'week',
    timeGridDay: 'day',
    listWeek: 'diary',
  };
  const mode = (viewMap[view] || 'day') as ViewCalendar;
  if (calendarController.getCalendarModeView() !== mode) {
    calendarController.setCalendarModeView({ mode });
  }
}

function handleDateChange(date: Date): void {
  if (isNaN(date.getTime())) return;
  const mode = calendarController.getCalendarModeView();
  const currentDateObj = calendarController.getCurrentDate({ mode });
  const newDateStr = date.toISOString();
  if (currentDateObj.toISOString() === newDateStr) return;
  calendarController.setCurrentDate({ date, mode });
}

function isoFromReminderDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

function toReminderDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  return date instanceof Date ? date : new Date(date);
}

async function saveEvent(params: { event: CalendarEvent }): Promise<void> {
  try {
    const reminders = params.event.reminders;
    const canonical = normalizeOffsetCodes(reminders?.notifications ?? []);
    const repeat = reminders?.repeat ?? {
      frecuency: 1,
      type: 'unique' as RepeatType,
    };

    // Request notification permission synchronously within the user gesture
    // (before any network await below) or Capacitor/Chrome rejects it.
    let notificationsGranted = true;
    try {
      notificationsGranted = await useReminder().checkNotificationsPermissions();
    } catch {
      notificationsGranted = true;
    }

    if (authStore.isAnonymous) {
      const mapped = eventToEventItem({ event: params.event });
      mapped.id = -Date.now();
      let ids: number[] = [];
      try {
        const result = await useReminder().scheduleEventReminders({
          entityId: mapped.id,
          title: params.event.name || '',
          message: params.event.description,
          start: toReminderDate(reminders?.start),
          end: toReminderDate(reminders?.end ?? reminders?.start),
          repeat,
          notifications: canonical,
          existingIds: [],
        });
        ids = result.ids;
      } catch (error) {
        if (!(error instanceof NotificationPermissionError)) throw error;
      }
      mapped.id_reminders = ids;
      eventController.addEvent({ event: mapped });
      events.value.push(mapped);
      await db.events.put(mapped);

      isOpenModalAddEvent.value = false;
      await systemController.openToast({ message: 'Evento creado' });
      return;
    }

    const created = await eventController.createEvent({
      name: params.event.name || '',
      dateStart: isoFromReminderDate(reminders?.start) ?? '',
      dateEnd: reminders?.end ? isoFromReminderDate(reminders.end) : undefined,
      timeZone: params.event.timezone,
      description: params.event.description,
      availability: params.event.availability,
      notifications: canonical,
      guests: (params.event.guests ?? []).map((g) => g.email),
      id_reminders: [],
    });
    const serverId = (created as EventItem).id;

    let ids: number[] = [];
    try {
      const result = await useReminder().scheduleEventReminders({
        entityId: serverId,
        title: params.event.name || '',
        message: params.event.description,
        start: toReminderDate(reminders?.start),
        end: toReminderDate(reminders?.end ?? reminders?.start),
        repeat,
        notifications: canonical,
        existingIds: [],
      });
      ids = result.ids;
    } catch (error) {
      if (!(error instanceof NotificationPermissionError)) throw error;
    }

    await eventController.updateLocalEvent({
      id: serverId,
      updates: { id_reminders: ids },
    });

    isOpenModalAddEvent.value = false;
    await systemController.openToast({ message: 'Evento creado' });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: 'Problema al crear evento',
      color: 'danger',
    });
  }
}
async function updateEvent(params: { event: CalendarEvent }): Promise<void> {
  try {
    const reminders = params.event.reminders;
    const storeItem = eventController.getEvent({
      idEvent: params.event.id ?? 0,
    });
    const existingIds = reminders?.idReminders ?? storeItem?.id_reminders ?? [];
    const canonical = normalizeOffsetCodes(reminders?.notifications ?? []);
    const repeat = reminders?.repeat ?? {
      frecuency: 1,
      type: 'unique' as RepeatType,
    };

    let ids: number[] = existingIds;
    try {
      const result = await useReminder().scheduleEventReminders({
        entityId: params.event.id ?? 0,
        title: params.event.name || '',
        message: params.event.description,
        start: toReminderDate(reminders?.start),
        end: toReminderDate(reminders?.end ?? reminders?.start),
        repeat,
        notifications: canonical,
        existingIds,
      });
      ids = result.ids;
    } catch (error) {
      if (!(error instanceof NotificationPermissionError)) throw error;
    }

    const mapped = eventToEventItem({ event: params.event });
    const isLocalOnly = (params.event.id ?? 0) < 0 || authStore.isAnonymous;
    if (isLocalOnly) {
      mapped.id_reminders = ids;
      mapped.notifications = canonical.join(',');
      mapped.repeat = reminders?.repeat?.type ?? '';
      await eventController.updateLocalEvent({
        id: params.event.id ?? 0,
        event: mapped,
      });
    } else {
      await eventController.updateEvent({
        id: params.event.id ?? 0,
        name: params.event.name,
        dateStart: isoFromReminderDate(reminders?.start) ?? '',
        dateEnd: reminders?.end ? isoFromReminderDate(reminders.end) : undefined,
        timeZone: params.event.timezone,
        description: params.event.description,
        availability: params.event.availability,
        notifications: canonical,
        repeat: reminders?.repeat?.type,
        guests: (params.event.guests ?? []).map((g) => g.email),
        id_reminders: ids,
      });
      await eventController.updateLocalEvent({
        id: params.event.id ?? 0,
        updates: { id_reminders: ids },
      });
    }
    const idx = events.value.findIndex((e) => e.id === mapped.id);
    if (idx !== -1) events.value[idx] = mapped;
    isOpenModalUpdateEvent.value = false;
    await systemController.openToast({ message: 'Evento actualizado' });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: 'Problema al actualizar evento',
      color: 'danger',
    });
  }
}
async function deleteEvent(params: { eventId: number }): Promise<void> {
  try {
    const storeItem = eventController.getEvent({ idEvent: params.eventId });
    const ids = storeItem?.id_reminders ?? [];
    try {
      await useReminder().cancelEventReminders({ ids });
    } catch (error) {
      if (!(error instanceof NotificationPermissionError)) throw error;
    }
    await eventController.removeEvent({ id: params.eventId });
    events.value = events.value.filter((e) => e.id !== params.eventId);
    isOpenModalUpdateEvent.value = false;
    await systemController.openToast({ message: 'Evento eliminado' });
    await eventController.loadEvents();
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: 'Problema al eliminar evento',
      color: 'danger',
    });
  }
}
defineExpose({ openModalAdd, reschedule, syncDataEvents });
</script>

<style scoped>
.calendar-page-content {
  --overflow: hidden;
}

.calendar-page-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-page-grid > ion-row {
  flex: 1;
  display: flex;
  min-height: 0;
}

.calendar-page-grid > ion-row > ion-col {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-main-col {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.calendar-header-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.calendar-controls-left {
  display: flex;
  align-items: center;
}

.calendar-controls-right {
  display: flex;
  align-items: center;
}

.calendar-scroll-wrapper {
  flex: 1;
  min-height: 0;
}

.view-select {
  max-width: 140px;
}

.date-display-text {
  cursor: pointer;
  min-width: 140px;
  text-align: center;
  color: var(--ion-color-medium, #92949c);
  font-size: 0.95rem;
  font-weight: 500;
}

@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }

  .ion-hide-lg-up {
    display: none !important;
  }

  .ion-hide-lg-down {
    display: flex !important;
  }
}

@media only screen and (max-width: 991.98px) {
  .ion-hide-lg-down {
    display: none !important;
  }
}
</style>
