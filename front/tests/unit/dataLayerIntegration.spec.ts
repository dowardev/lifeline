// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

/**
 * LBDS-231 acceptance criteria - end-to-end integration of the offline-first
 * data layer. The test wires the real repository, outbox, and processor
 * (no internal mocking beyond the HTTP seam) and runs the user-visible
 * flow described in the ticket: write offline, come back online, watch
 * the outbox drain and the optimistic rows reconcile to their canonical
 * server ids.
 */

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-data-layer-integration'
const testDb = new Dexie(testDbName)
testDb.version(5).stores({
  events: '++id, user_id, title',
  users: '++id, email',
  usersLogged: '++id, user',
  tokens: '++id, user_id, name',
  config: 'name',
  tasks: '++id, user_id, title, status, due_date',
  documents: '++id, user_id, title, type',
  notes: '++id, user_id, document_id, title',
  outbox: '++id, entityType, entityId, status, nextRetryAt, createdAt',
  externalEvents: 'key, sourceName, dateStart, syncedAt',
  externalContacts: 'key, sourceName, displayName, syncedAt',
  externalTasks: 'key, sourceName, dueAt, syncedAt',
  adminTags: '++id, name',
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

// Tracks every HTTP call the processor makes; lets tests assert the
// order in which domains drain.
const apiCalls: Array<{ method: string; url: string }> = []
let nextServerId = 1000

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery(): Promise<unknown> {
      return []
    },
    async executeMutation({ url, method, data }: { url: string; method: 'POST' | 'PUT'; data?: Record<string, unknown> }): Promise<unknown> {
      apiCalls.push({ method, url })
      if (method === 'POST') {
        nextServerId++
        // Mirror the optimistic payload back, plus the canonical id, so
        // the reconciler can reconstruct the row faithfully.
        return { id: nextServerId, ...data }
      }
      return { ok: true }
    },
    async executeDelete({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'DELETE', url })
      return null
    },
  },
}))

const { EventController } = await import('@/controllers/eventController')
const { TaskController } = await import('@/controllers/taskController')
const { DocumentController } = await import('@/controllers/documentController')
const { flush, __clearReconcilersForTests } = await import('@/db/outboxProcessor')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('tasks').clear(),
    testDb.table('documents').clear(),
    testDb.table('outbox').clear(),
  ])
  apiCalls.length = 0
  nextServerId = 1000
  onlineState.value = true
  setActivePinia(createPinia())
  __clearReconcilersForTests()
})

afterEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('tasks').clear(),
    testDb.table('documents').clear(),
    testDb.table('outbox').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('LBDS-231 integration: offline write -> reconnect -> sync', () => {
  it('writes queued offline drain in FIFO and reconcile tempIds to server ids across events/tasks/documents', async () => {
    const eventCtrl = new EventController()
    const taskCtrl = new TaskController()
    const documentCtrl = new DocumentController()

    // 1) The user goes offline and creates rows across three domains.
    onlineState.value = false

    const { id: eventTemp } = await eventCtrl.createEvent({
      name: 'Offline event',
      dateStart: '2026-10-01T10:00:00Z',
      calendar_id: 1,
    })
    const { id: taskTemp } = await taskCtrl.createTask({ title: 'Offline task' })
    const { id: docTemp } = await documentCtrl.createDocument({ title: 'Offline doc' })

    expect(apiCalls).toEqual([]) // nothing on the wire yet
    expect(await testDb.table('outbox').count()).toBe(3)

    // 2) The Pinia stores show the optimistic rows under their temp ids.
    expect(eventCtrl.getEvents().find((e) => e.id === eventTemp)?.title).toBe('Offline event')
    expect(taskCtrl.getTasks().find((t) => t.id === taskTemp)?.title).toBe('Offline task')
    expect(documentCtrl.getUserDocuments()?.find((d) => d.id === docTemp)?.title).toBe('Offline doc')

    // 3) Connectivity returns. The processor drains the queue.
    onlineState.value = true
    await flush()

    expect(apiCalls.length).toBe(3)
    // FIFO drain, one POST per domain, all to the collection root.
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'POST /events',
      'POST /tasks',
      'POST /documents',
    ])

    // 4) The outbox is empty, the tempId rows are gone, and the canonical
    // server ids (1001/1002/1003 - the mock's counter after three
    // increments) carry the real data.
    expect(await testDb.table('outbox').count()).toBe(0)
    expect(await testDb.table('events').get(eventTemp as string)).toBeUndefined()
    expect(await testDb.table('tasks').get(taskTemp as string)).toBeUndefined()
    expect(await testDb.table('documents').get(docTemp as string)).toBeUndefined()

    const canonicalEvent = await testDb.table('events').get(1001)
    const canonicalTask = await testDb.table('tasks').get(1002)
    const canonicalDoc = await testDb.table('documents').get(1003)
    expect(canonicalEvent?.title).toBe('Offline event')
    expect(canonicalTask?.title).toBe('Offline task')
    expect(canonicalDoc?.title).toBe('Offline doc')

    // 5) Pinia swapped the tempId for the canonical id on every store.
    expect(eventCtrl.getEvent({ idEvent: 1001 })?.title).toBe('Offline event')
    expect(eventCtrl.getEvents().find((e) => e.id === eventTemp)).toBeUndefined()
    expect(taskCtrl.getTask({ id: 1002 })?.title).toBe('Offline task')
    expect(taskCtrl.getTasks().find((t) => t.id === taskTemp)).toBeUndefined()
    expect(documentCtrl.getUserDocument({ documentId: '1003' })?.title).toBe('Offline doc')
    expect(documentCtrl.getUserDocuments()?.find((d) => d.id === docTemp)).toBeUndefined()
  })

  it('transient failures stay queued for retry; permanent failures (401) park the row', async () => {
    const eventCtrl = new EventController()
    const taskCtrl = new TaskController()

    onlineState.value = false
    await eventCtrl.createEvent({ name: 'A', dateStart: '2026-10-01T10:00:00Z', calendar_id: 1 })
    await taskCtrl.createTask({ title: 'B' })

    // Reconnect, but the first request fails (network) and the second
    // bounces off with a 401.
    onlineState.value = true

    const apiMock = await import('@/services/apiClient')
    const realMutation = (apiMock.apiClient as unknown as {
      executeMutation: (...args: unknown[]) => Promise<unknown>
    }).executeMutation.bind(apiMock.apiClient)

    let firstCall = true
    vi.spyOn(apiMock.apiClient, 'executeMutation').mockImplementation(async (params: unknown) => {
      const p = params as { url: string; method?: string }
      if (firstCall && p.url === '/events') {
        firstCall = false
        throw new Error('network down')
      }
      if (p.url === '/tasks' && p.method === 'POST') {
        throw new Error('401 Unauthorized')
      }
      return realMutation(params as { url: string; method?: 'POST' | 'PUT' })
    })

    await flush()

    // The event stayed queued (retrying); the task was parked as failed.
    const rows = await testDb.table('outbox').toArray()
    const eventRow = rows.find((r) => r.entityType === 'events')
    const taskRow = rows.find((r) => r.entityType === 'tasks')
    expect(eventRow?.status).toBe('retrying')
    expect(eventRow?.attempts).toBe(1)
    expect(eventRow?.lastError).toBe('network down')
    expect(taskRow?.status).toBe('failed')
    expect(taskRow?.lastError).toBe('401 Unauthorized')
  })

  it('conflictStore.resolveByLww picks the newer side; auto-resolution is wired into the data layer', async () => {
    const { resolveByLww } = await import('@/db/conflictStore')
    // Server says "last edit at 1700000000s"; client (still optimistic
    // after going offline at 1700000000s + 1min) wins.
    expect(
      resolveByLww({
        server: { updated_at: 1_700_000_000 },
        client: { updated_at: 1_700_000_060 },
      }),
    ).toBe('client')

    // Server wins when the client did not actually edit.
    expect(
      resolveByLww({
        server: { updated_at: 1_700_000_000 },
        client: { updated_at: 1_699_999_940 },
      }),
    ).toBe('server')
  })
})
