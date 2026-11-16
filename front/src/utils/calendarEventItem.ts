// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Mapping between the local event rows (`EventItem`) and the calendar
 * component's event shape (`Event`).
 *
 * GitLab #2: `normalizeEvents` and `eventToEventItem` used to coerce a
 * missing calendar to `1` (`(source.calendar_id as number) || 1` and
 * `event.calendar_id ?? 1`). Both lived in their own view/component and
 * each had its own copy of the magic. They now share this module and the
 * single `resolveCalendarId` helper, whose contract is documented there:
 * a positive integer is a real calendar id, anything else means "this
 * event has no calendar" (`null`).
 */

import { resolveCalendarId } from '@/utils/calendarId'
import type { EventItem } from '@/store/eventStore'
import type { Event as CalendarEvent } from '@/utils/interfaces'

/**
 * Normalizes the local rows into the shape the calendar renders.
 *
 * `fallbackUserId` is the id of the signed-in user, used only when the
 * row itself carries no `user_id`.
 */
export function normalizeEvents(params: {
  events: EventItem[]
  fallbackUserId?: number
}): EventItem[] {
  const fallbackUserId = params.fallbackUserId ?? 0
  return params.events.map((event) => {
    const anyEvent = event as unknown as Record<string, unknown>
    // LBDS-231 - defensive unwrap for rows that the old reconciler stored
    // with the server's `{ event: {...} }` wrapper instead of flattening it.
    // The new reconciler (`eventController.ts`) stores them at the row root,
    // so this branch only matters for already-persisted rows from before the
    // fix landed.
    const wrapped = anyEvent.event as Record<string, unknown> | undefined
    const source: Record<string, unknown> =
      wrapped && typeof wrapped === 'object' ? { ...anyEvent, ...wrapped } : anyEvent
    // No `if (title && date_start) return event` shortcut: the reconciler
    // writes `dateStart` (camelCase, the local key) plus `dateStart` (also
    // the server key after the unwrap fix), and never `date_start`. The
    // shortcut skipped the `date_start` assignment and FullCalendar received
    // `start: ''`. Always normalise.
    return {
      id: event.id,
      user_id:
        (source.user_id as number) ||
        (source.userId as number) ||
        fallbackUserId,
      title: event.title || (source.name as string) || '',
      // GitLab #2 - no `|| 1` here: an event without a calendar stays
      // without one (`null`) until the server assigns the default
      // calendar (LBDS-292).
      calendar_id: resolveCalendarId({
        calendarId: source.calendar_id as number | null | undefined,
      }),
      date_start:
        (anyEvent.date_start as string) ||
        (anyEvent.dateStart as string) ||
        ((source.reminders
          ? (source.reminders as Record<string, unknown>).start instanceof Date
            ? ((source.reminders as Record<string, unknown>).start as Date).toISOString()
            : ((source.reminders as Record<string, unknown>).start as string) || ''
          : '') as string),
      date_end:
        (anyEvent.date_end as string) ||
        (anyEvent.dateEnd as string) ||
        ((source.reminders
          ? (source.reminders as Record<string, unknown>).end instanceof Date
            ? ((source.reminders as Record<string, unknown>).end as Date).toISOString()
            : ((source.reminders as Record<string, unknown>).end as string) || undefined
          : undefined) as string | undefined),
      notifications: event.notifications || (source.notifications as string) || '',
      repeat: event.repeat || (source.repeat as string) || '',
      time_zone: event.time_zone || (source.timezone as string) || '',
      guests: event.guests || (source.guests as string) || '',
      description: event.description || (source.description as string) || '',
      availability: event.availability || (source.availability as string) || '',
      id_reminders:
        event.id_reminders ||
        (source.id_reminders as number[]) ||
        (anyEvent.idReminders as number[]) ||
        [],
    } as EventItem
  })
}

/**
 * Maps the calendar component's event shape into the local row shape.
 *
 * `fallbackUserId` is the id of the signed-in user, used only when the
 * event itself carries no `userId`.
 */
export function eventToEventItem(params: {
  event: CalendarEvent
  fallbackUserId?: number
}): EventItem {
  const { event } = params
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
    user_id: event.userId ?? params.fallbackUserId ?? 0,
    title: event.name || '',
    // LBDS-298 - mirror the picker selection into the local row so the
    // optimistically inserted event lands in FullCalendar with the right
    // calendar_id. GitLab #2 - when the picker sent no calendar, the row
    // keeps `null` (no calendar) instead of being filed under calendar 1.
    calendar_id: resolveCalendarId({ calendarId: event.calendar_id }),
    date_start: dateStart,
    date_end: dateEnd,
    notifications: event.reminders?.notifications?.join(',') || '',
    repeat: event.reminders?.repeat?.type || '',
    time_zone: event.timezone || '',
    guests: event.guests ? JSON.stringify(event.guests) : '',
    description: event.description || '',
    availability: event.availability || '',
    id_reminders: event.reminders?.idReminders || [],
  }
}
