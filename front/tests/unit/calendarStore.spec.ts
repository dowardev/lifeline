// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const apiCalls: Array<{ method: string; url: string; data?: unknown }> = []

const serverRows: Array<{
  id: number
  user_id: number
  name: string
  default: number
}> = []
let nextServerRows: unknown = { data: [] }

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'GET', url })
      return nextServerRows
    },
    async executeMutation(): Promise<unknown> {
      return null
    },
    async executeDelete(): Promise<unknown> {
      return null
    },
  },
}))

vi.mock('@/services/calendarService', () => ({
  calendarService: {
    async getCalendars(): Promise<unknown> {
      apiCalls.push({ method: 'GET', url: '/calendars' })
      return nextServerRows
    },
  },
}))

const { useCalendarStore } = await import('@/store/calendarStore')

beforeEach(() => {
  apiCalls.length = 0
  serverRows.length = 0
  nextServerRows = { data: [] }
  setActivePinia(createPinia())
})

describe('useCalendarStore - defaultCalendar', () => {
  it('returns null when the user has zero calendars', () => {
    const store = useCalendarStore()
    store.setCalendars({ calendars: [] })
    expect(store.defaultCalendar).toBeNull()
  })

  it('returns the calendar flagged default: 1 when present', () => {
    const store = useCalendarStore()
    store.setCalendars({
      calendars: [
        { id: 11, user_id: 7, name: 'Personal', default: 0 },
        { id: 12, user_id: 7, name: 'Trabajo', default: 1 },
        { id: 13, user_id: 7, name: 'Side', default: 0 },
      ],
    })
    expect(store.defaultCalendar).not.toBeNull()
    expect(store.defaultCalendar?.id).toBe(12)
    expect(store.defaultCalendar?.name).toBe('Trabajo')
  })

  it('falls back to the first row when no calendar is flagged default: 1', () => {
    const store = useCalendarStore()
    store.setCalendars({
      calendars: [
        { id: 21, user_id: 7, name: 'A', default: 0 },
        { id: 22, user_id: 7, name: 'B', default: 0 },
      ],
    })
    expect(store.defaultCalendar?.id).toBe(21)
    expect(store.defaultCalendar?.name).toBe('A')
  })

  it('treats default: 1 from a number-typed row as the default', () => {
    // Pinia might receive rows with default as a literal number; the
    // picker must pick them up without a cast.
    const store = useCalendarStore()
    store.setCalendars({
      calendars: [
        { id: 31, user_id: 7, name: 'X', default: 1 },
        { id: 32, user_id: 7, name: 'Y', default: 0 },
      ],
    })
    expect(store.defaultCalendar?.id).toBe(31)
  })
})

describe('useCalendarStore - getCalendars', () => {
  it('calls /calendars and unwraps a paginated `{ data: [...] }` envelope', async () => {
    nextServerRows = {
      data: [
        { id: 41, user_id: 7, name: 'Personal', default: 1 },
        { id: 42, user_id: 7, name: 'Trabajo', default: 0 },
      ],
      links: { first: '...', last: '...', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, per_page: 50, to: 2 },
    }
    const store = useCalendarStore()
    const list = await store.getCalendars()
    expect(list).toHaveLength(2)
    expect(store.calendars).toHaveLength(2)
    expect(store.calendars[0].id).toBe(41)
    expect(apiCalls.some((c) => c.url === '/calendars')).toBe(true)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('also accepts the `{ calendars: [...] }` envelope shape', async () => {
    nextServerRows = {
      calendars: [{ id: 51, user_id: 7, name: 'Side', default: 1 }],
    }
    const store = useCalendarStore()
    const list = await store.getCalendars()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(51)
  })

  it('records an error and rethrows when the request fails', async () => {
    const failingService = await import('@/services/calendarService')
    const spy = vi
      .spyOn(failingService.calendarService, 'getCalendars')
      .mockRejectedValueOnce(new Error('boom'))
    try {
      const store = useCalendarStore()
      await expect(store.getCalendars()).rejects.toThrow('boom')
      expect(store.error).toBe('boom')
      expect(store.loading).toBe(false)
    } finally {
      spy.mockRestore()
    }
  })

  it('does not mutate the cached list when the response is malformed', async () => {
    nextServerRows = { totally: 'wrong' }
    const store = useCalendarStore()
    store.setCalendars({
      calendars: [{ id: 99, user_id: 7, name: 'Sticky', default: 1 }],
    })
    const list = await store.getCalendars()
    expect(list).toEqual([])
    // The previous list stays in place when the envelope shape is not
    // recognised - the UI keeps showing the last-known calendars
    // instead of going blank on a server glitch.
    expect(store.calendars).toHaveLength(1)
    expect(store.calendars[0].id).toBe(99)
  })
})