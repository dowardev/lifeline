// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// Mock the singleton `db` so each test gets an isolated IndexedDB. The real
// `db` module returns a process-wide singleton tied to "LifeLineDB"; here
// we point it at a fresh database per file so concurrent specs do not see
// each other's outbox rows.
const testDbName = 'LifeLineDB-outbox-tests'
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

const {
  enqueue,
  peek,
  count,
  markDone,
  markRetry,
  markFailed,
  revive,
  bulkDelete,
  clear,
  listFailed,
  computeBackoffMs,
  MAX_ATTEMPTS,
} = await import('@/db/outbox')

async function getRow(id: number): Promise<unknown> {
  return testDb.table('outbox').get(id)
}

describe('outbox queue (LBDS-231)', () => {
  beforeEach(async () => {
    await testDb.table('outbox').clear()
  })

  afterEach(async () => {
    await testDb.table('outbox').clear()
  })

  it('enqueues a row and assigns an autoincrement id', async () => {
    const id = await enqueue({
      entityType: 'events',
      entityId: 1,
      op: 'update',
      url: '/events/1',
      method: 'PUT',
      payload: { title: 'X' },
    })
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })

  it('peek returns pending rows ordered by createdAt FIFO', async () => {
    const now = Date.now()
    await enqueue({
      entityType: 'events',
      entityId: 1,
      op: 'create',
      url: '/events',
      method: 'POST',
    })
    await new Promise((r) => setTimeout(r, 5))
    await enqueue({
      entityType: 'events',
      entityId: 2,
      op: 'create',
      url: '/events',
      method: 'POST',
    })
    const rows = await peek({ now })
    expect(rows.map((r) => r.entityId)).toEqual([1, 2])
  })

  it('peek includes retrying rows only when nextRetryAt has passed', async () => {
    const id = await enqueue({
      entityType: 'events',
      entityId: 7,
      op: 'update',
      url: '/events/7',
      method: 'PUT',
    })
    await markRetry({ id, error: 'boom' })
    // First backoff is 30s; an `now` 10s ahead is still inside the window.
    let rows = await peek({ now: Date.now() + 10_000 })
    expect(rows.find((r) => r.id === id)).toBeUndefined()
    // 60s ahead is past the first backoff window.
    rows = await peek({ now: Date.now() + 60_000 })
    expect(rows.find((r) => r.id === id)).toBeDefined()
  })

  it('count equals peek().length', async () => {
    await enqueue({
      entityType: 'tasks',
      entityId: 1,
      op: 'create',
      url: '/tasks',
      method: 'POST',
    })
    await enqueue({
      entityType: 'tasks',
      entityId: 2,
      op: 'create',
      url: '/tasks',
      method: 'POST',
    })
    const rows = await peek()
    expect(await count()).toBe(rows.length)
  })

  it('markDone flips status to done and clears retry fields', async () => {
    const id = await enqueue({
      entityType: 'documents',
      entityId: 9,
      op: 'delete',
      url: '/documents/9',
      method: 'DELETE',
    })
    await markDone({ id })
    const row = await getRow(id)
    expect(row?.status).toBe('done')
    expect(row?.lastError).toBeUndefined()
    expect(row?.nextRetryAt).toBeUndefined()
  })

  it('markRetry grows attempts, sets nextRetryAt, and parks at MAX_ATTEMPTS', async () => {
    const id = await enqueue({
      entityType: 'events',
      entityId: 3,
      op: 'update',
      url: '/events/3',
      method: 'PUT',
    })
    // Loop runs MAX_ATTEMPTS times so the last call parks the row as
    // `failed` (attempts reaches MAX_ATTEMPTS inside `markRetry`).
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      await markRetry({ id, error: `fail ${i}` })
      const row = await getRow(id)
      expect(row?.attempts).toBe(i)
      if (i < MAX_ATTEMPTS) {
        expect(row?.status).toBe('retrying')
        expect(row?.nextRetryAt).toBeDefined()
        expect(row?.lastError).toBe(`fail ${i}`)
      }
    }
    const final = await getRow(id)
    expect(final?.status).toBe('failed')
    expect(final?.nextRetryAt).toBeUndefined()
    expect(final?.lastError).toBe(`fail ${MAX_ATTEMPTS}`)
  })

  it('markFailed parks without retrying', async () => {
    const id = await enqueue({
      entityType: 'notes',
      entityId: 4,
      op: 'delete',
      url: '/notes/4',
      method: 'DELETE',
    })
    await markFailed({ id, error: 'permission denied' })
    const row = await getRow(id)
    expect(row?.status).toBe('failed')
    expect(row?.lastError).toBe('permission denied')
    expect(row?.nextRetryAt).toBeUndefined()
  })

  it('revive moves a failed row back to pending', async () => {
    const id = await enqueue({
      entityType: 'events',
      entityId: 5,
      op: 'update',
      url: '/events/5',
      method: 'PUT',
    })
    await markFailed({ id, error: 'x' })
    await revive({ id })
    const row = await getRow(id)
    expect(row?.status).toBe('pending')
    expect(row?.lastError).toBeUndefined()
  })

  it('bulkDelete removes the given ids and leaves others alone', async () => {
    const a = await enqueue({
      entityType: 'events',
      entityId: 1,
      op: 'delete',
      url: '/events/1',
      method: 'DELETE',
    })
    const b = await enqueue({
      entityType: 'events',
      entityId: 2,
      op: 'delete',
      url: '/events/2',
      method: 'DELETE',
    })
    const c = await enqueue({
      entityType: 'events',
      entityId: 3,
      op: 'delete',
      url: '/events/3',
      method: 'DELETE',
    })
    await bulkDelete({ ids: [a, b] })
    expect(await getRow(a)).toBeUndefined()
    expect(await getRow(b)).toBeUndefined()
    expect(await getRow(c)).toBeDefined()
  })

  it('listFailed returns only rows in the failed status', async () => {
    const id = await enqueue({
      entityType: 'tasks',
      entityId: 6,
      op: 'create',
      url: '/tasks',
      method: 'POST',
    })
    await markFailed({ id, error: 'gone' })
    const failed = await listFailed()
    expect(failed).toHaveLength(1)
    expect(failed[0].id).toBe(id)
  })

  it('computeBackoffMs caps at the last entry and never goes below the first', () => {
    expect(computeBackoffMs({ attempts: 1 })).toBe(30_000)
    expect(computeBackoffMs({ attempts: 3 })).toBe(120_000)
    expect(computeBackoffMs({ attempts: 8 })).toBe(3_600_000)
    expect(computeBackoffMs({ attempts: 100 })).toBe(3_600_000)
    expect(computeBackoffMs({ attempts: 0 })).toBe(30_000)
  })

  it('clear empties the queue', async () => {
    await enqueue({
      entityType: 'events',
      entityId: 1,
      op: 'create',
      url: '/events',
      method: 'POST',
    })
    await enqueue({
      entityType: 'events',
      entityId: 2,
      op: 'create',
      url: '/events',
      method: 'POST',
    })
    await clear()
    expect(await count()).toBe(0)
  })
})
