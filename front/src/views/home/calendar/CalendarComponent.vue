<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-grid>
    <ion-row class="ion-justify-content-center">
      <ion-col size="12">
        <section style="display: flex; justify-content: space-between">
          <div class="calendar-header">
            <span
              class="day-header"
              style="
                color: var(--ion-color-primary);
                line-height: 1;
                margin-right: 16px;
              "
            >
              {{ currentDay }}
            </span>
            <div style="display: flex; flex-direction: column; align-items: stretch">
              <div style="display: flex">
                <span class="month-header">{{ currentMonth }}</span>
              </div>
              <div>
                <span class="year-header">{{ currentYear }}</span>
              </div>
            </div>
          </div>

          <div class="center-vertical">
            <ion-button fill="clear" @click="isOpenModalAddEvent = true">
              <ion-icon :icon="addOutline"></ion-icon>
            </ion-button>
          </div>
        </section>

        <section class="calendar-section">
          <FullyCalendarVue3
            ref="calendarRef"
            :events="events"
            :current-view="'day'"
            :current-date="new Date()"
            @date-click="isOpenModalAddEvent = true"
            @event-click="handleEventClick"
          />
        </section>
      </ion-col>
    </ion-row>
  </ion-grid>

  <!-- modal add event -->
  <ion-modal
    class="modal-event"
    :backdrop-dismiss="false"
    :is-open="isOpenModalAddEvent"
    @did-dismiss="isOpenModalAddEvent = false"
  >
    <AdminEventComponent @create="saveEvent({ event: $event.data.event })" />
  </ion-modal>

  <!-- modal update event -->
  <ion-modal
    class="modal-event"
    :backdrop-dismiss="false"
    :is-open="isOpenModalUpdateEvent"
    @did-dismiss="isOpenModalUpdateEvent = false; selectedEventId = 0"
  >
    <AdminEventComponent
      :event-data="getEventById({ id: selectedEventId })"
      @update="updateEvent({ event: $event.data.event })"
      @delete="deleteEvent({ eventId: $event.data.id })"
    />
  </ion-modal>

  <!-- modal reschedule -->
  <ion-modal
    :is-open="isOpenModalRecheduleTasks"
    @did-dismiss="isOpenModalRecheduleTasks = false"
  >
    <ion-page>
      <ion-header mode="ios" class="ion-no-border">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="isOpenModalRecheduleTasks = false">
              <ion-icon :icon="closeOutline"></ion-icon>
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
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { computed, onMounted, ref, watch } from "vue";
import { addOutline, closeOutline } from "ionicons/icons";
import { db } from "@/db";

// 2. Controllers / Composables
import { EventController } from "@/controllers/eventController";
import { SystemController } from "@/controllers/systemController";
const eventController = new EventController();
const systemController = new SystemController();

// 3. Components
import FullyCalendarVue3 from "@/components/calendar/fullcalendar/FullyCalendarVue3.vue";
import AdminEventComponent from "@/components/events/add/AddEventCompoenent.vue";
import RescheduleComponent from "@/components/events/schedule-elements/RescheduleElements.vue";

// 4. Interface and types imports
import type { EventItem } from "@/store/eventStore";
import type { Event } from "@/utils/interfaces";

// 5. Main (props, emits, etc.)
defineExpose({
  openModalAdd,
  reschedule,
});

// 6. Vars and const
const events = ref<EventItem[]>([]);
const calendarRef = ref<InstanceType<typeof FullyCalendarVue3> | null>(null);
const now = ref(new Date());
const isOpenModalAddEvent = ref(false);
const isOpenModalUpdateEvent = ref(false);
const isOpenModalRecheduleTasks = ref(false);
const selectedEventId = ref(0);

// 7. Watch
watch(
  () => eventController.getEvents(),
  async (response) => {
    console.log('[home watch] events changed:', response.length, response)
    events.value = response;
  },
);

// 8. Computed
const currentDay = computed(() => now.value.getDate());
const currentMonth = computed(() => now.value.getMonth() + 1);
const currentYear = computed(() => now.value.getFullYear());

// 9. OnMounted
onMounted(async () => {
  events.value = eventController.getEvents();
});

// 10. Functions
function openModalAdd(): void {
  isOpenModalAddEvent.value = true;
}

function reschedule(): void {
  isOpenModalRecheduleTasks.value = true;
}

function handleEventClick(params: { event: { id: string | number } }): void {
  const id =
    typeof params.event.id === "string"
      ? parseInt(params.event.id, 10)
      : params.event.id;
  const found = eventController.getEvent({ idEvent: id })
  console.log('[handleEventClick] id:', id, 'found in store:', found)
  if (!found) return;
  selectedEventId.value = id;
  isOpenModalUpdateEvent.value = true;
}

function getEventById(params: { id: number }): Event | undefined {
  const event = eventController.getEvent({ idEvent: params.id });
  console.log('[getEventById] id:', params.id, 'result:', event)
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
      idReminders: [],
    },
    description: event.description || "",
    availability: event.availability || "",
    timezone: event.time_zone || "",
    idSync: null,
    syncStatus: true,
    status: "active",
  } as Event;
}

function eventToEventItem(params: { event: Event }): EventItem {
  const { event } = params;
  const dateStart =
    event.reminders?.start instanceof Date
      ? event.reminders.start.toISOString()
      : event.reminders?.start || "";
  const dateEnd =
    event.reminders?.end instanceof Date
      ? event.reminders.end.toISOString()
      : event.reminders?.end || "";

  return {
    id: event.id || 0,
    user_id: event.userId,
    title: event.name || "",
    calendar_id: 1,
    date_start: dateStart,
    date_end: dateEnd,
    notifications: event.reminders?.notifications?.join(",") || "",
    repeat: event.reminders?.repeat?.type || "",
    time_zone: event.timezone || "",
    guests: event.guests ? JSON.stringify(event.guests) : "",
    description: event.description || "",
    availability: event.availability || "",
  };
}

async function saveEvent(params: { event: Event }): Promise<void> {
  try {
    const mapped = eventToEventItem({ event: params.event });
    mapped.id = -Date.now();

    eventController.addEvent({ event: mapped });
    await db.events.put(mapped);

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

async function updateEvent(params: { event: Event }): Promise<void> {
  try {
    const mapped = eventToEventItem({ event: params.event });
    await eventController.updateLocalEvent({ event: mapped });
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

async function deleteEvent(params: { eventId: number }): Promise<void> {
  try {
    await eventController.removeEvent({ id: params.eventId });
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
.calendar-section {
  height: calc(100dvh - 301px);
}

.calendar-section :deep(.fc-col-header) {
  display: none;
}

.calendar-header {
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
}

.day-header {
  font-size: 70px;
  font-weight: bold;
}

.month-header {
  font-size: 20px;
}

.year-header {
  font-size: 20px;
}

@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
