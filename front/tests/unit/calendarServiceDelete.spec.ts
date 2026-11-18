// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-292 - the delete contract of a calendar the user created.
 *
 * The API expresses the two ways out of a calendar in the DELETE body:
 *
 *   - `delete_events`: the calendar and its events are destroyed
 *     together (the default);
 *   - `move`: the events are moved to `destination_calendar_id` (a
 *     LOCAL calendar of the same account) and the source calendar is
 *     deleted.
 *
 * There is no third option: no event is ever left without a calendar.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const deleteCalls: Array<{ url: string; data?: unknown }> = []

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeDelete({ url, data }: { url: string; data?: unknown }): Promise<unknown> {
      deleteCalls.push({ url, data })
      return null
    },
  },
}))

const { calendarService } = await import('@/services/calendarService')

beforeEach(() => {
  deleteCalls.length = 0
})

describe('calendarService.deleteCalendar (LBDS-292)', () => {
  it('sends the strategy in the query string and in the body', async () => {
    await calendarService.deleteCalendar({ id: 12, strategy: 'delete_events' })

    expect(deleteCalls.length).toBe(1)
    // The query string survives a proxy that strips a DELETE body, and
    // the body survives a proxy that drops the query.
    expect(deleteCalls[0].url).toBe('/calendars/12?strategy=delete_events')
    expect(deleteCalls[0].data).toEqual({ strategy: 'delete_events' })
  })

  it('sends the move strategy with the destination calendar', async () => {
    await calendarService.deleteCalendar({
      id: 12,
      strategy: 'move',
      destinationCalendarId: 3,
    })

    expect(deleteCalls[0].url).toBe(
      '/calendars/12?strategy=move&destination_calendar_id=3',
    )
    expect(deleteCalls[0].data).toEqual({
      strategy: 'move',
      destination_calendar_id: 3,
    })
  })

  it('omits the destination when the move has no explicit destination', async () => {
    await calendarService.deleteCalendar({ id: 12, strategy: 'move' })

    expect(deleteCalls[0].url).toBe('/calendars/12?strategy=move')
    expect(deleteCalls[0].data).toEqual({ strategy: 'move' })
  })
})
