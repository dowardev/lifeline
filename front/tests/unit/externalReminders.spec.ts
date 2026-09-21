// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { addSeconds } from 'date-fns'

/**
 * Shares the mocking pattern of reminderController.spec.ts (a `vi.hoisted`
 * state object), extended with `getPending` so reconciliation can be exercised.
 */
const state = vi.hoisted(() => ({
  scheduled: [] as Array<Record<string, unknown>>,
  cancelled: [] as Array<Record<string, unknown>>,
  pending: [] as Array<Record<string, unknown>>,
  granted: true,
  scheduleCalls: 0,
  failOnCall: 0,
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(async () => ({ display: state.granted ? 'granted' : 'denied' })),
    schedule: vi.fn(async (params: { notifications: Array<Record<string, unknown>> }) => {
      state.scheduleCalls += 1
      if (state.failOnCall === state.scheduleCalls) {
        throw new Error('schedule boom')
      }
      state.scheduled.push(...params.notifications)
    }),
    cancel: vi.fn(async (params: { notifications: Array<Record<string, unknown>> }) => {
      state.cancelled.push(...params.notifications)
    }),
    getPending: vi.fn(async () => ({ notifications: state.pending })),
  },
}))

import { ReminderController } from '@/controllers/reminderController'

function newController(): ReminderController {
  return new ReminderController()
}

/** A Date `secondsFromNow` seconds in the future. */
function futureDate(secondsFromNow: number): Date {
  return addSeconds(new Date(), secondsFromNow)
}

function scheduledIds(): number[] {
  return state.scheduled.map((n) => Number(n.id))
}

function scheduledTimes(): number[] {
  return state.scheduled.map((n) => new Date(n.schedule.at as string).getTime())
}

beforeEach(() => {
  state.scheduled = []
  state.cancelled = []
  state.pending = []
  state.granted = true
  state.scheduleCalls = 0
  state.failOnCall = 0
})

describe('ReminderController.syncExternalReminders (LBDS-268)', () => {
  test('schedules one notification per offset at start − offsetSeconds, with title and body', async () => {
    const controller = newController()
    const start = futureDate(3600)
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-1',
          title: 'Reunión',
          message: 'Sala 3',
          start,
          offsetsSeconds: [300, 60],
        },
      ],
    })

    expect(state.scheduled).toHaveLength(2)
    // Canonical order: larger offset (earlier fire) first.
    expect(scheduledTimes()).toEqual([
      start.getTime() - 300 * 1000,
      start.getTime() - 60 * 1000,
    ])
    for (const notification of state.scheduled) {
      expect(notification.title).toBe('Reunión')
      expect(notification.body).toBe('Sala 3')
    }
  })

  test('falls back to the title as body when the message is empty', async () => {
    const controller = newController()
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-2',
          title: 'Solo título',
          message: '',
          start: futureDate(3600),
          offsetsSeconds: [60],
        },
      ],
    })
    expect(state.scheduled).toHaveLength(1)
    expect(state.scheduled[0].body).toBe('Solo título')
  })

  test('skips offsets whose fire time is already in the past', async () => {
    const controller = newController()
    // start is 100s away: the 1000s offset lands ~15min in the past, 60s stays future.
    const start = futureDate(100)
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-3',
          title: 'Parcial',
          message: 'x',
          start,
          offsetsSeconds: [1000, 60],
        },
      ],
    })
    expect(state.scheduled).toHaveLength(1)
    expect(scheduledTimes()[0]).toBe(start.getTime() - 60 * 1000)
  })

  test('ids are stable across two identical runs (replace, not duplicate)', async () => {
    const controller = newController()
    const items = [
      {
        key: 'ext-4',
        title: 'Estable',
        message: 'x',
        start: futureDate(3600),
        offsetsSeconds: [600, 300, 60],
      },
    ]

    await controller.syncExternalReminders({ items })
    const firstIds = scheduledIds()
    expect(firstIds).toHaveLength(3)

    state.scheduled = []
    await controller.syncExternalReminders({ items })
    expect(scheduledIds()).toEqual(firstIds)
  })

  test('an empty or absent offsets list schedules nothing for that item', async () => {
    const controller = newController()
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-5',
          title: 'Sin recordatorios',
          message: 'x',
          start: futureDate(3600),
          offsetsSeconds: [],
        },
        {
          key: 'ext-6',
          title: 'Ausente',
          message: 'x',
          start: futureDate(3600),
          offsetsSeconds: undefined as unknown as number[],
        },
      ],
    })
    expect(state.scheduled).toHaveLength(0)
  })

  test('cancels pending ext: notifications whose key is no longer desired', async () => {
    const controller = newController()
    const start = futureDate(3600)
    // First run schedules ext-7; then it disappears from the desired set.
    await controller.syncExternalReminders({
      items: [
        { key: 'ext-7', title: 'Viejo', message: 'x', start, offsetsSeconds: [60] },
      ],
    })
    const oldId = scheduledIds()[0]

    state.scheduled = []
    state.pending = [
      { id: oldId, extra: 'ext:ext-7', title: 'Viejo', body: 'x' },
      { id: 555, extra: 'ext:ext-999', title: 'Otra', body: 'y' },
    ]
    await controller.syncExternalReminders({
      items: [
        { key: 'ext-8', title: 'Nuevo', message: 'x', start, offsetsSeconds: [60] },
      ],
    })

    expect(state.cancelled.map((n) => Number(n.id)).sort()).toEqual([555, oldId].sort())
  })

  test('keeps pending ext: notifications whose desired id is still scheduled', async () => {
    const controller = newController()
    const start = futureDate(3600)
    await controller.syncExternalReminders({
      items: [
        { key: 'ext-9', title: 'Vigente', message: 'x', start, offsetsSeconds: [60] },
      ],
    })
    const stableId = scheduledIds()[0]

    state.scheduled = []
    state.pending = [{ id: stableId, extra: 'ext:ext-9', title: 'Vigente', body: 'x' }]
    await controller.syncExternalReminders({
      items: [
        { key: 'ext-9', title: 'Vigente', message: 'x', start, offsetsSeconds: [60] },
      ],
    })

    expect(state.cancelled).toHaveLength(0)
    expect(scheduledIds()).toEqual([stableId])
  })

  test('never cancels pending notifications that are not marked ext:', async () => {
    const controller = newController()
    state.pending = [
      { id: 42, extra: '42', title: 'Evento local', body: 'x' },
      { id: 43, extra: 'tarea-1', title: 'Tarea local', body: 'y' },
      { id: 44, title: 'Sin extra', body: 'z' },
    ]
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-10',
          title: 'Externo',
          message: 'x',
          start: futureDate(3600),
          offsetsSeconds: [60],
        },
      ],
    })
    expect(state.cancelled).toHaveLength(0)
  })

  test('permission denied schedules nothing and does not throw', async () => {
    state.granted = false
    const controller = newController()
    await expect(
      controller.syncExternalReminders({
        items: [
          {
            key: 'ext-11',
            title: 'Sin permiso',
            message: 'x',
            start: futureDate(3600),
            offsetsSeconds: [60],
          },
        ],
      }),
    ).resolves.toBeUndefined()
    expect(state.scheduled).toHaveLength(0)
  })

  test('a schedule rejection does not reject and does not stop remaining items', async () => {
    const controller = newController()
    const start = futureDate(3600)
    // Canonical order is by key, so the first schedule call (ext-a) fails and
    // the second (ext-b) must still run.
    state.failOnCall = 1
    await expect(
      controller.syncExternalReminders({
        items: [
          { key: 'ext-a', title: 'Fallida', message: 'x', start, offsetsSeconds: [60] },
          { key: 'ext-b', title: 'Sobrevive', message: 'x', start, offsetsSeconds: [60] },
        ],
      }),
    ).resolves.toBeUndefined()
    expect(state.scheduled).toHaveLength(1)
    expect(state.scheduled[0].title).toBe('Sobrevive')
  })
})
