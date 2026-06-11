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

  function setEvents(params: { events: EventItem[] }) {
    events.value = params.events
  }

  function addEvent(params: { event: EventItem }) {
    events.value.push(params.event)
  }

  function updateEvent(params: { id: number; updates: Partial<EventItem> }) {
    const { id, updates } = params
    const index = events.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...updates }
    }
  }

  function removeEvent(params: { id: number }) {
    events.value = events.value.filter((e) => e.id !== params.id)
  }

  function setSchedule(params: { schedule: Schedule }) {
    calendarSchedule.value = params.schedule
  }

  function setDate(params: { date: string }) {
    date.value = params.date
  }

  function setLoading(params: { loading: boolean }) {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }) {
    error.value = params.error
  }

  function clearError() {
    error.value = null
  }

  return { events, calendarSchedule, date, loading, error, setEvents, addEvent, updateEvent, removeEvent, setSchedule, setDate, setLoading, setError, clearError }
})
