// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  id: number
  user_id: number
  title: string
  calendar_id: number
  date_start?: string
  date_end?: string
  notifications?: string
  repeat?: string
  time_zone?: string
  guests?: string
  description?: string
  availability?: string
}

export const useEventStore = defineStore('event', () => {
  const events = ref<EventItem[]>([])
  const calendarSchedule = ref<Schedule>({ schedule: [] })
  const date = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setEvents(params: { events: EventItem[] }): void {
    events.value = params.events
  }

  function addEvent(params: { event: EventItem }): void {
    events.value.push(params.event)
  }

  function updateEvent(params: { id: number; updates: Partial<EventItem> }): void {
    const { id, updates } = params
    const index = events.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...updates }
    }
  }

  function removeEvent(params: { id: number }): void {
    events.value = events.value.filter((e) => e.id !== params.id)
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

  return { events, calendarSchedule, date, loading, error, setEvents, addEvent, updateEvent, removeEvent, setSchedule, setDate, setLoading, setError, clearError }
})
