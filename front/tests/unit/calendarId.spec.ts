// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * GitLab #2 - the calendar a local event row belongs to.
 *
 * The old code coerced a missing calendar to `1` (`(source.calendar_id as
 * number) || 1` and `event.calendar_id ?? 1`), which silently filed every
 * calendar-less event under the first calendar of the account and turned a
 * real `0` into a valid-looking id. The helper replaces that magic with an
 * explicit contract:
 *
 *   - a positive integer is the id of the calendar the event belongs to
 *   - anything else (null, undefined, 0, negatives, non-integers, strings)
 *     means "this event has no calendar" and resolves to `null`
 *
 * `null` is not a fallback to a default calendar: LBDS-292 provisions the
 * default calendar server-side.
 */

import { describe, it, expect } from 'vitest'

import { resolveCalendarId } from '@/utils/calendarId'

describe('resolveCalendarId', () => {
  it('keeps a valid calendar id untouched', () => {
    expect(resolveCalendarId({ calendarId: 42 })).toBe(42)
    expect(resolveCalendarId({ calendarId: 1 })).toBe(1)
  })

  it('resolves a missing calendar to null instead of coercing it to 1', () => {
    expect(resolveCalendarId({ calendarId: undefined })).toBeNull()
    expect(resolveCalendarId({ calendarId: null })).toBeNull()
    expect(resolveCalendarId({})).toBeNull()
  })

  it('does not turn 0 into calendar 1', () => {
    // The old `|| 1` turned a real `0` into the first calendar id.
    expect(resolveCalendarId({ calendarId: 0 })).toBeNull()
  })

  it('rejects ids that are not positive integers', () => {
    expect(resolveCalendarId({ calendarId: -3 })).toBeNull()
    expect(resolveCalendarId({ calendarId: 1.5 })).toBeNull()
    expect(resolveCalendarId({ calendarId: Number.NaN })).toBeNull()
    expect(resolveCalendarId({ calendarId: Number.POSITIVE_INFINITY })).toBeNull()
  })

  it('rejects values that are not numbers at all', () => {
    expect(resolveCalendarId({ calendarId: '42' as unknown as number })).toBeNull()
    expect(resolveCalendarId({ calendarId: {} as unknown as number })).toBeNull()
  })
})
