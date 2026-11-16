// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Single source of truth for "which calendar does this event belong to?".
 *
 * GitLab #2: the calendar views used to coerce a missing calendar to `1`
 * (`(source.calendar_id as number) || 1` and `event.calendar_id ?? 1`).
 * That silently filed every calendar-less event under the first calendar
 * of the account and turned a real `0` into a valid-looking id.
 *
 * The contract here is explicit:
 *
 *   - a positive integer is the id of the calendar the event belongs to;
 *   - anything else (`null`, `undefined`, `0`, negatives, non-integers,
 *     non-numbers) means "this event has no calendar" and resolves to
 *     `null`.
 *
 * `null` is NOT a fallback to a default calendar: the default calendar is
 * provisioned server-side (LBDS-292). Consumers must therefore treat
 * `null` as "no calendar yet" and keep the event visible instead of
 * attributing it to an arbitrary calendar.
 */
export function resolveCalendarId(params: {
  calendarId?: number | null | undefined
}): number | null {
  const { calendarId } = params
  if (typeof calendarId !== 'number') return null
  if (!Number.isInteger(calendarId)) return null
  if (calendarId <= 0) return null
  return calendarId
}
