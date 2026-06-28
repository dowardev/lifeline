import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ViewCalendar = 'day' | 'week' | 'diary'

export interface CalendarViewDates {
  date: string
  day: number
  month: number
  year: number
}

export interface CalendarDataStatus {
  upload: boolean
  download: boolean
}

export interface CalendarItem {
  id: number
  user_id: number
  name: string
  default: number
}

export const useCalendarStore = defineStore('calendar', () => {
  const calendars = ref<CalendarItem[]>([])
  const now = new Date()
  const viewDates = ref<CalendarViewDates>({ date: now.toISOString(), day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() })
  const calendarModeView = ref<ViewCalendar>('day')
  const dataStatus = ref<CalendarDataStatus>({ upload: false, download: false })
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setCalendars(params: { calendars: CalendarItem[] }) {
    calendars.value = params.calendars
  }

  function setViewDates(params: { viewDates: CalendarViewDates }) {
    viewDates.value = params.viewDates
  }

  function setCalendarModeView(params: { mode: ViewCalendar }) {
    calendarModeView.value = params.mode
  }

  function setDataStatus(params: { dataStatus: CalendarDataStatus }) {
    dataStatus.value = params.dataStatus
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

  return { calendars, viewDates, calendarModeView, dataStatus, loading, error, setCalendars, setViewDates, setCalendarModeView, setDataStatus, setLoading, setError, clearError }
})
