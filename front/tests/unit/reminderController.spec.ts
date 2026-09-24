// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { addDays } from 'date-fns'

const state = vi.hoisted(() => ({
  scheduled: [] as Array<Record<string, unknown>>,
  cancelled: [] as Array<Record<string, unknown>>,
  granted: true,
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(async () => ({ display: state.granted ? 'granted' : 'denied' })),
    schedule: vi.fn(async (params: { notifications: Array<Record<string, unknown>> }) => {
      state.scheduled.push(...params.notifications)
    }),
    cancel: vi.fn(async (params: { notifications: Array<Record<string, unknown>> }) => {
      state.cancelled.push(...params.notifications)
    }),
  },
}))

import { ReminderController, NotificationPermissionError } from '@/controllers/reminderController'

function newController(): ReminderController {
  return new ReminderController()
}

function at(day: number, month: number, year: number, hour = 10, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

// Future-dated helpers so tests never rot against the past-fire skip (FR-19/FR-39).
/** A Date `daysFromNow` days in the future at the given local wall-clock time. */
function futureDate(daysFromNow: number, hour = 10, minute = 0): Date {
  const d = addDays(new Date(), daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d
}

/** A strictly-future Date falling on the target JS weekday (0=Sunday..6=Saturday). */
function futureWeekdayDate(targetWeekday: number, hour = 10): Date {
  const base = addDays(new Date(), 1) // strictly tomorrow
  base.setHours(hour, 0, 0, 0)
  const shift = (targetWeekday - base.getDay() + 7) % 7
  return addDays(base, shift)
}

/** First (monthIndex, day) in the future; year rolls forward if the date already passed. */
function futureMonthDayDate(monthIndex: number, day: number, hour = 10): Date {
  const now = new Date()
  let d = new Date(now.getFullYear(), monthIndex, day, hour, 0, 0)
  if (d.getTime() <= now.getTime()) {
    d = new Date(now.getFullYear() + 1, monthIndex, day, hour, 0, 0)
  }
  return d
}

beforeEach(() => {
  state.scheduled = []
  state.cancelled = []
  state.granted = true
})

describe('ReminderController scheduleEventReminders (FR-12, FR-15..FR-19)', () => {
  test('schedules one notification per occurrence × offset at start − offset, at_time with no subtraction (FR-5/FR-12)', async () => {
    const controller = newController()
    const start = futureDate(30) // well beyond any offset window so all fires stay future
    const end = addDays(start, 1)
    const { ids } = await controller.scheduleEventReminders({
      entityId: 7,
      title: 'Cita',
      message: 'Cita médica',
      start,
      end,
      repeat: { frecuency: 1, type: 'unique' },
      notifications: ['at_time', '5m', '1d'],
      existingIds: [],
    })
    expect(ids).toHaveLength(3)
    expect(state.scheduled).toHaveLength(3)
    const fireTimes = state.scheduled.map((n) => new Date(n.schedule.at as string).getTime())
    expect(fireTimes).toEqual([
      start.getTime(),
      new Date(start.getTime() - 5 * 60 * 1000).getTime(),
      new Date(start.getTime() - 24 * 60 * 60 * 1000).getTime(),
    ])
    expect(new Set(ids).size).toBe(3)
    for (const id of ids) {
      expect(id).toBeGreaterThan(0)
      expect(state.scheduled.some((n) => Number(n.id) === id)).toBe(true)
    }
  })

  test('weekly repeats fire only on chosen weekdays (FR-16/FR-18)', async () => {
    const controller = newController()
    const start = futureWeekdayDate(1) // a strictly-future Monday
    const end = addDays(start, 9) // Wednesday of the following week
    await controller.scheduleEventReminders({
      entityId: 1,
      title: 'Semanal',
      message: 'reunion',
      start,
      end,
      repeat: { frecuency: 1, type: 'weekly', daysWeek: ['monday', 'wednesday'] },
      notifications: ['at_time'],
      existingIds: [],
    })
    // 2 Mondays + 2 Wednesdays inside the interval = 4 occurrences
    expect(state.scheduled).toHaveLength(4)
    for (const notification of state.scheduled) {
      const fire = new Date(notification.schedule.at as string)
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][fire.getDay()]
      expect(['monday', 'wednesday']).toContain(dayName)
    }
  })

  test('weekly repeats never include unselected days in the interval', async () => {
    const controller = newController()
    const start = futureWeekdayDate(1) // a strictly-future Monday
    const end = addDays(start, 6) // Sunday of the same week
    await controller.scheduleEventReminders({
      entityId: 1,
      title: 'Solo lunes',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'weekly', daysWeek: ['monday'] },
      notifications: ['at_time'],
      existingIds: [],
    })
    expect(state.scheduled).toHaveLength(1) // only the chosen Monday fires; the 6 unselected days are excluded
    const onlyMonday = state.scheduled.every((n) => new Date(n.schedule.at as string).getDay() === 1)
    expect(onlyMonday).toBe(true)
  })

  test('daily expansion caps at 2000 occurrences (FR-17)', async () => {
    const controller = newController()
    const start = futureDate(1) // tomorrow — all occurrences stay future so the 2000 cap is observable
    const end = addDays(start, 3000)
    await controller.scheduleEventReminders({
      entityId: 1,
      title: 'Interminable',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'daily' },
      notifications: ['at_time'],
      existingIds: [],
    })
    expect(state.scheduled).toHaveLength(2000)
  })

  test('month clamping: Jan 31 − 1 month → Dec 31 (FR-40/AC-26)', async () => {
    const controller = newController()
    const start = futureMonthDayDate(0, 31, 10) // a strictly-future Jan 31
    const end = addDays(start, 1)
    const { ids } = await controller.scheduleEventReminders({
      entityId: 3,
      title: 'Fin de mes',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'unique' },
      notifications: ['1mo'],
      existingIds: [],
    })
    expect(ids).toHaveLength(1)
    const fire = new Date(state.scheduled[0].schedule.at as string)
    expect(fire.getMonth()).toBe(11) // December
    expect(fire.getDate()).toBe(31)
    expect(fire.getFullYear()).toBe(start.getFullYear() - 1) // Dec 31 of the year before Jan
  })

  test('past-target occurrences are skipped without crashing (FR-19/FR-39)', async () => {
    const controller = newController()
    const start = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const end = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const { ids } = await controller.scheduleEventReminders({
      entityId: 4,
      title: 'Mixto',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'daily' },
      notifications: ['at_time'],
      existingIds: [],
    })
    // yesterday's occurrence fire is in the past → skipped; today's fires.
    expect(state.scheduled).toHaveLength(1)
    expect(ids).toHaveLength(1)
    const fire = new Date(state.scheduled[0].schedule.at as string).getTime()
    expect(fire).toBeGreaterThan(Date.now())
  })

  test('at_time fires within the 10s lead-time window are bumped to now + 10s (MIN_LEAD_TIME_MS)', async () => {
    // Reproduces the on-device bug: an event created "right now" with at_time
    // would lose its alarm because the Capacitor Android plugin drops any
    // schedule whose `at` is `< now` by the time the native side runs.
    vi.useFakeTimers()
    // Pin the clock 5s before a minute boundary so `start = now + 5s` lands
    // exactly on the next minute — #expandOccurrences zeros seconds, so a
    // start within the same minute would slide back into the past.
    vi.setSystemTime(new Date('2026-09-24T12:00:55.000Z'))
    try {
      const controller = newController()
      const start = new Date(Date.now() + 5_000) // 12:01:00.000Z — 5s future, aligned
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const { ids } = await controller.scheduleEventReminders({
        entityId: 41,
        title: 'Ahora',
        message: 'x',
        start,
        end,
        repeat: { frecuency: 1, type: 'unique' },
        notifications: ['at_time'],
        existingIds: [],
      })
      expect(ids).toHaveLength(1)
      expect(state.scheduled).toHaveLength(1)
      const fire = new Date(state.scheduled[0].schedule.at as string).getTime()
      // Fake clock does not advance during the controller call, so the bump
      // lands exactly at Date.now() + 10s.
      expect(fire).toBe(Date.now() + 10_000)
    } finally {
      vi.useRealTimers()
    }
  })

  test('at_time fires beyond the 10s lead-time window keep their original time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-24T12:00:00.000Z'))
    try {
      const controller = newController()
      const start = new Date(Date.now() + 60_000) // 60s future, well beyond the 10s window
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      await controller.scheduleEventReminders({
        entityId: 42,
        title: 'Pronto',
        message: 'x',
        start,
        end,
        repeat: { frecuency: 1, type: 'unique' },
        notifications: ['at_time'],
        existingIds: [],
      })
      expect(state.scheduled).toHaveLength(1)
      const fire = new Date(state.scheduled[0].schedule.at as string).getTime()
      expect(fire).toBe(start.getTime())
    } finally {
      vi.useRealTimers()
    }
  })

  test('notification ids stay within Java int range so the Capacitor Android plugin accepts them', async () => {
    // Reproduces the on-device bug: Date.now() * 1000 is ~1.79e15 today,
    // which the Capacitor Java plugin rejects with "The identifier should
    // be a Java int" (max 2^31 - 1 = 2,147,483,647). The fix clamps the id.
    const JAVA_INT_MAX = 2_147_483_647
    const controller = newController()
    const start = futureDate(30)
    const end = addDays(start, 1)
    const { ids } = await controller.scheduleEventReminders({
      entityId: 43,
      title: 'Ids válidos',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'unique' },
      notifications: ['at_time'],
      existingIds: [],
    })
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true)
      expect(id).toBeGreaterThan(0)
      expect(id).toBeLessThanOrEqual(JAVA_INT_MAX)
    }
  })

  test('cancel-then-schedule: existing ids are cancelled first (FR-13)', async () => {
    const controller = newController()
    const start = futureDate(7)
    const end = addDays(start, 1)
    const { ids } = await controller.scheduleEventReminders({
      entityId: 5,
      title: 'Editar',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'unique' },
      notifications: ['at_time'],
      existingIds: [111, 222, 333],
    })
    expect(state.cancelled.map((n) => Number(n.id))).toEqual([111, 222, 333])
    expect(ids).toHaveLength(1)
    expect(ids[0]).not.toBe(111)
    expect(ids[0]).not.toBe(222)
    expect(ids[0]).not.toBe(333)
  })

  test('permission denied rejects with NotificationPermissionError before any cancel (FR-11/FR-38)', async () => {
    state.granted = false
    const controller = newController()
    const start = at(10, 8, 2026, 10, 0)
    const end = at(10, 8, 2026, 11, 0)
    await expect(
      controller.scheduleEventReminders({
        entityId: 6,
        title: 'Sin permiso',
        message: 'x',
        start,
        end,
        repeat: { frecuency: 1, type: 'unique' },
        notifications: ['at_time'],
        existingIds: [999],
      }),
    ).rejects.toBeInstanceOf(NotificationPermissionError)
    expect(state.cancelled).toHaveLength(0)
    expect(state.scheduled).toHaveLength(0)
  })

  test('empty notifications schedules nothing and clears prior ids (FR-37/AC-24)', async () => {
    const controller = newController()
    const start = at(10, 8, 2026, 10, 0)
    const end = at(10, 8, 2026, 11, 0)
    const { ids } = await controller.scheduleEventReminders({
      entityId: 8,
      title: 'Sin recordatorios',
      message: 'x',
      start,
      end,
      repeat: { frecuency: 1, type: 'unique' },
      notifications: [],
      existingIds: [42],
    })
    expect(ids).toEqual([])
    expect(state.scheduled).toHaveLength(0)
    expect(state.cancelled.map((n) => Number(n.id))).toEqual([42])
  })
})

describe('ReminderController task/note schedules (FR-20, FR-27)', () => {
  test('scheduleTaskReminders computes dueDate − offset once (no repeat, FR-20/FR-26)', async () => {
    const controller = newController()
    const dueDate = futureDate(5, 9, 30) // future due date so dueDate − 1h stays in the future
    const { ids } = await controller.scheduleTaskReminders({
      taskId: 11,
      title: 'Entrega',
      message: 'Entregar informe',
      dueDate,
      notifications: ['1h'],
      existingIds: [],
    })
    expect(ids).toHaveLength(1)
    const fire = new Date(state.scheduled[0].schedule.at as string)
    expect(fire.getTime()).toBe(dueDate.getTime() - 60 * 60 * 1000)
  })

  test('scheduleNoteReminders defaults to at_time (fires exactly at reminder date) when notifications omitted (D2/FR-27)', async () => {
    const controller = newController()
    const reminderDate = at(25, 9, 2026, 8, 0)
    const { ids } = await controller.scheduleNoteReminders({
      noteId: 12,
      title: 'Nota',
      message: 'recordatorio nota',
      reminderDate,
      existingIds: [],
    })
    expect(ids).toHaveLength(1)
    const fire = new Date(state.scheduled[0].schedule.at as string)
    expect(fire.getTime()).toBe(reminderDate.getTime())
  })

  test('scheduleNoteReminders honors an explicit offset list', async () => {
    const controller = newController()
    const reminderDate = at(25, 9, 2026, 8, 0)
    await controller.scheduleNoteReminders({
      noteId: 13,
      title: 'Nota',
      message: 'x',
      reminderDate,
      notifications: ['15m', 'at_time'],
      existingIds: [],
    })
    expect(state.scheduled).toHaveLength(2)
  })
})

describe('ReminderController cancel surface (FR-14/FR-23/FR-29, FR-10 safe no-op)', () => {
  test('cancelEventReminders/cancelTaskReminders/cancelNoteReminders cancel the given ids', async () => {
    const controller = newController()
    await controller.cancelEventReminders({ ids: [1, 2, 3] })
    await controller.cancelTaskReminders({ ids: [4, 5] })
    await controller.cancelNoteReminders({ ids: [6] })
    expect(state.cancelled.map((n) => Number(n.id))).toEqual([1, 2, 3, 4, 5, 6])
    expect(state.scheduled).toHaveLength(0)
  })

  test('cancelling ids that were never scheduled locally is a safe no-op (FR-10/FR-36/AC-7)', async () => {
    const controller = newController()
    await expect(controller.cancelEventReminders({ ids: [999999] })).resolves.toBeUndefined()
  })

  test('checkNotificationsPermissions reflects the OS permission state', async () => {
    const controller = newController()
    state.granted = true
    await expect(controller.checkNotificationsPermissions()).resolves.toBe(true)
    state.granted = false
    await expect(controller.checkNotificationsPermissions()).resolves.toBe(false)
  })
})