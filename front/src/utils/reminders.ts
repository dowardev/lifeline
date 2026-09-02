// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

// Single source of truth for reminder offsets (design D1, FR-1..FR-6).
// This is the ONLY offset vocabulary used by the UI option lists and the
// scheduling math. Backend mirror: app/Support/ReminderOffsets.php.

import type { Duration } from 'date-fns'
import type { ReminderOffsetType } from '@/utils/interfaces'

export type ReminderUnit = 'minute' | 'hour' | 'day' | 'week' | 'month'

export interface ReminderOffset {
  code: string
  amount: number
  unit: ReminderUnit | null
  label: string
}

/** Canonical offsets in table order (design D1). */
export const REMINDER_OFFSETS: ReminderOffset[] = [
  { code: 'at_time', amount: 0, unit: null, label: 'En el momento exacto' },
  { code: '5m', amount: 5, unit: 'minute', label: '5 minutos antes' },
  { code: '10m', amount: 10, unit: 'minute', label: '10 minutos antes' },
  { code: '15m', amount: 15, unit: 'minute', label: '15 minutos antes' },
  { code: '30m', amount: 30, unit: 'minute', label: '30 minutos antes' },
  { code: '1h', amount: 1, unit: 'hour', label: '1 hora antes' },
  { code: '2h', amount: 2, unit: 'hour', label: '2 horas antes' },
  { code: '1d', amount: 1, unit: 'day', label: '1 día antes' },
  { code: '2d', amount: 2, unit: 'day', label: '2 días antes' },
  { code: '1w', amount: 1, unit: 'week', label: '1 semana antes' },
  { code: '1mo', amount: 1, unit: 'month', label: '1 mes antes' },
]

/** Canonical code → offset lookup. */
export const REMINDER_OFFSET_BY_CODE: Readonly<Record<string, ReminderOffset>> = Object.freeze(
  Object.fromEntries(REMINDER_OFFSETS.map((offset) => [offset.code, offset])),
)

/** Canonical order index used by normalizeOffsetCodes. */
const CANONICAL_ORDER: ReadonlyMap<string, number> = new Map(
  REMINDER_OFFSETS.map((offset, index) => [offset.code, index]),
)

/**
 * Legacy UI codes → canonical codes (migrate-on-touch, design D1).
 * Unambiguous 1:1 mapping (same amount + unit). `1mb` was a controller-only
 * dead code in the legacy ReminderController mapped to months.
 */
export const LEGACY_OFFSET_CODES: Readonly<Record<string, string>> = Object.freeze({
  just: 'at_time',
  '5mb': '5m',
  '10mb': '10m',
  '15mb': '15m',
  '30mb': '30m',
  '1hb': '1h',
  '2hb': '2h',
  '1db': '1d',
  '2db': '2d',
  '1wb': '1w',
  '1mtb': '1mo',
  '1mb': '1mo',
})

/**
 * Normalize an arbitrary code set to canonical codes (FR-6):
 * - legacy codes are migrated to their canonical counterpart;
 * - unknown/empty/dead codes are silently excluded (client-side);
 * - duplicates are collapsed (set semantics);
 * - output is reordered to canonical table order.
 * NEVER throws, NEVER returns a code that could fire at an unintended offset.
 */
export function normalizeOffsetCodes(codes: string[]): ReminderOffsetType[] {
  const seen = new Set<string>()
  const result: ReminderOffsetType[] = []
  for (const raw of codes ?? []) {
    if (typeof raw !== 'string') continue
    const code = raw.trim()
    if (!code) continue
    const canonical: ReminderOffsetType =
      (LEGACY_OFFSET_CODES[code] as ReminderOffsetType | undefined) ??
      (code as ReminderOffsetType)
    if (!CANONICAL_ORDER.has(canonical)) continue
    if (seen.has(canonical)) continue
    seen.add(canonical)
    result.push(canonical)
  }
  return result.sort((a, b) => CANONICAL_ORDER.get(a)! - CANONICAL_ORDER.get(b)!)
}

/** Singular ReminderUnit → plural date-fns Duration key. */
const DURATION_KEY_BY_UNIT: Readonly<Record<ReminderUnit, keyof Duration>> = {
  minute: 'minutes',
  hour: 'hours',
  day: 'days',
  week: 'weeks',
  month: 'months',
}

/**
 * Machine offset for a canonical code, as a date-fns Duration for `sub()`.
 * `at_time` (the zero offset) returns null → no subtraction (FR-5).
 * Unknown/dead codes return null instead of crashing (FR-6).
 */
export function offsetToDuration(code: string): Duration | null {
  const offset = REMINDER_OFFSET_BY_CODE[code]
  if (!offset || offset.unit === null) return null
  return { [DURATION_KEY_BY_UNIT[offset.unit]]: offset.amount } as Duration
}

/** Human-facing Spanish label for a canonical code; '' for unknown (FR-4/FR-6). */
export function translateReminderOffset(code: string): string {
  const offset = REMINDER_OFFSET_BY_CODE[code]
  return offset ? offset.label : ''
}