// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const testDbName = 'LifeLineDB-conflict-tests'
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

const conflictStore = await import('@/db/conflictStore')

import Dexie from 'dexie'

describe('conflictStore (LBDS-231)', () => {
  beforeEach(async () => {
    await testDb.table('config').clear()
  })

  afterEach(async () => {
    await testDb.table('config').clear()
  })

  it('starts empty when nothing was persisted before', async () => {
    const list = await conflictStore.getAll()
    expect(list).toEqual([])
  })

  it('add + getAll round-trips a conflict', async () => {
    await conflictStore.add({
      entityType: 'events',
      syncId: 'evt-1',
      serverData: { id: 1, title: 'server' },
      clientData: { id: 1, title: 'client' },
    })
    const list = await conflictStore.getAll()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      entityType: 'events',
      syncId: 'evt-1',
      serverData: { id: 1, title: 'server' },
      clientData: { id: 1, title: 'client' },
    })
    expect(typeof list[0].detectedAt).toBe('number')
  })

  it('caps the list at the 100 most recent entries', async () => {
    for (let i = 0; i < 110; i++) {
      await conflictStore.add({
        entityType: 'events',
        syncId: `evt-${i}`,
        serverData: { i },
        clientData: { i },
      })
    }
    const list = await conflictStore.getAll()
    expect(list).toHaveLength(100)
    // The first 10 entries were dropped; the surviving window starts at i=10.
    expect(list[0].syncId).toBe('evt-10')
    expect(list[99].syncId).toBe('evt-109')
  })

  it('remove drops the matching conflict and leaves others', async () => {
    await conflictStore.add({
      entityType: 'events',
      syncId: 'evt-1',
      serverData: {},
      clientData: {},
    })
    await conflictStore.add({
      entityType: 'tasks',
      syncId: 'tsk-1',
      serverData: {},
      clientData: {},
    })

    await conflictStore.remove({ entityType: 'events', syncId: 'evt-1' })

    const list = await conflictStore.getAll()
    expect(list).toHaveLength(1)
    expect(list[0].syncId).toBe('tsk-1')
  })

  it('markResolved stamps resolvedAt on the matching conflict', async () => {
    await conflictStore.add({
      entityType: 'events',
      syncId: 'evt-1',
      serverData: {},
      clientData: {},
    })

    await conflictStore.markResolved({
      entityType: 'events',
      syncId: 'evt-1',
      resolution: 'server',
    })

    const list = await conflictStore.getAll()
    expect(list[0].resolvedAt).toBeDefined()
    expect(typeof list[0].resolvedAt).toBe('number')
  })

  it('clear wipes the entire list', async () => {
    await conflictStore.add({
      entityType: 'events',
      syncId: 'evt-1',
      serverData: {},
      clientData: {},
    })
    await conflictStore.add({
      entityType: 'events',
      syncId: 'evt-2',
      serverData: {},
      clientData: {},
    })
    await conflictStore.clear()
    expect(await conflictStore.getAll()).toEqual([])
  })

  describe('resolveByLww', () => {
    it('returns "client" when client.updated_at is newer (ms)', () => {
      expect(
        conflictStore.resolveByLww({
          server: { updated_at: 1_000_000 },
          client: { updated_at: 2_000_000 },
        }),
      ).toBe('client')
    })

    it('returns "server" when server.updated_at is newer', () => {
      expect(
        conflictStore.resolveByLww({
          server: { updated_at: 2_000_000 },
          client: { updated_at: 1_000_000 },
        }),
      ).toBe('server')
    })

    it('normalizes seconds-vs-milliseconds (server 1700000000, client 1700000000000)', () => {
      // server = 1700000000s = 1700000000000ms
      // client = 1700000000000ms (already ms)
      expect(
        conflictStore.resolveByLww({
          server: { updated_at: 1_700_000_000 },
          client: { updated_at: 1_700_000_000_000 },
        }),
      ).toBe('server')
    })

    it('falls back to "server" when the client has no timestamp', () => {
      expect(
        conflictStore.resolveByLww({
          server: { updated_at: 1_000_000 },
          client: {},
        }),
      ).toBe('server')
    })

    it('falls back to "client" when the server has no timestamp', () => {
      expect(
        conflictStore.resolveByLww({
          server: {},
          client: { updated_at: 1_000_000 },
        }),
      ).toBe('client')
    })

    it('accepts updatedAt (camelCase) as an alternative to updated_at', () => {
      expect(
        conflictStore.resolveByLww({
          server: { updatedAt: 1_000 },
          client: { updatedAt: 2_000 },
        }),
      ).toBe('client')
    })

    it('handles null/undefined payloads without throwing', () => {
      expect(conflictStore.resolveByLww({ server: null, client: { updated_at: 1 } })).toBe('client')
      expect(conflictStore.resolveByLww({ server: undefined, client: { updated_at: 1 } })).toBe('client')
      expect(conflictStore.resolveByLww({ server: { updated_at: 1 }, client: null })).toBe('server')
      expect(conflictStore.resolveByLww({ server: { updated_at: 1 }, client: undefined })).toBe('server')
    })
  })
})
