// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-298 - contract test for the calendar_id payload that the
 * event create/update modal feeds into EventController. The picker
 * itself is a Vue component (covered indirectly via the
 * calendarStore spec + a manual smoke test); this file pins the
 * outgoing payload shape so a future refactor of either side does
 * not silently regress what reaches the server.
 *
 * Coverage:
 *   - createEvent with calendar_id set sends it in the POST body
 *   - createEvent with calendar_id undefined omits the key entirely
 *   - updateEvent with calendar_id set sends it in the PUT body
 *   - updateEvent with calendar_id undefined omits the key entirely
 *     (preserves the server's existing value)
 *   - LBDS-292: updateEvent with calendar_id null ALSO omits the key.
 *     An event always belongs to a calendar, so "clear the calendar"
 *     is not a state the client may ask for.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

const testDbName = 'LifeLineDB-event-calendar-id-tests'
const testDb = new Dexie(testDbName)
testDb.version(3).stores({
  events: '++id, user_id, title',
  users: '++id, email',
  usersLogged: '++id, user',
  tokens: '++id, user_id, name',
  config: 'name',
  tasks: '++id, user_id, title, status, due_date',
  documents: '++id, user_id, title, type',
  notes: '++id, user_id, document_id, title',
  outbox: '++id, entityType, entityId, status, nextRetryAt, createdAt',
})

vi.mock('@/db', () => ({
  get db(): typeof testDb {
    return testDb
  },
}))

const onlineState: { value: boolean } = { value: true }

vi.mock('@/composables/useOnlineStatus', () => ({
  getIsOnline: (): boolean => onlineState.value,
  useOnlineStatus: (): { isOnline: { value: boolean } } => ({
    isOnline: { value: true },
  }),
}))

const apiCalls: Array<{ method: string; url: string; data?: unknown }> = []

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery(): Promise<unknown> {
      return []
    },
    async executeMutation({ url, data, method }: { url: string; data?: unknown; method: 'POST' | 'PUT' }): Promise<unknown> {
      apiCalls.push({ method, url, data })
      // Mirror the server contract: POST returns an id + row; PUT echoes
      // the patch with the canonical fields.
      if (method === 'POST') {
        return { id: 500, ...(data as Record<string, unknown>) }
      }
      return data
    },
    async executeDelete(): Promise<unknown> {
      return null
    },
  },
}))

const { EventController } = await import('@/controllers/eventController')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('outbox').clear(),
  ])
  apiCalls.length = 0
  onlineState.value = true
  setActivePinia(createPinia())
})

afterEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('outbox').clear(),
  ])
})

describe('EventController.createEvent - calendar_id payload (LBDS-298)', () => {
  it('includes calendar_id in the POST body when the picker chose a calendar', async () => {
    const controller = new EventController()
    await controller.createEvent({
      name: 'Con calendario',
      dateStart: '2026-10-15T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      calendar_id: 42,
    })
    await controller.flushQueue()

    const post = apiCalls.find((c) => c.method === 'POST' && c.url === '/events')
    expect(post).toBeDefined()
    expect(post?.data).toMatchObject({ calendar_id: 42 })
  })

  it('omits calendar_id from the POST body when the user has zero calendars', async () => {
    const controller = new EventController()
    await controller.createEvent({
      name: 'Sin calendario',
      dateStart: '2026-10-15T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      // The picker is hidden for 0-calendar users, so the modal
      // passes `undefined` here. The JSON payload must NOT carry
      // the key - LBDS-292 auto-provisions the row server-side.
      calendar_id: undefined,
    })
    await controller.flushQueue()

    const post = apiCalls.find((c) => c.method === 'POST' && c.url === '/events')
    expect(post).toBeDefined()
    // The controller's record carries `calendar_id: undefined` so
    // `hasOwnProperty` returns true, but `JSON.stringify` (what the
    // apiClient actually puts on the wire) drops the key. We assert
    // the wire shape, not the JS object shape, because that is the
    // contract the server sees.
    const wire = JSON.stringify(post?.data ?? {})
    expect(wire).not.toContain('"calendar_id"')
  })
})

describe('EventController.createEvent - optimistic record shape (GitLab #3)', () => {
  const OPTIONAL_KEYS = [
    'calendar_id',
    'date_end',
    'dateEnd',
    'notifications',
    'repeat',
    'guests',
    'description',
    'id_reminders',
  ]

  // A key that is present with an `undefined` value is the bug: the row
  // claims the field exists and carries no value.
  function carriesUndefined(row: Record<string, unknown>, key: string): boolean {
    return (
      Object.prototype.hasOwnProperty.call(row, key) && row[key] === undefined
    )
  }

  it('does not store an undefined calendar_id in the optimistic row', async () => {
    // Offline: the optimistic row is written locally and the mutation
    // waits in the outbox, so the row under test is the optimistic one.
    onlineState.value = false
    const controller = new EventController()
    await controller.createEvent({
      name: 'Sin calendario',
      dateStart: '2026-10-15T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      calendar_id: undefined,
    })

    const rows = await testDb.table('events').toArray()
    expect(rows.length).toBe(1)
    const row = rows[0] as Record<string, unknown>
    // The wire was already correct (`JSON.stringify` drops `undefined`),
    // but the local mirror row kept the key with an `undefined` value,
    // which breaks the `ServerEventDto` contract.
    expect(carriesUndefined(row, 'calendar_id')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(row, 'calendar_id')).toBe(false)
  })

  it('does not store undefined optional fields in the optimistic row', async () => {
    onlineState.value = false
    const controller = new EventController()
    await controller.createEvent({
      name: 'Sin opcionales',
      dateStart: '2026-10-15T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
    })

    const rows = await testDb.table('events').toArray()
    expect(rows.length).toBe(1)
    const row = rows[0] as Record<string, unknown>
    for (const key of OPTIONAL_KEYS) {
      expect(carriesUndefined(row, key)).toBe(false)
    }
  })

  it('does not store an undefined calendar_id after the server round-trip', async () => {
    const controller = new EventController()
    await controller.createEvent({
      name: 'Sin calendario',
      dateStart: '2026-10-15T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      calendar_id: undefined,
    })
    await controller.flushQueue()

    const rows = await testDb.table('events').toArray()
    expect(rows.length).toBe(1)
    const row = rows[0] as Record<string, unknown>
    for (const key of OPTIONAL_KEYS) {
      expect(carriesUndefined(row, key)).toBe(false)
    }
  })

  it('keeps the calendar_id in the local row when the picker chose one', async () => {
    const controller = new EventController()
    await controller.createEvent({
      name: 'Con calendario',
      dateStart: '2026-10-15T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      calendar_id: 42,
    })
    await controller.flushQueue()

    const rows = await testDb.table('events').toArray()
    expect(rows.length).toBe(1)
    const row = rows[0] as Record<string, unknown>
    expect(row.calendar_id).toBe(42)
  })
})

describe('EventController.updateEvent - calendar_id payload (LBDS-298)', () => {
  it('includes calendar_id in the PUT body when the picker switched calendars', async () => {
    const controller = new EventController()
    await controller.updateEvent({
      id: 7,
      name: 'Cambio de calendario',
      dateStart: '2026-10-16T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      calendar_id: 99,
    })
    await controller.flushQueue()

    const put = apiCalls.find((c) => c.method === 'PUT' && c.url === '/events/7')
    expect(put).toBeDefined()
    const wire = JSON.stringify(put?.data ?? {})
    expect(wire).toContain('"calendar_id":99')
  })

  it('omits calendar_id from the PUT body when the picker did not move (no-op)', async () => {
    const controller = new EventController()
    await controller.updateEvent({
      id: 7,
      name: 'Cambio de nombre',
      dateStart: '2026-10-16T10:00:00Z',
      timeZone: 'UTC',
      availability: 'available',
      // The modal only forwards a `calendar_id` when the user
      // touches the picker; otherwise the row's existing
      // `calendar_id` stays on the server.
      calendar_id: undefined,
    })
    await controller.flushQueue()

    const put = apiCalls.find((c) => c.method === 'PUT' && c.url === '/events/7')
    expect(put).toBeDefined()
    const wire = JSON.stringify(put?.data ?? {})
    expect(wire).not.toContain('"calendar_id"')
  })

  it('omits calendar_id from the PUT body when the caller passes null (LBDS-292)', async () => {
    const controller = new EventController()
    await controller.updateEvent({
      id: 7,
      calendar_id: null,
    })
    await controller.flushQueue()

    const put = apiCalls.find((c) => c.method === 'PUT' && c.url === '/events/7')
    expect(put).toBeDefined()
    const wire = JSON.stringify(put?.data ?? {})
    // The client never asks the server to clear the calendar: the key is
    // omitted and the row keeps the calendar it already has.
    expect(wire).not.toContain('"calendar_id"')
  })
})