<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div class="calendar-widget">
    <div class="calendar-widget-header">
      <span class="calendar-widget-date">{{ currentDateLabel }}</span>
      <ion-button fill="solid" size="small" @click="openModalAddEvent()">
        <ion-icon slot="start" :icon="addOutline"></ion-icon>
        Añadir evento
      </ion-button>
    </div>
    <FullyCalendarVue3
      ref="calendarRef"
      :events="events"
      :current-view="'day'"
      :current-date="new Date()"
      @date-click="openModalAddEvent"
      @event-click="handleEventClick"
    />

    <!-- modal add event -->
    <ion-modal
      class="modal-event"
      :backdrop-dismiss="false"
      :is-open="isOpenModalAddEvent"
      @did-dismiss="isOpenModalAddEvent = false"
    >
      <AdminEventComponent @create="saveEvent" />
    </ion-modal>

    <!-- modal update event -->
    <ion-modal
      class="modal-event"
      :backdrop-dismiss="false"
      :is-open="isOpenModalUpdateEvent"
      @did-dismiss="
        isOpenModalUpdateEvent = false;
        selectedEventId = 0;
      "
    >
      <AdminEventComponent
        :event-data="selectedEventData"
        @update="updateEvent"
        @delete="deleteEvent"
      />
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonButton, IonIcon, IonModal } from "@ionic/vue";
import { onMounted, ref, watch, computed } from "vue";
import { addOutline } from "ionicons/icons";

// 2. Controllers / Composables
import { db } from "@/db";
import { EventController } from "@/controllers/eventController";
import { SystemController } from "@/controllers/systemController";
const eventController = new EventController();
const systemController = new SystemController();
import { useAuthStore } from "@/store/authStore";
const authStore = useAuthStore();
import { useReminder } from "@/composables/useReminder";
import { NotificationPermissionError } from "@/controllers/reminderController";
import { normalizeOffsetCodes } from "@/utils/reminders";
import { isServerOwnedId, resolveEntityId } from "@/utils/entityId";
import type { RepeatType } from "@/utils/types";

// 3. Components
import FullyCalendarVue3 from "@/components/calendar/fullcalendar/FullyCalendarVue3.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
// 4. Interface and types imports
import type { EventItem } from "@/store/eventStore";
import type { Event } from "@/utils/interfaces";
import { toPlainData } from "@/utils/plainData";
import { eventToEventItem } from "@/utils/calendarEventItem";

// 5. Main (props, emits, etc.)

// 6. Vars and const
const events = ref<EventItem[]>([]);
const calendarRef = ref<InstanceType<typeof FullyCalendarVue3> | null>(null);
const isOpenModalAddEvent = ref(false);
const isOpenModalUpdateEvent = ref(false);
const selectedEventId = ref<string | number>(0);
const currentDateLabel = new Date().toLocaleDateString();

// 7. Watch
watch(
  () => eventController.getEvents(),
  (response) => {
    events.value = response;
  },
  { immediate: true },
);

// 8. Computed
const selectedEventData = computed<Event | undefined>(() => {
  if (!selectedEventId.value) return undefined;
  const event = eventController.getEvent({ idEvent: selectedEventId.value });
  if (!event) return undefined;

  return {
    id: event.id,
    userId: event.user_id,
    name: event.title,
    reminders: {
      start: event.date_start ? new Date(event.date_start) : new Date(),
      end: event.date_end ? new Date(event.date_end) : new Date(),
      notifications: event.notifications
        ? event.notifications.split(",").filter(Boolean)
        : [],
      repeat: event.repeat
        ? { frecuency: 1, type: event.repeat as any, daysWeek: [] }
        : { frecuency: 1, type: "daily" as any, daysWeek: [] },
      idReminders: event.id_reminders || [],
    },
    description: event.description || "",
    availability: event.availability || "",
    timezone: event.time_zone || "",
    guests: parseGuests(event.guests),
    // The calendar the event belongs to: the modal keeps it when the
    // calendar list cannot be loaded (offline), so the update does not
    // detach the event from its calendar.
    calendar_id: event.calendar_id ?? null,
    idSync: null,
    syncStatus: true,
    status: "active",
  } as Event;
});

// 9. OnMounted
function parseGuests(raw: unknown): Array<{ email: string }> {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore malformed guests
    }
  }
  return [];
}

onMounted(() => {
  events.value = eventController.getEvents();
  // Load events from server/IndexedDB on first mount so the HomePage
  // widget shows events without visiting the Calendar view first.
  if (events.value.length === 0) {
    void eventController.loadEvents().then(() => {
      events.value = eventController.getEvents();
    });
  }
});

// 10. Functions
function openModalAddEvent(): void {
  isOpenModalAddEvent.value = true;
}

function handleEventClick(params: { event: { id: string | number } }): void {
  // LBDS-231 - the id must not be coerced: an offline row carries a
  // tempId ('tmp-<uuid>') and parseInt would turn it into NaN, so the
  // modal would never find the row.
  const id = resolveEntityId(params.event.id);
  const found = eventController.getEvent({ idEvent: id });
  if (!found) return;
  selectedEventId.value = id;
  isOpenModalUpdateEvent.value = true;
}

function isoFromReminderDate(
  date: Date | string | null | undefined,
): string | undefined {
  if (!date) return undefined;
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
}

function toReminderDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  return date instanceof Date ? date : new Date(date);
}

async function saveEvent(params: { data: { event: Event } }): Promise<void> {
  try {
    const reminders = params.data.event.reminders;
    const canonical = normalizeOffsetCodes(reminders?.notifications ?? []);
    const repeat = reminders?.repeat ?? {
      frecuency: 1,
      type: "unique" as RepeatType,
    };

    // Request notification permission synchronously within the user gesture
    // (before any network await below) or Capacitor/Chrome rejects it.
    await useReminder()
      .checkNotificationsPermissions()
      .catch(() => undefined);

    if (authStore.isAnonymous) {
      const mapped = eventToEventItem({
        event: params.data.event,
        fallbackUserId: authStore.localUser?.id ?? 0,
      });
      mapped.id = -Date.now();
      let ids: number[] = [];
      try {
        const result = await useReminder().scheduleEventReminders({
          entityId: mapped.id,
          title: params.data.event.name || "",
          message: params.data.event.description,
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
      // The modal hands over reactive state and IndexedDB cannot clone
      // a Proxy, so the row is unwrapped to plain data first.
      await db.events.put(toPlainData(mapped));

      isOpenModalAddEvent.value = false;
      await systemController.openToast({ message: "Evento creado" });
      return;
    }

    const created = await eventController.createEvent({
      name: params.data.event.name || "",
      dateStart: isoFromReminderDate(reminders?.start) ?? "",
      dateEnd: reminders?.end ? isoFromReminderDate(reminders.end) : undefined,
      timeZone: params.data.event.timezone,
      description: params.data.event.description,
      availability: params.data.event.availability,
      notifications: canonical,
      guests: (params.data.event.guests ?? []).map((g) => g.email),
      id_reminders: [],
      // LBDS-298 - thread the picker selection through. `undefined`
      // is omitted from the JSON payload, the path for users with 0
      // calendars (LBDS-292 auto-provisions server-side).
      calendar_id:
        params.data.event.calendar_id !== undefined &&
        params.data.event.calendar_id !== null
          ? params.data.event.calendar_id
          : undefined,
    });
    const serverId = (created as EventItem).id;

    let ids: number[] = [];
    try {
      const result = await useReminder().scheduleEventReminders({
        entityId: serverId,
        title: params.data.event.name || "",
        message: params.data.event.description,
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

    await eventController.updateEvent({
      id: serverId,
      id_reminders: ids,
    });

    isOpenModalAddEvent.value = false;
    await systemController.openToast({ message: "Evento creado" });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: "Problema al crear evento",
      color: "danger",
    });
  }
}

async function updateEvent(params: { data: { event: Event } }): Promise<void> {
  try {
    const reminders = params.data.event.reminders;
    const storeItem = eventController.getEvent({
      idEvent: params.data.event.id ?? 0,
    });
    const existingIds = reminders?.idReminders ?? storeItem?.id_reminders ?? [];
    const canonical = normalizeOffsetCodes(reminders?.notifications ?? []);
    const repeat = reminders?.repeat ?? {
      frecuency: 1,
      type: "unique" as RepeatType,
    };

    let ids: number[] = existingIds;
    try {
      const result = await useReminder().scheduleEventReminders({
        entityId: params.data.event.id ?? 0,
        title: params.data.event.name || "",
        message: params.data.event.description,
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

    const mapped = eventToEventItem({
      event: params.data.event,
      fallbackUserId: authStore.localUser?.id ?? 0,
    });
    // Same rule as the calendar page: the id decides, not the session.
    const isLocalOnly = !isServerOwnedId(params.data.event.id);
    if (isLocalOnly) {
      mapped.id_reminders = ids;
      mapped.notifications = canonical.join(",");
      mapped.repeat = reminders?.repeat?.type ?? "";
      await eventController.updateLocalEvent({
        id: params.data.event.id ?? 0,
        event: mapped,
      });
    } else {
      await eventController.updateEvent({
        id: params.data.event.id ?? 0,
        name: params.data.event.name,
        dateStart: isoFromReminderDate(reminders?.start) ?? "",
        dateEnd: reminders?.end
          ? isoFromReminderDate(reminders.end)
          : undefined,
        timeZone: params.data.event.timezone,
        description: params.data.event.description,
        availability: params.data.event.availability,
        notifications: canonical,
        repeat: reminders?.repeat?.type,
        guests: (params.data.event.guests ?? []).map((g) => g.email),
        id_reminders: ids,
        // LBDS-298 - picker changes reach the server. `undefined`
        // keeps the row's existing calendar_id (no PATCH entry).
        //
        // LBDS-292 - `null` is not sent: an event always belongs to
        // a calendar, so the key is omitted and the row keeps the
        // calendar it already has.
        calendar_id:
          params.data.event.calendar_id !== undefined &&
          params.data.event.calendar_id !== null
            ? params.data.event.calendar_id
            : undefined,
      });
      await eventController.updateLocalEvent({
        id: params.data.event.id ?? 0,
        updates: { id_reminders: ids },
      });
    }
    isOpenModalUpdateEvent.value = false;
    await systemController.openToast({ message: "Evento actualizado" });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: "Problema al actualizar evento",
      color: "danger",
    });
  }
}

async function deleteEvent(params: { data: { id: number } }): Promise<void> {
  try {
    const storeItem = eventController.getEvent({ idEvent: params.data.id });
    const ids = storeItem?.id_reminders ?? [];
    try {
      await useReminder().cancelEventReminders({ ids });
    } catch (error) {
      if (!(error instanceof NotificationPermissionError)) throw error;
    }
    await eventController.removeEvent({ id: params.data.id });
    isOpenModalUpdateEvent.value = false;
    await systemController.openToast({ message: "Evento eliminado" });
    await eventController.loadEvents();
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: "Problema al eliminar evento",
      color: "danger",
    });
  }
}
</script>

<style scoped>
.calendar-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
}

.calendar-widget-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--ion-text-color);
}

.calendar-widget :deep(.fc-col-header) {
  display: none;
}

@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
