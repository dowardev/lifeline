// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * GitLab #2 - `normalizeEvents` and `eventToEventItem` share one helper for
 * the `calendar_id` fallback.
 *
 * Before the fix both functions coerced a missing calendar to `1`:
 * `(source.calendar_id as number) || 1` and `event.calendar_id ?? 1`. An
 * event without a calendar was therefore filed under the first calendar of
 * the account, and a real `0` became a valid-looking calendar id.
 *
 * The contract now: a positive integer is the calendar the event belongs
 * to; anything else means "no calendar" (`null`). The default calendar is
 * provisioned server-side (LBDS-292).
 */

import { describe, it, expect } from 'vitest'

import { eventToEventItem, normalizeEvents } from '@/utils/calendarEventItem'
import type { EventItem } from '@/store/eventStore'
import type { Event as CalendarEvent } from '@/utils/interfaces'

function row(params: Partial<EventItem>): EventItem {
  return {
    id: 1,
    user_id: 7,
    title: 'Evento',
    calendar_id: null,
    ...params,
  }
}

function calendarEvent(params: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 2,
    userId: 7,
    name: 'Evento',
    description: '',
    availability: 'available',
    idSync: null,
    syncStatus: true,
    status: 'active',
    reminders: {
      start: new Date('2026-10-15T10:00:00Z'),
      end: new Date('2026-10-15T11:00:00Z'),
      idReminders: [],
    },
    ...params,
  } as CalendarEvent
}

describe('normalizeEvents - calendar_id fallback (GitLab #2)', () => {
  it('keeps a real calendar id', () => {
    const [event] = normalizeEvents({ events: [row({ calendar_id: 42 })] })
    expect(event.calendar_id).toBe(42)
  })

  it('does not attribute a calendar-less event to calendar 1', () => {
    const [event] = normalizeEvents({ events: [row({ calendar_id: null })] })
    expect(event.calendar_id).toBeNull()
  })

  it('does not turn a 0 into calendar 1', () => {
    const [event] = normalizeEvents({
      events: [row({ calendar_id: 0 as unknown as number | null })],
    })
    expect(event.calendar_id).toBeNull()
  })

  it('resolves an absent calendar_id to null', () => {
    const source = { ...row({ calendar_id: null }) } as Record<string, unknown>
    delete source.calendar_id
    const [event] = normalizeEvents({ events: [source as unknown as EventItem] })
    expect(event.calendar_id).toBeNull()
  })

  it('uses the fallback user id only when the row has none', () => {
    const [event] = normalizeEvents({
      events: [row({ user_id: 0, calendar_id: null })],
      fallbackUserId: 99,
    })
    expect(event.user_id).toBe(99)
  })
})

describe('eventToEventItem - calendar_id fallback (GitLab #2)', () => {
  it('keeps a real calendar id', () => {
    const item = eventToEventItem({ event: calendarEvent({ calendar_id: 7 }) })
    expect(item.calendar_id).toBe(7)
  })

  it('does not attribute a calendar-less event to calendar 1', () => {
    const item = eventToEventItem({ event: calendarEvent({ calendar_id: null }) })
    expect(item.calendar_id).toBeNull()
  })

  it('does not turn a 0 into calendar 1', () => {
    const item = eventToEventItem({
      event: calendarEvent({ calendar_id: 0 as unknown as number | null }),
    })
    expect(item.calendar_id).toBeNull()
  })

  it('uses the fallback user id only when the event has none', () => {
    const item = eventToEventItem({
      event: calendarEvent({ userId: undefined as unknown as number }),
      fallbackUserId: 99,
    })
    expect(item.user_id).toBe(99)
  })
})
