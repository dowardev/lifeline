// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { addSeconds } from 'date-fns'

/**
 * Faithful `LocalNotifications` mock.
 *
 * The platform round-trip is the important part (F1/F3): `extra` only survives
 * as an **object**. Android reads it back through `JSObject.getJSObject` (keys
 * only a JSONObject survive; a string becomes `null`) and iOS does
 * `as? JSObject ?? [:]` (a string becomes `{}`). So `schedule` stores the
 * notification with a non-object `extra` converted to `null`. A regression back
 * to a string marker therefore makes the reconciliation tests fail, which is
 * exactly what the field bug was.
 *
 * `schedule` also mirrors the web behaviour of pushing each notification into
 * the pending list WITHOUT deduping by id, so a careless re-schedule would
 * accumulate duplicates.
 */
const state = vi.hoisted(() => ({
  scheduled: [] as Array<Record<string, unknown>>,
  cancelled: [] as Array<Record<string, unknown>>,
  pending: [] as Array<Record<string, unknown>>,
  granted: true,
  scheduleCalls: 0,
  scheduleSizes: [] as number[],
  requestPermissionCalls: 0,
  checkPermissionCalls: 0,
  failSchedule: false,
  apiEvents: [] as Array<Record<string, unknown>>,
  apiTasks: [] as Array<Record<string, unknown>>,
}))

/** Model the native `extra` round-trip: anything but an object becomes null. */
function platformExtra(extra: unknown): unknown {
  return typeof extra === 'object' && extra !== null ? extra : null
}

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(async () => {
      state.requestPermissionCalls += 1
      return { display: state.granted ? 'granted' : 'denied' }
    }),
    checkPermissions: vi.fn(async () => {
      state.checkPermissionCalls += 1
      return { display: state.granted ? 'granted' : 'denied' }
    }),
    schedule: vi.fn(async (params: { notifications: Array<Record<string, unknown>> }) => {
      state.scheduleCalls += 1
      state.scheduleSizes.push(params.notifications.length)
      if (state.failSchedule) throw new Error('schedule boom')
      for (const notification of params.notifications) {
        const stored = { ...notification, extra: platformExtra(notification.extra) }
        state.scheduled.push(stored)
        // Web (and the native pending list) keeps duplicates; only `cancel`
        // removes a stored id.
        state.pending.push(stored)
      }
    }),
    cancel: vi.fn(async (params: { notifications: Array<Record<string, unknown>> }) => {
      state.cancelled.push(...params.notifications)
      const ids = new Set(params.notifications.map((n) => Number(n.id)))
      state.pending = state.pending.filter((n) => !ids.has(Number(n.id)))
    }),
    getPending: vi.fn(async () => ({ notifications: state.pending })),
  },
}))

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    executeQuery: vi.fn(async (params: { url: string }) => {
      if (params.url === '/external-events') return { events: state.apiEvents }
      if (params.url === '/external-tasks') return { tasks: state.apiTasks }
      return {}
    }),
  },
}))

import { ReminderController } from '@/controllers/reminderController'
import { externalTaskService } from '@/services/externalTaskService'
import { scheduleExternalReminders } from '@/composables/useExternalSync'

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
  state.scheduleSizes = []
  state.requestPermissionCalls = 0
  state.checkPermissionCalls = 0
  state.failSchedule = false
  state.apiEvents = []
  state.apiTasks = []
})

describe('ReminderController.syncExternalReminders (LBDS-268)', () => {
  test('schedules one notification per offset at start − offsetSeconds, in a single call', async () => {
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
    // F4: every notification that needs scheduling goes in ONE schedule call.
    expect(state.scheduleCalls).toBe(1)
    expect(state.scheduleSizes).toEqual([2])
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

  // F4 + F5: delta-only sync, one batch call.
  test('two identical consecutive runs: the second schedules nothing (delta only)', async () => {
    const controller = newController()
    const items = [
      {
        key: 'ext-delta',
        title: 'Estable',
        message: 'x',
        start: futureDate(3600),
        offsetsSeconds: [600, 300, 60],
      },
    ]

    await controller.syncExternalReminders({ items })
    expect(state.scheduleCalls).toBe(1)
    expect(state.scheduleSizes).toEqual([3])

    // Second identical run: pending content matches, so nothing is cancelled or
    // re-scheduled.
    await controller.syncExternalReminders({ items })
    expect(state.scheduleCalls).toBe(1)
    expect(state.cancelled).toHaveLength(0)
  })

  // F4: changed fire time on the same id is replaced.
  test('a changed fire time (same id, different at) is cancelled and re-scheduled', async () => {
    const controller = newController()
    const key = 'ext-retime'
    const firstStart = futureDate(3600)
    await controller.syncExternalReminders({
      items: [{ key, title: 'Mueve', message: 'x', start: firstStart, offsetsSeconds: [60] }],
    })
    const id = scheduledIds()[0]
    expect(state.pending.map((n) => Number(n.id))).toEqual([id])

    const secondStart = futureDate(7200)
    await controller.syncExternalReminders({
      items: [{ key, title: 'Mueve', message: 'x', start: secondStart, offsetsSeconds: [60] }],
    })

    expect(state.cancelled.map((n) => Number(n.id))).toContain(id)
    expect(state.scheduleCalls).toBe(2)
    const pendingTimes = state.pending.map((n) =>
      new Date((n.schedule as { at: Date }).at).getTime(),
    )
    expect(pendingTimes).toEqual([secondStart.getTime() - 60 * 1000])
  })

  // F1 + F3: the object marker survives the native round-trip and reconciliation works.
  test('an object marker survives the round-trip and its notification is cancelled when it disappears', async () => {
    const controller = newController()
    const start = futureDate(3600)
    await controller.syncExternalReminders({
      items: [{ key: 'ext-1', title: 'Viejo', message: 'x', start, offsetsSeconds: [60] }],
    })

    const stored = state.pending[0]
    expect(typeof stored.extra).toBe('object')
    expect(stored.extra).toEqual({ ext: 'ext-1' })
    const oldId = Number(stored.id)

    await controller.syncExternalReminders({
      items: [{ key: 'ext-2', title: 'Nuevo', message: 'x', start, offsetsSeconds: [60] }],
    })

    expect(state.cancelled.map((n) => Number(n.id))).toContain(oldId)
  })

  // F1/F3 guard: a string marker (local entity or a legacy broken payload) is NOT external.
  test('a string marker is never treated as external and is never cancelled', async () => {
    const controller = newController()
    state.pending = [
      { id: 999, extra: 'ext:ext-999', title: 'Marcador viejo', body: 'y' },
    ]
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-2',
          title: 'Externo',
          message: 'x',
          start: futureDate(3600),
          offsetsSeconds: [60],
        },
      ],
    })
    expect(state.cancelled.map((n) => Number(n.id))).not.toContain(999)
  })

  // F5: an id that shifts because the input set changed must not duplicate.
  test('a shifted id does not produce a duplicate', async () => {
    const controller = newController()
    const start = futureDate(3600)
    // `k261234` sorts before `k32728` and both hash to the same base id, so
    // adding the first in the second run pushes the second to the next id.
    await controller.syncExternalReminders({
      items: [{ key: 'k32728', title: 'Viejo', message: 'x', start, offsetsSeconds: [60] }],
    })
    expect(state.pending.map((n) => Number(n.id))).toEqual([258974784])

    await controller.syncExternalReminders({
      items: [
        { key: 'k261234', title: 'Nuevo A', message: 'x', start, offsetsSeconds: [60] },
        { key: 'k32728', title: 'Nuevo B', message: 'x', start, offsetsSeconds: [60] },
      ],
    })

    const ids = state.pending.map((n) => Number(n.id))
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    expect(ids.sort((a, b) => a - b)).toEqual([258974784, 258974785])
  })

  // F6: never overwrite an unrelated local notification that occupies the id.
  test('a pending non-external notification occupying a desired id is never overwritten', async () => {
    const controller = newController()
    const localId = 1890508615 // fnv1a31('ext-1|300') — the desired base id
    state.pending = [
      {
        id: localId,
        extra: '1',
        title: 'Evento local',
        body: 'x',
        schedule: { at: futureDate(3600) },
      },
    ]

    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-1',
          title: 'Externo',
          message: 'x',
          start: futureDate(7200),
          offsetsSeconds: [300],
        },
      ],
    })

    expect(state.cancelled.map((n) => Number(n.id))).not.toContain(localId)
    expect(scheduledIds()).toEqual([localId + 1])
    const localPending = state.pending.find((n) => Number(n.id) === localId)
    expect(localPending?.title).toBe('Evento local')
  })

  // F2: silent permission only, and only when something is actually scheduled.
  test('the sync path checks permission silently and never requests it', async () => {
    const controller = newController()
    await controller.syncExternalReminders({
      items: [
        {
          key: 'ext-11',
          title: 'Permiso',
          message: 'x',
          start: futureDate(3600),
          offsetsSeconds: [60],
        },
      ],
    })
    expect(state.checkPermissionCalls).toBe(1)
    expect(state.requestPermissionCalls).toBe(0)
  })

  test('with nothing to schedule, no permission call happens at all', async () => {
    const controller = newController()
    await controller.syncExternalReminders({ items: [] })
    expect(state.checkPermissionCalls).toBe(0)
    expect(state.requestPermissionCalls).toBe(0)
    expect(state.scheduled).toHaveLength(0)
  })

  test('permission denied schedules nothing and does not throw', async () => {
    state.granted = false
    const controller = newController()
    await expect(
      controller.syncExternalReminders({
        items: [
          {
            key: 'ext-12',
            title: 'Sin permiso',
            message: 'x',
            start: futureDate(3600),
            offsetsSeconds: [60],
          },
        ],
      }),
    ).resolves.toBeUndefined()
    expect(state.scheduled).toHaveLength(0)
    expect(state.requestPermissionCalls).toBe(0)
  })

  test('a schedule rejection does not reject the sync', async () => {
    state.failSchedule = true
    const controller = newController()
    await expect(
      controller.syncExternalReminders({
        items: [
          {
            key: 'ext-13',
            title: 'Falla',
            message: 'x',
            start: futureDate(3600),
            offsetsSeconds: [60],
          },
        ],
      }),
    ).resolves.toBeUndefined()
    expect(state.scheduled).toHaveLength(0)
  })
})

describe('external task reminders (F7)', () => {
  test('listExternalTasks maps due_at and the ext-task key namespace', async () => {
    const due = futureDate(3600)
    state.apiTasks = [
      {
        id: 5,
        title: 'Entrega',
        status: 'NEEDS-ACTION',
        due_at: due.toISOString(),
        description: 'Informe',
        source_name: 'Google Tasks',
        reminder_offsets_seconds: [600, 60],
      },
    ]

    const tasks = await externalTaskService.listExternalTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].key).toBe('ext-task-5')
    expect(tasks[0].due_at).toBe(due.toISOString())
    expect(tasks[0].reminderOffsetsSeconds).toEqual([600, 60])
  })

  test('external tasks are scheduled from due_at and do not collide with an event of the same id', async () => {
    const eventStart = futureDate(3600)
    const taskDue = futureDate(7200)
    state.apiEvents = [
      {
        id: 5,
        title: 'Evento',
        date_start: eventStart.toISOString(),
        reminder_offsets_seconds: [60],
      },
    ]
    state.apiTasks = [
      {
        id: 5,
        title: 'Tarea',
        due_at: taskDue.toISOString(),
        reminder_offsets_seconds: [60],
      },
    ]

    await scheduleExternalReminders()

    expect(state.scheduled).toHaveLength(2)
    const eventNotification = state.scheduled.find(
      (n) => (n.extra as { ext?: string }).ext === 'ext-5',
    )
    const taskNotification = state.scheduled.find(
      (n) => (n.extra as { ext?: string }).ext === 'ext-task-5',
    )
    expect(eventNotification).toBeTruthy()
    expect(taskNotification).toBeTruthy()
    expect(new Date((eventNotification!.schedule as { at: Date }).at).getTime()).toBe(
      eventStart.getTime() - 60 * 1000,
    )
    expect(new Date((taskNotification!.schedule as { at: Date }).at).getTime()).toBe(
      taskDue.getTime() - 60 * 1000,
    )
    expect(Number(eventNotification!.id)).not.toBe(Number(taskNotification!.id))
  })
})
