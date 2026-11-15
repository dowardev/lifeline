// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sameEntityId } from '@/utils/entityId'
import type { ServerRepeat } from '@/utils/repeat'

export interface ScheduleElement {
  id: number
  title: string
  message: string
  hour: string
  start: string
  end: string
  dateStart: string
  dateEnd: string
  color: string
  availability: string
}

export interface ScheduleDay {
  date: string
  events: ScheduleElement[]
}

export interface Schedule {
  schedule: ScheduleDay[]
}

export interface EventItem {
  // LBDS-231 - a row created while offline carries a tempId string
  // ('tmp-<uuid>') until the reconciler swaps it for the server id.
  id: number | string
  user_id: number
  title: string
  calendar_id: number
  date_start?: string
  date_end?: string
  notifications?: string
  // The server stores the repeat rule as an array (Laravel casts the
  // column to `array`); the app also writes the bare type string.
  repeat?: string | ServerRepeat
  time_zone?: string
  guests?: string
  description?: string
  availability?: string
  id_reminders?: number[]
}

export const useEventStore = defineStore('event', () => {
  const events = ref<EventItem[]>([])
  const calendarSchedule = ref<Schedule>({ schedule: [] })
  const date = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  // LBDS-231 - shared monotonic clock that the controller bumps on every
  // server round-trip (loadEvents, the outbox reconciler). CalendarPage
  // watches this and reloads from the store, so a successful sync flush
  // reaches FullCalendar without a manual page refresh.
  const lastSyncedAt = ref<number | null>(null)

  function setEvents(params: { events: EventItem[] }): void {
    events.value = params.events
  }

  function addEvent(params: { event: EventItem }): void {
    events.value.push(params.event)
  }

  function updateEvent(params: { id: string | number; updates: Partial<EventItem> }): void {
    const { id, updates } = params
    // LBDS-231 - the id may reach us as a string (FullCalendar always
    // hands ids back as strings, and offline rows carry a tempId), so
    // the comparison cannot be a strict `===`.
    const index = events.value.findIndex((e) => sameEntityId(e.id, id))
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...updates }
    }
  }

  function removeEvent(params: { id: string | number }): void {
    // LBDS-231 - the reconciler passes the optimistic tempId (a string like
    // 'tmp-uuid') as `id`. The Dexie rows in the local Pinia store can carry
    // either a server number id or a tempId string until reconciliation,
    // so we compare by stringified id rather than `!==` (which would
    // always be true for number-vs-string).
    events.value = events.value.filter((e) => !sameEntityId(e.id, params.id))
  }

  function setSchedule(params: { schedule: Schedule }): void {
    calendarSchedule.value = params.schedule
  }

  function setDate(params: { date: string }): void {
    date.value = params.date
  }

  function setLoading(params: { loading: boolean }): void {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }): void {
    error.value = params.error
  }

  function clearError(): void {
    error.value = null
  }

  function markSynced(params: { at: number }): void {
    lastSyncedAt.value = params.at
  }

  return { events, calendarSchedule, date, loading, error, lastSyncedAt, setEvents, addEvent, updateEvent, removeEvent, setSchedule, setDate, setLoading, setError, clearError, markSynced }
})
