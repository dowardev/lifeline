// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Regression tests for the "offline change never reaches the server" case.
 *
 * The SSO access token lives for one hour. When the app is offline for
 * longer than that, the replayed mutation comes back with 401. The old
 * behaviour parked the row in `failed`, and nothing ever revived it, so the
 * offline change was silently dropped: only the change made while online
 * (with a still-valid token) reached the server.
 *
 * Two behaviours are pinned here:
 *   1. A 401 is transient (the token can be renewed): the row must go back
 *      to `retrying` with a backoff instead of being parked in `failed`.
 *   2. When the session is restored, every row parked in `failed` returns to
 *      `pending` so the processor replays it.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-failed-revive-tests'
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

const onlineState = { value: true }

vi.mock('@/composables/useOnlineStatus', () => ({
  getIsOnline: (): boolean => onlineState.value,
  useOnlineStatus: (): Record<string, never> => ({}),
}))

const apiFailures = new Map<string, string>()
const apiCalls: Array<{ method: string; url: string }> = []

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeMutation({
      url,
      method,
    }: {
      url: string
      data?: unknown
      method: 'POST' | 'PUT' | 'DELETE'
    }): Promise<unknown> {
      apiCalls.push({ method, url })
      const key = `${method} ${url}`
      if (apiFailures.has(key)) {
        const error = new Error(apiFailures.get(key)!)
        ;(error as unknown as { cause?: { status?: number } }).cause = { status: 401 }
        throw error
      }
      return { id: 99 }
    },
  },
}))

// --- Helpers -------------------------------------------------------------

async function enqueueEvent(): Promise<number> {
  const outbox = await import('@/db/outbox')
  const id = await outbox.enqueue({
    entityType: 'events',
    entityId: 'tmp-abc',
    op: 'update',
    url: '/events/42',
    method: 'PUT',
    payload: { title: 'Editado Offline' },
  })
  return id
}

describe('outbox: re-encolar lo que quedó failed', () => {
  beforeEach(async () => {
    onlineState.value = true
    apiFailures.clear()
    apiCalls.length = 0
    await testDb.open()
    await testDb.outbox.clear()
  })

  afterEach(async () => {
    await testDb.outbox.clear()
    vi.resetModules()
  })

  it('un 401 deja la fila en retrying (no failed): el token puede renovarse', async () => {
    const outbox = await import('@/db/outbox')
    const processor = await import('@/db/outboxProcessor')
    const id = await enqueueEvent()
    apiFailures.set('PUT /events/42', 'Request failed with status code 401')

    await processor.flush()

    const row = await testDb.outbox.get(id)
    expect(row?.status).toBe('retrying')
    expect((await outbox.listFailed())).toHaveLength(0)
  })

  it('al restaurar la sesión, las filas failed vuelven a pending y se replican', async () => {
    const outbox = await import('@/db/outbox')
    const processor = await import('@/db/outboxProcessor')
    const id = await enqueueEvent()

    // Park the row the way a 401 used to park it.
    await outbox.markFailed({ id, error: 'Request failed with status code 401' })
    expect((await outbox.listFailed())).toHaveLength(1)

    // The session is restored (fresh token): the parked rows come back.
    await outbox.reviveAllFailed()

    expect((await outbox.listFailed())).toHaveLength(0)
    const rows = await outbox.peek()
    expect(rows.map((r) => r.status)).toEqual(['pending'])

    await processor.flush()
    expect(apiCalls).toContainEqual({ method: 'PUT', url: '/events/42' })
  })
})
