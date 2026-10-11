// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-event-repo-tests'
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
  useOnlineStatus: (): { isOnline: { value: boolean } } => ({ isOnline: { value: true } }),
}))

const apiCalls: Array<{ method: string; url: string; data?: unknown }> = []

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'GET', url })
      return { events: serverRows }
    },
    async executeMutation({ url, data, method }: { url: string; data?: unknown; method: 'POST' | 'PUT' }): Promise<unknown> {
      apiCalls.push({ method, url, data })
      // Pretend the server assigns a stable id for the create and echoes
      // the payload for updates.
      if (method === 'POST') {
        nextServerId++
        return { id: nextServerId, title: (data as { title?: string })?.title ?? 'X', user_id: 7, calendar_id: 1 }
      }
      return data
    },
    async executeDelete({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'DELETE', url })
      return null
    },
  },
}))

const serverRows: Array<{ id: number; user_id: number; title: string; calendar_id: number }> = []
let nextServerId = 100

// --- Subject under test --------------------------------------------------

const { EventController } = await import('@/controllers/eventController')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('outbox').clear(),
  ])
  apiCalls.length = 0
  serverRows.length = 0
  nextServerId = 100
  onlineState.value = true
  setActivePinia(createPinia())
})

afterEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('outbox').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('EventController LBDS-231 acceptance (offline-first)', () => {
  it('loadEvents mirrors server rows into Dexie + Pinia', async () => {
    serverRows.push(
      { id: 1, user_id: 7, title: 'A', calendar_id: 1 },
      { id: 2, user_id: 7, title: 'B', calendar_id: 1 },
    )

    const controller = new EventController()
    await controller.loadEvents()

    const stored = await testDb.table('events').toArray()
    expect(stored.map((r) => r.title).sort()).toEqual(['A', 'B'])
    expect(controller.getEvents().map((e) => e.title).sort()).toEqual(['A', 'B'])
    expect(apiCalls).toEqual([{ method: 'GET', url: '/events', data: undefined }])
  })

  it('loadEvents falls back to Dexie when the server is unreachable', async () => {
    onlineState.value = false
    await testDb.table('events').bulkPut([
      { id: 9, user_id: 7, title: 'cached', calendar_id: 1 },
    ])

    const controller = new EventController()
    await controller.loadEvents()

    expect(apiCalls).toEqual([])
    expect(controller.getEvents().map((e) => e.title)).toEqual(['cached'])
  })

  it('createEvent enqueues + optimistically adds even when offline', async () => {
    onlineState.value = false
    const controller = new EventController()

    const { id } = await controller.createEvent({
      name: 'Offline event',
      dateStart: '2026-10-01T10:00:00Z',
      calendar_id: 1,
    })

    expect(typeof id).toBe('string')
    expect((id as string).startsWith('tmp-')).toBe(true)
    expect(apiCalls).toEqual([]) // no network call yet

    const optimistic = await testDb.table('events').get(id as string)
    expect(optimistic?.title).toBe('Offline event')
    expect(controller.getEvents().find((e) => e.id === id)?.title).toBe('Offline event')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'events',
      op: 'create',
      url: '/events',
      method: 'POST',
      status: 'pending',
    })
    expect(queued[0].entityId).toBe(id)
  })

  it('flushQueue reconciles the tempId to the server id and drops the outbox row', async () => {
    const controller = new EventController()
    controller.useSync()

    const { id: tempId } = await controller.createEvent({
      name: 'Reconcile me',
      dateStart: '2026-10-02T10:00:00Z',
      calendar_id: 1,
    })

    // The reconciler should not have run yet (no flush).
    expect(apiCalls).toEqual([])
    expect(await testDb.table('outbox').count()).toBe(1)

    await controller.flushQueue()

    const serverId = 101 // matches the mock's nextServerId after increment
    const apiPost = apiCalls.find((c) => c.method === 'POST' && c.url === '/events')
    expect(apiPost).toBeDefined()
    expect(await testDb.table('outbox').count()).toBe(0)
    // The tempId row is gone; the serverId row carries the canonical fields.
    expect(await testDb.table('events').get(tempId as string)).toBeUndefined()
    const canonical = await testDb.table('events').get(serverId)
    expect(canonical?.title).toBe('Reconcile me')
    // Pinia swapped the tempId for the canonical id.
    expect(controller.getEvents().find((e) => e.id === tempId)).toBeUndefined()
    expect(controller.getEvents().find((e) => e.id === serverId)?.title).toBe('Reconcile me')
  })

  it('updateEvent + flushQueue replays the PUT', async () => {
    serverRows.push({ id: 5, user_id: 7, title: 'Old', calendar_id: 1 })
    const controller = new EventController()
    await controller.loadEvents()

    await controller.updateEvent({ id: 5, name: 'New' })
    expect(apiCalls).toEqual([{ method: 'GET', url: '/events', data: undefined }])

    await controller.flushQueue()

    const put = apiCalls.find((c) => c.method === 'PUT' && c.url === '/events/5')
    expect(put).toBeDefined()
    expect(put?.data).toMatchObject({ title: 'New' })
    expect(await testDb.table('outbox').count()).toBe(0)
    expect(controller.getEvent({ idEvent: 5 })?.title).toBe('New')
  })

  it('removeEvent + flushQueue replays the DELETE', async () => {
    serverRows.push({ id: 8, user_id: 7, title: 'X', calendar_id: 1 })
    const controller = new EventController()
    await controller.loadEvents()

    await controller.removeEvent({ id: 8 })
    expect(controller.getEvent({ idEvent: 8 })).toBeNull()
    expect(await testDb.table('outbox').count()).toBe(1)

    await controller.flushQueue()

    const del = apiCalls.find((c) => c.method === 'DELETE' && c.url === '/events/8')
    expect(del).toBeDefined()
    expect(await testDb.table('outbox').count()).toBe(0)
    expect(await testDb.table('events').get(8)).toBeUndefined()
  })

  it('end-to-end offline write → reconnect → sync (acceptance criteria)', async () => {
    // Simulate the user going offline, creating an event, then coming
    // back online. Acceptance of LBDS-231 hinges on this flow.
    onlineState.value = false
    const controller = new EventController()
    controller.useSync()

    const { id: tempId } = await controller.createEvent({
      name: 'End to end',
      dateStart: '2026-10-03T10:00:00Z',
      calendar_id: 1,
    })

    expect(apiCalls).toEqual([])
    expect(controller.getEvents().find((e) => e.id === tempId)?.title).toBe('End to end')

    // Reconnect: flush drains the queue.
    onlineState.value = true
    await controller.flushQueue()

    const serverId = 101
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain('POST /events')
    expect(await testDb.table('outbox').count()).toBe(0)
    expect(await testDb.table('events').get(tempId as string)).toBeUndefined()
    expect((await testDb.table('events').get(serverId))?.title).toBe('End to end')
    expect(controller.getEvent({ idEvent: serverId as number })?.title).toBe('End to end')
  })
})
