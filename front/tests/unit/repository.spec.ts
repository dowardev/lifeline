// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-repository-tests'
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
}))

const { createRepository } = await import('@/db/repository')

// --- Fixture types -------------------------------------------------------

interface ServerEvent {
  id: number
  user_id: number
  title: string
  calendar_id: number
}

interface LocalEvent {
  id?: string | number
  user_id: number
  title: string
  calendar_id: number
}

interface HooksHandle {
  items: () => LocalEvent[]
  calls: { setItems: number; addItem: number; patchItem: number; removeItem: number }
  hooks: import('@/db/repository').RepositoryHooks<LocalEvent>
}

function hooksFactory(): HooksHandle {
  let items: LocalEvent[] = []
  const calls = { setItems: 0, addItem: 0, patchItem: 0, removeItem: 0 }
  return {
    items: (): LocalEvent[] => items.slice(),
    calls,
    hooks: {
      setItems: ({ items: next }: { items: LocalEvent[] }): void => {
        items = next.slice()
        calls.setItems++
      },
      addItem: ({ item }: { item: LocalEvent }): void => {
        items = [...items, item]
        calls.addItem++
      },
      patchItem: ({
        id,
        patch,
      }: {
        id: string | number
        patch: Partial<LocalEvent>
      }): void => {
        items = items.map((row) => (row.id === id ? { ...row, ...patch } : row))
        calls.patchItem++
      },
      removeItem: ({ id }: { id: string | number }): void => {
        items = items.filter((row) => row.id !== id)
        calls.removeItem++
      },
    },
  }
}

interface RepoHandle {
  repo: ReturnType<typeof createRepository<ServerEvent, LocalEvent>>
  hooks: import('@/db/repository').RepositoryHooks<LocalEvent>
  items: () => LocalEvent[]
  calls: HooksHandle['calls']
  setServer: (rows: ServerEvent[]) => void
}

function repoFactory(): RepoHandle {
  const { hooks, items, calls } = hooksFactory()
  let serverRows: ServerEvent[] = []
  const service = {
    async list(): Promise<ServerEvent[]> {
      return serverRows.slice()
    },
  }
  const repo = createRepository<ServerEvent, LocalEvent>({
    tableName: 'events',
    urlBase: '/events',
    service,
    fromServer: ({ server }: { server: ServerEvent }) => ({
      id: server.id,
      user_id: server.user_id,
      title: server.title,
      calendar_id: server.calendar_id,
    }),
    hooks,
  })
  return {
    repo,
    hooks,
    items,
    calls,
    setServer: (rows: ServerEvent[]): void => {
      serverRows = rows
    },
  }
}

// --- Tests ---------------------------------------------------------------

describe('createRepository (LBDS-231)', () => {
  beforeEach(async () => {
    await Promise.all([
      testDb.table('events').clear(),
      testDb.table('outbox').clear(),
    ])
    onlineState.value = true
  })

  afterEach(async () => {
    await Promise.all([
      testDb.table('events').clear(),
      testDb.table('outbox').clear(),
    ])
  })

  it('fetchAll reads from the server, mirrors to Dexie and Pinia when online', async () => {
    const { repo, items, calls, setServer } = repoFactory()
    setServer([
      { id: 1, user_id: 7, title: 'A', calendar_id: 1 },
      { id: 2, user_id: 7, title: 'B', calendar_id: 1 },
    ])

    const rows = await repo.fetchAll()

    expect(rows.map((r) => r.title)).toEqual(['A', 'B'])
    expect(items().map((r) => r.title)).toEqual(['A', 'B'])
    expect(calls.setItems).toBe(1)
    const inDb = await testDb.table('events').toArray()
    expect(inDb).toHaveLength(2)
  })

  it('fetchAll falls back to Dexie when offline', async () => {
    onlineState.value = false
    const { repo, items, setServer } = repoFactory()
    setServer([])
    // Seed Dexie directly so the offline path has something to read.
    await testDb.table('events').bulkPut([
      { id: 9, user_id: 1, title: 'cached', calendar_id: 1 },
    ])

    const rows = await repo.fetchAll()

    expect(rows).toHaveLength(1)
    expect(rows[0].title).toBe('cached')
    expect(items()[0].title).toBe('cached')
  })

  it('fetchAll falls back to Dexie when the server is unreachable even if "online"', async () => {
    const failingRepo = createRepository<ServerEvent, LocalEvent>({
      tableName: 'events',
      urlBase: '/events',
      service: {
        async list(): Promise<ServerEvent[]> {
          throw new Error('network down')
        },
      },
      fromServer: ({ server }) => ({
        id: server.id,
        user_id: server.user_id,
        title: server.title,
        calendar_id: server.calendar_id,
      }),
      hooks: hooksFactory().hooks,
    })
    await testDb.table('events').bulkPut([
      { id: 11, user_id: 1, title: 'fallback', calendar_id: 1 },
    ])

    const rows = await failingRepo.fetchAll()

    expect(rows.map((r) => r.title)).toEqual(['fallback'])
  })

  it('create optimistically adds to Dexie + Pinia and enqueues a POST', async () => {
    const { repo, items, calls } = repoFactory()

    const { id } = await repo.create({
      record: { user_id: 7, title: 'New', calendar_id: 1 },
    })

    expect(typeof id).toBe('string')
    expect(id.startsWith('tmp-')).toBe(true)
    expect(calls.addItem).toBe(1)
    expect(items().map((r) => r.title)).toEqual(['New'])
    const inDb = await testDb.table('events').toArray()
    expect(inDb).toHaveLength(1)
    expect(inDb[0].title).toBe('New')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'events',
      op: 'create',
      url: '/events',
      method: 'POST',
      payload: { user_id: 7, title: 'New', calendar_id: 1 },
      status: 'pending',
    })
    expect(queued[0].entityId).toBe(id)
  })

  it('update optimistically patches Dexie + Pinia and enqueues a PUT', async () => {
    const { repo, items, calls, hooks } = repoFactory()
    await testDb.table('events').put({
      id: 42,
      user_id: 7,
      title: 'Old',
      calendar_id: 1,
    })
    // In real use the row is already in the store from a prior fetchAll;
    // mirror that here so the optimistic patch can find it.
    hooks.setItems({
      items: [{ id: 42, user_id: 7, title: 'Old', calendar_id: 1 }],
    })

    await repo.update({ id: 42, patch: { title: 'New' } })

    expect(calls.patchItem).toBe(1)
    expect(items().find((r) => r.id === 42)?.title).toBe('New')
    const inDb = await testDb.table('events').get(42)
    expect(inDb?.title).toBe('New')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'events',
      entityId: 42,
      op: 'update',
      url: '/events/42',
      method: 'PUT',
      payload: { title: 'New' },
    })
  })

  it('remove optimistically deletes from Dexie + Pinia and enqueues a DELETE', async () => {
    const { repo, items, calls } = repoFactory()
    await testDb.table('events').put({
      id: 5,
      user_id: 7,
      title: 'X',
      calendar_id: 1,
    })

    await repo.remove({ id: 5 })

    expect(calls.removeItem).toBe(1)
    expect(items().find((r) => r.id === 5)).toBeUndefined()
    expect(await testDb.table('events').get(5)).toBeUndefined()

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'events',
      entityId: 5,
      op: 'delete',
      url: '/events/5',
      method: 'DELETE',
    })
  })

  it('create/update/remove enqueue three rows in order', async () => {
    const { repo } = repoFactory()
    await testDb.table('events').put({
      id: 1,
      user_id: 7,
      title: 'A',
      calendar_id: 1,
    })

    await repo.create({ record: { user_id: 7, title: 'B', calendar_id: 1 } })
    await repo.update({ id: 1, patch: { title: 'A2' } })
    await repo.remove({ id: 1 })

    const queued = await testDb.table('outbox').toArray()
    expect(queued.map((r) => r.op)).toEqual(['create', 'update', 'delete'])
  })
})
