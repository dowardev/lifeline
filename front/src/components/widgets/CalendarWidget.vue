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
      @did-dismiss="isOpenModalUpdateEvent = false; selectedEventId = 0"
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
import { IonButton, IonIcon, IonModal } from '@ionic/vue'
import { onMounted, ref, watch, computed } from 'vue'
import { addOutline } from 'ionicons/icons'

// 2. Controllers / Composables
import { EventController } from '@/controllers/eventController'
import { SystemController } from '@/controllers/systemController'
const eventController = new EventController()
const systemController = new SystemController()
import { useAuthStore } from '@/store/authStore'
const authStore = useAuthStore()

// 3. Components
import FullyCalendarVue3 from '@/components/calendar/fullcalendar/FullyCalendarVue3.vue'
import AdminEventComponent from '@/components/events/add/AddEventCompoenent.vue'
// 4. Interface and types imports
import type { EventItem } from '@/store/eventStore'
import type { Event } from '@/utils/interfaces'

// 5. Main (props, emits, etc.)

// 6. Vars and const
const events = ref<EventItem[]>([])
const calendarRef = ref<InstanceType<typeof FullyCalendarVue3> | null>(null)
const isOpenModalAddEvent = ref(false)
const isOpenModalUpdateEvent = ref(false)
const selectedEventId = ref(0)
const currentDateLabel = new Date().toLocaleDateString()

// 7. Watch
watch(
  () => eventController.getEvents(),
  (response) => {
    events.value = response
  },
  { immediate: true },
)

// 8. Computed
const selectedEventData = computed<Event | undefined>(() => {
  if (!selectedEventId.value) return undefined
  const event = eventController.getEvent({ idEvent: selectedEventId.value })
  if (!event) return undefined

  return {
    id: event.id,
    userId: event.user_id,
    name: event.title,
    reminders: {
      start: event.date_start ? new Date(event.date_start) : new Date(),
      end: event.date_end ? new Date(event.date_end) : new Date(),
      notifications: event.notifications
        ? event.notifications.split(',').filter(Boolean)
        : [],
      repeat: event.repeat
        ? { frecuency: 1, type: event.repeat as any, daysWeek: [] }
        : { frecuency: 1, type: 'daily' as any, daysWeek: [] },
      idReminders: [],
    },
    description: event.description || '',
    availability: event.availability || '',
    timezone: event.time_zone || '',
    idSync: null,
    syncStatus: true,
    status: 'active',
  } as Event
})

// 9. OnMounted
onMounted(() => {
  events.value = eventController.getEvents()
})

// 10. Functions
function openModalAddEvent(): void {
  isOpenModalAddEvent.value = true
}

function handleEventClick(params: { event: { id: string | number } }): void {
  const id =
    typeof params.event.id === 'string'
      ? parseInt(params.event.id, 10)
      : params.event.id
  const found = eventController.getEvent({ idEvent: id })
  if (!found) return
  selectedEventId.value = id
  isOpenModalUpdateEvent.value = true
}

function eventToEventItem(params: { event: Event }): EventItem {
  const event = params.event
  const dateStart =
    event.reminders?.start instanceof Date
      ? event.reminders.start.toISOString()
      : event.reminders?.start || ''
  const dateEnd =
    event.reminders?.end instanceof Date
      ? event.reminders.end.toISOString()
      : event.reminders?.end || ''

  return {
    id: event.id || 0,
    user_id: event.userId ?? (authStore.localUser?.id ?? 0),
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
  }
}

async function saveEvent(params: { data: { event: Event } }): Promise<void> {
  try {
    const mapped = eventToEventItem({ event: params.data.event })
    mapped.id = -Date.now()

    await eventController.addLocalEvent({ event: mapped })

    isOpenModalAddEvent.value = false
    await systemController.openToast({ message: 'Evento creado' })
  } catch (error) {
    console.error(error)
    await systemController.openToast({
      message: 'Problema al crear evento',
      color: 'danger',
    })
  }
}

async function updateEvent(params: { data: { event: Event } }): Promise<void> {
  try {
    const mapped = eventToEventItem({ event: params.data.event })
    await eventController.updateLocalEvent({ event: mapped })
    isOpenModalUpdateEvent.value = false
    await systemController.openToast({ message: 'Evento actualizado' })
  } catch (error) {
    console.error(error)
    await systemController.openToast({
      message: 'Problema al actualizar evento',
      color: 'danger',
    })
  }
}

async function deleteEvent(params: { data: { id: number } }): Promise<void> {
  try {
    await eventController.removeEvent({ id: params.data.id })
    isOpenModalUpdateEvent.value = false
    await systemController.openToast({ message: 'Evento eliminado' })
    await eventController.loadEvents()
  } catch (error) {
    console.error(error)
    await systemController.openToast({
      message: 'Problema al eliminar evento',
      color: 'danger',
    })
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