// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Repeat rule helpers.
 *
 * The app models the repeat rule as an object: `{ type, frecuency, daysWeek }`
 * (see `utils/interfaces.ts`). The Laravel backend models it as an ARRAY:
 * `PUT /events/{id}` validates `repeat` with `sometimes|nullable|array`
 * (see `App\Http\Controllers\EventController::update`) and the column is
 * cast to `array` (see `App\Models\Event::$casts`).
 *
 * Sending the bare type string ("unique", "daily", ...) makes the backend
 * answer 422 ("The repeat must be an array"), so the whole event update is
 * rejected and the row never changes server-side. These helpers own the
 * translation between the two shapes.
 */

/** "unique" means the event happens once: there is no repetition rule. */
export const NO_REPEAT = 'unique'

/** The repeat rule as the app models it. */
export interface RepeatRule {
  type: string
 frecuency: number
  daysWeek?: string[]
}

/** The repeat rule in the shape the backend stores it (JSON column). */
export interface ServerRepeatRule {
  type: string
 frecuency: number
  daysWeek?: string[]
}

/** The backend stores the repeat rule as an array of rules. */
export type ServerRepeat = ServerRepeatRule[]

/**
 * Builds the wire payload for the `repeat` field.
 *
 * - "unique" (or an empty value) becomes an empty array: no repetition.
 * - A type string becomes a single-element array with that type.
 * - The app's object shape becomes a single-element array.
 * - An array (already in wire shape) is normalized entry by entry.
 */
export function toServerRepeat(params: { repeat: unknown }): ServerRepeat {
  const { repeat } = params
  if (repeat === null || repeat === undefined) return []
  if (Array.isArray(repeat)) return repeat.map(toServerRule)
  if (typeof repeat === 'string') {
    const type = repeat.trim()
    if (!type || type === NO_REPEAT) return []
    return [{ type, frecuency: 1 }]
  }
  if (typeof repeat === 'object') {
    const rule = toServerRule(repeat)
    return rule.type === NO_REPEAT ? [] : [rule]
  }
  return []
}

/** Normalizes one rule into the shape the backend stores. */
function toServerRule(value: unknown): ServerRepeatRule {
  if (typeof value === 'string') {
    const type = value.trim()
    return { type: type || NO_REPEAT, frecuency: 1 }
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const rule: ServerRepeatRule = {
      type: typeof obj.type === 'string' ? obj.type : NO_REPEAT,
      frecuency: typeof obj.frecuency === 'number' ? obj.frecuency : 1,
    }
    if (Array.isArray(obj.daysWeek)) rule.daysWeek = obj.daysWeek as string[]
    return rule
  }
  return { type: NO_REPEAT, frecuency: 1 }
}

/**
 * Reads the repeat rule back from a stored row.
 *
 * The value can come from the local mirror (a bare type string, or the
 * object shape) or from the server (the array written by
 * `toServerRepeat`). A single-element array is unwrapped to the object.
 */
export function parseStoredRepeat(raw: unknown): RepeatRule {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value === 'string' && value.trim()) {
    return { frecuency: 1, type: value }
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    return {
      frecuency: (obj.frecuency as number) ?? 1,
      type: (obj.type as string) ?? NO_REPEAT,
      daysWeek: Array.isArray(obj.daysWeek) ? (obj.daysWeek as string[]) : undefined,
    }
  }
  return { frecuency: 1, type: NO_REPEAT }
}
