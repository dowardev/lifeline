// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { calendarService } from '@/services/calendarService'

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
  // LBDS-305 - mirror link to `calendar_sources.id`. Null for the
  // legacy local rows; non-null for rows that mirror an external
  // source. The lifecycle is driven server-side by
  // `CalendarSourceMirrorObserver`.
  source_id: number | null
  // LBDS-305 - metadata of the source this row mirrors. Null for
  // the local rows. `type` is the kind (google / caldav / ics) and
  // `username` the account, so a consumer can tell two accounts
  // apart when they share a calendar name. The events table and
  // LBDS-293 read this; the picker does not need it to list them.
  source: {
    id: number
    type: 'ics' | 'caldav' | 'google'
    name: string
    color: string
    username: string | null
  } | null
  // LBDS-305 - ISO 8601 when the row's source was disconnected, null
  // otherwise. The picker uses `selectable` (derived) as the single
  // source of truth for whether the row should appear.
  archived_at: string | null
  selectable: boolean
}

/**
 * Response shape for the Laravel-paginated `GET /calendars` endpoint.
 * The server wraps the array under `data` and adds `links`/`meta`
 * pagination metadata; we only consume `data` here and ignore the
 * rest.
 */
interface CalendarsListResponse {
  data?: CalendarItem[]
  calendars?: CalendarItem[]
}

/**
 * LBDS-298 - the response can come in two shapes today:
 *   - paginated `ResourceCollection` → `{ data: [...] }`
 *   - plain wrapper used elsewhere in the codebase → `{ calendars: [...] }`
 * Returns `null` for an unrecognised envelope so the caller can keep
 * the cached list instead of overwriting it with a meaningless
 * empty array on a server-side change.
 */
function extractCalendars(params: { payload: unknown }): CalendarItem[] | null {
  const { payload } = params
  if (!payload || typeof payload !== 'object') return null
  const obj = payload as CalendarsListResponse
  if (Array.isArray(obj.data)) return obj.data
  if (Array.isArray(obj.calendars)) return obj.calendars
  return null
}

export const useCalendarStore = defineStore('calendar', () => {
  const calendars = ref<CalendarItem[]>([])
  const now = new Date()
  const viewDates = ref<CalendarViewDates>({ date: now.toISOString(), day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() })
  const calendarModeView = ref<ViewCalendar>('day')
  const dataStatus = ref<CalendarDataStatus>({ upload: false, download: false })
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * LBDS-298 - the calendar flagged `default: 1` on the server, or
   * the first row if none is flagged. `null` when the user has zero
   * calendars (the picker hides itself and the create payload omits
   * `calendar_id` so LBDS-292's auto-provision takes over server-side).
   *
   * LBDS-305 - archived mirrors (`selectable: false`) are skipped so
   * the picker does not pre-select a row that was disconnected on
   * the server. Local rows are always selectable.
   *
   * `default` arrives as a number from the JSON Resource (the
   * Eloquent `$casts` `default => boolean` is for the model's PHP
   * surface; the JSON shape is still `0|1`).
   */
  const defaultCalendar = computed<CalendarItem | null>(() => {
    const selectable = calendars.value.filter((c) => c.selectable)
    if (selectable.length === 0) return null
    const flagged = selectable.find((c) => Number(c.default) === 1)
    return flagged ?? selectable[0] ?? null
  })

  function setCalendars(params: { calendars: CalendarItem[] }): void {
    calendars.value = params.calendars
  }

  function setViewDates(params: { viewDates: CalendarViewDates }): void {
    viewDates.value = params.viewDates
  }

  function setCalendarModeView(params: { mode: ViewCalendar }): void {
    calendarModeView.value = params.mode
  }

  function setDataStatus(params: { dataStatus: CalendarDataStatus }): void {
    dataStatus.value = params.dataStatus
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

  /**
   * LBDS-298 - refreshes the cached list of calendars from
   * `GET /calendars`. The backend already filters to the
   * authenticated user (see `CalendarController::index`), so we do
   * not need a `user_id` argument here.
   *
   * Malformed response envelopes (neither `{ data }` nor
   * `{ calendars }`) leave the previously cached rows in place; we do
   * not want the picker to blank out on a server-side change we did
   * not recognise yet.
   */
  async function getCalendars(): Promise<CalendarItem[]> {
    setLoading({ loading: true })
    clearError()
    try {
      const response = await calendarService.getCalendars()
      const list = extractCalendars({ payload: response })
      if (list !== null) {
        setCalendars({ calendars: list })
        return list
      }
      // Unrecognised envelope: leave the cached rows untouched so
      // the picker keeps showing the last-known calendars. The
      // caller sees an empty list (the parse failed) but the store
      // is not blanked out.
      return []
    } catch (e) {
      setError({ error: e instanceof Error ? e.message : 'Unknown error' })
      throw e
    } finally {
      setLoading({ loading: false })
    }
  }

  return {
    calendars,
    viewDates,
    calendarModeView,
    dataStatus,
    loading,
    error,
    defaultCalendar,
    setCalendars,
    setViewDates,
    setCalendarModeView,
    setDataStatus,
    setLoading,
    setError,
    clearError,
    getCalendars,
  }
})
