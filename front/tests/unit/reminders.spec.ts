// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, expect, test } from 'vitest'
import {
  REMINDER_OFFSETS,
  REMINDER_OFFSET_BY_CODE,
  LEGACY_OFFSET_CODES,
  normalizeOffsetCodes,
  offsetToDuration,
  translateReminderOffset,
} from '@/utils/reminders'

describe('REMINDER_OFFSETS (single source of truth, FR-1..FR-5)', () => {
  test('exposes exactly 11 canonical offsets in table order, at_time first', () => {
    const codes = REMINDER_OFFSETS.map((o) => o.code)
    expect(codes).toEqual([
      'at_time', '5m', '10m', '15m', '30m', '1h', '2h', '1d', '2d', '1w', '1mo',
    ])
  })

  test('at_time is first-class with amount 0 and null unit (FR-5)', () => {
    const atTime = REMINDER_OFFSET_BY_CODE['at_time']
    expect(atTime.amount).toBe(0)
    expect(atTime.unit).toBeNull()
    expect(atTime.label).toBe('En el momento exacto')
  })

  test('every offered offset has a defined machine offset and a Spanish label (FR-2/FR-4)', () => {
    for (const offset of REMINDER_OFFSETS) {
      expect(offset.label.length).toBeGreaterThan(0)
      if (offset.unit !== null) {
        expect(offset.amount).toBeGreaterThan(0)
        expect(['minute', 'hour', 'day', 'week', 'month']).toContain(offset.unit)
      }
    }
    // spot-check canonical Spanish labels with correct accents/plurals
    expect(REMINDER_OFFSET_BY_CODE['1d'].label).toBe('1 día antes')
    expect(REMINDER_OFFSET_BY_CODE['2d'].label).toBe('2 días antes')
    expect(REMINDER_OFFSET_BY_CODE['2h'].label).toBe('2 horas antes')
  })

  test('REMINDER_OFFSET_BY_CODE exposes every canonical offset', () => {
    for (const offset of REMINDER_OFFSETS) {
      expect(REMINDER_OFFSET_BY_CODE[offset.code]).toBe(offset)
    }
  })
})

describe('LEGACY_OFFSET_CODES (FR-3/FR-6 migrate-on-touch)', () => {
  test('maps every unambiguous legacy code 1:1 to canonical', () => {
    expect(LEGACY_OFFSET_CODES).toEqual({
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
  })
})

describe('normalizeOffsetCodes (FR-6, AC-1..AC-5)', () => {
  test('maps legacy codes to canonical codes and keeps at_time first-class', () => {
    expect(normalizeOffsetCodes(['just'])).toEqual(['at_time'])
    expect(normalizeOffsetCodes(['5mb', '1mtb', '1mb'])).toEqual(['5m', '1mo'])
    expect(normalizeOffsetCodes(['2hb', '1db'])).toEqual(['2h', '1d'])
  })

  test('drops unknown, empty, and dead codes silently (1smn, "", just-adjacent)', () => {
    expect(normalizeOffsetCodes(['1smn', '', 'just', 'nonsense'])).toEqual(['at_time'])
  })

  test('collapses duplicates with set semantics', () => {
    expect(normalizeOffsetCodes(['5m', '5m', '5mb', '1h', '1h'])).toEqual(['5m', '1h'])
  })

  test('reorders output to canonical table order regardless of input order', () => {
    expect(normalizeOffsetCodes(['1mo', 'at_time', '1w', '5m'])).toEqual([
      'at_time', '5m', '1w', '1mo',
    ])
    expect(normalizeOffsetCodes(['5mb', '2hb', '1mtb', 'just'])).toEqual([
      'at_time', '5m', '2h', '1mo',
    ])
  })

  test('leaves an all-canonical input untouched in table order', () => {
    expect(normalizeOffsetCodes(['10m', '30m', '2d'])).toEqual(['10m', '30m', '2d'])
  })
})

describe('offsetToDuration (machine offset for date-fns sub, FR-1/FR-5)', () => {
  test('returns the duration object for canonical machine offsets', () => {
    expect(offsetToDuration('5m')).toEqual({ minutes: 5 })
    expect(offsetToDuration('2h')).toEqual({ hours: 2 })
    expect(offsetToDuration('1w')).toEqual({ weeks: 1 })
    expect(offsetToDuration('1mo')).toEqual({ months: 1 })
  })

  test('at_time returns null (zero subtraction, FR-5)', () => {
    expect(offsetToDuration('at_time')).toBeNull()
  })

  test('unknown/dead codes return null instead of crashing (FR-6)', () => {
    expect(offsetToDuration('1smn')).toBeNull()
    expect(offsetToDuration('just')).toBeNull()
  })
})

describe('translateReminderOffset (single human-facing dictionary, FR-4)', () => {
  test('returns the canonical Spanish label for a canonical code', () => {
    expect(translateReminderOffset('at_time')).toBe('En el momento exacto')
    expect(translateReminderOffset('5m')).toBe('5 minutos antes')
    expect(translateReminderOffset('1mo')).toBe('1 mes antes')
  })

  test('returns empty string for unknown codes instead of crashing (FR-6)', () => {
    expect(translateReminderOffset('1smn')).toBe('')
    expect(translateReminderOffset('just')).toBe('')
  })
})