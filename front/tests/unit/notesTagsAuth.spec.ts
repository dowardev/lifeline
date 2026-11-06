// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-notes-tags-auth-tests'
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

const apiCalls: Array<{ method: string; url: string }> = []

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'GET', url })
      if (url === '/notes') return { notes: [{ id: 1, user_id: 7, title: 'N1' }] }
      if (url === '/admin-tags') return { tags: [{ id: 1, name: 'work' }, { id: 2, name: 'home' }] }
      return []
    },
    async executeMutation(params: { url: string; data?: unknown; method?: 'POST' | 'PUT' }): Promise<unknown> {
      // The real apiClient.executeMutation defaults `method` to POST when
      // omitted (used by attachTag). The mock mirrors that default.
      const method = params.method ?? 'POST'
      apiCalls.push({ method, url: params.url })
      return { id: 99, title: 'mock' }
    },
    async executeDelete({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'DELETE', url })
      return null
    },
  },
}))

const { NoteController } = await import('@/controllers/noteController')
const { TagController } = await import('@/controllers/tagController')
const { useAuthStore } = await import('@/store/authStore')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('notes').clear(),
    testDb.table('adminTags').clear(),
    testDb.table('tokens').clear(),
    testDb.table('outbox').clear(),
  ])
  apiCalls.length = 0
  // Cached auth lives in localStorage too; clear it so cross-test cache
  // does not leak into `restoreCachedAuth`.
  localStorage.clear()
  onlineState.value = true
  setActivePinia(createPinia())
})

afterEach(async () => {
  await Promise.all([
    testDb.table('notes').clear(),
    testDb.table('adminTags').clear(),
    testDb.table('tokens').clear(),
    testDb.table('outbox').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('NoteController LBDS-231 (offline-first)', () => {
  it('loadNotes mirrors server rows into Dexie + Pinia', async () => {
    const controller = new NoteController()
    await controller.loadNotes()

    expect(apiCalls).toEqual([{ method: 'GET', url: '/notes' }])
    expect((await testDb.table('notes').toArray())[0].title).toBe('N1')
  })

  it('createNote offline enqueues and optimistically adds; flush reconciles', async () => {
    onlineState.value = false
    const controller = new NoteController()

    const { id: tempId } = await controller.createNote({ title: 'New note' })

    expect(apiCalls).toEqual([])
    expect(typeof tempId).toBe('string')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'notes',
      op: 'create',
      url: '/notes',
      method: 'POST',
    })

    onlineState.value = true
    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain('POST /notes')
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('drains the mutations pending against the tempId once the server id is known', async () => {
    // Issue #1: same drain defect as events/tasks/documents.
    onlineState.value = false
    const controller = new NoteController()

    const { id: tempId } = await controller.createNote({ title: 'Created offline' })
    await controller.updateNote({
      id: tempId as unknown as number,
      title: 'Edited while pending',
    })

    expect(await testDb.table('outbox').count()).toBe(1)

    onlineState.value = true
    await controller.flushQueue()

    const serverId = 99
    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'notes',
      op: 'update',
      entityId: serverId,
      url: `/notes/${serverId}`,
      method: 'PUT',
    })

    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain(`PUT /notes/${serverId}`)
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('drains the pending delete against the server id once it is known', async () => {
    // Issue #1: the delete branch of the H-2 drain must replay against the
    // real server id too, not only the update branch.
    onlineState.value = false
    const controller = new NoteController()

    const { id: tempId } = await controller.createNote({ title: 'Created then deleted offline' })
    await controller.deleteNote({ id: tempId as unknown as number })

    expect(await testDb.table('outbox').count()).toBe(1)

    onlineState.value = true
    await controller.flushQueue()

    const serverId = 99
    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'notes',
      op: 'delete',
      entityId: serverId,
      url: `/notes/${serverId}`,
      method: 'DELETE',
    })

    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain(`DELETE /notes/${serverId}`)
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('updateNote + deleteNote enqueue PUT/DELETE', async () => {
    await testDb.table('notes').put({ id: 5, user_id: 7, title: 'X' })
    const controller = new NoteController()
    await controller.loadNotes()

    await controller.updateNote({ id: 5, title: 'Updated' })
    await controller.deleteNote({ id: 5 })

    const queued = await testDb.table('outbox').toArray()
    expect(queued.map((q) => `${q.method} ${q.url}`)).toEqual([
      'PUT /notes/5',
      'DELETE /notes/5',
    ])
  })
})

describe('TagController LBDS-231 (read-only cache)', () => {
  it('loadAdminTags mirrors server rows into Dexie + Pinia', async () => {
    const controller = new TagController()
    await controller.loadAdminTags()

    expect(apiCalls).toEqual([{ method: 'GET', url: '/admin-tags' }])
    expect((await testDb.table('adminTags').toArray())).toHaveLength(2)
  })

  it('loadAdminTags falls back to Dexie when offline', async () => {
    onlineState.value = false
    await testDb.table('adminTags').bulkPut([
      { id: 5, name: 'cached' },
    ])

    const controller = new TagController()
    await controller.loadAdminTags()

    expect(apiCalls).toEqual([])
    expect((await testDb.table('adminTags').toArray())[0].name).toBe('cached')
  })

  it('attachTag and detachTag call the service directly (nested mutation)', async () => {
    const controller = new TagController()
    await controller.attachTag({ eventId: 7, tagId: 3 })
    await controller.detachTag({ eventId: 7, tagId: 3 })

    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'POST /events/7/tags',
      'DELETE /events/7/tags/3',
    ])
  })
})

describe('authStore LBDS-231 (offline session restore)', () => {
  it('ensureLocalUser always materializes an anonymous identity', () => {
    const store = useAuthStore()
    const u = store.ensureLocalUser()
    expect(u.id).toBeGreaterThan(0)
    expect(store.isAnonymous).toBe(true)
  })

  it('setAuth persists the token to Dexie + localStorage', async () => {
    const store = useAuthStore()
    store.setAuth({
      userData: { id: 42, name: 'Alice', user_name: 'a', email: 'a@x.com' },
      accessToken: 'token-abc',
    })

    expect(store.isLogged).toBe(true)
    expect(store.isAnonymous).toBe(false)

    // Dexie
    const fromDb = await testDb.table('tokens').where('name').equals('sso').last()
    expect(fromDb?.token).toBe('token-abc')
    expect(fromDb?.user_id).toBe(42)
  })

  it('restoreCachedAuth rehydrates a previously stored session', async () => {
    const store = useAuthStore()
    // Pretend a previous session was cached.
    await testDb.table('tokens').put({ user_id: 77, name: 'sso', token: 'cached-tok' })

    const restored = await store.restoreCachedAuth()

    expect(restored).toBe(true)
    expect(store.isLogged).toBe(true)
    expect(store.isAnonymous).toBe(false)
    expect(store.token).toBe('cached-tok')
  })

  it('restoreCachedAuth returns false when no cache exists', async () => {
    const store = useAuthStore()
    const restored = await store.restoreCachedAuth()
    expect(restored).toBe(false)
    expect(store.isLogged).toBe(false)
    expect(store.isAnonymous).toBe(true)
  })

  it('clearAuth wipes the cached token + returns to anonymous', async () => {
    const store = useAuthStore()
    store.setAuth({
      userData: { id: 1, name: 'X', user_name: 'x', email: 'x@x' },
      accessToken: 't',
    })
    store.clearAuth()

    expect(store.isAnonymous).toBe(true)
    expect(await testDb.table('tokens').count()).toBe(0)
  })
})
