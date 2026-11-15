// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-event-repeat-tests'
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

const onlineState: { value: boolean } = { value: false }

vi.mock('@/composables/useOnlineStatus', () => ({
  getIsOnline: (): boolean => onlineState.value,
  useOnlineStatus: (): { isOnline: { value: boolean } } => ({ isOnline: { value: true } }),
}))

const apiCalls: Array<{ method: string; url: string; data?: unknown }> = []

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'GET', url })
      return { events: [] }
    },
    async executeMutation({ url, data, method }: { url: string; data?: unknown; method: 'POST' | 'PUT' }): Promise<unknown> {
      apiCalls.push({ method, url, data })
      return data
    },
    async executeDelete({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'DELETE', url })
      return null
    },
  },
}))

// --- Subject under test --------------------------------------------------

const { EventController } = await import('@/controllers/eventController')
const { toPlainData } = await import('@/utils/plainData')
const { setActivePinia, createPinia } = await import('pinia')
const { reactive } = await import('vue')

beforeEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('outbox').clear(),
  ])
  apiCalls.length = 0
  onlineState.value = false
  setActivePinia(createPinia())
})

afterEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('outbox').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('reactive payloads (IndexedDB structured clone)', () => {
  it('persists a reactive payload instead of failing with DataCloneError', async () => {
    await testDb.table('events').put({
      id: 42,
      user_id: 7,
      title: 'Servidor',
      calendar_id: 1,
    } as never)

    const controller = new EventController()
    // The event modal hands over its own reactive state: a Proxy.
    const reactiveIds = reactive([1, 2, 3])

    await controller.updateEvent({
      id: 42,
      name: 'Editado',
      id_reminders: reactiveIds,
    })

    const row = await testDb.table('events').get(42)
    expect(row?.title).toBe('Editado')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({ op: 'update', method: 'PUT', url: '/events/42' })
    expect((queued[0].payload as Record<string, unknown>).id_reminders).toEqual([1, 2, 3])
  })

  it('toPlainData unwraps nested reactive values', () => {
    const source = reactive({ ids: [1, 2], nested: { flag: true } })
    const plain = toPlainData(source)

    expect(plain).toEqual({ ids: [1, 2], nested: { flag: true } })
    expect(plain.ids).not.toBe(source.ids)
    expect(() => structuredClone(plain)).not.toThrow()
  })

  it('toPlainData keeps non-plain objects (Date) as they are', () => {
    const date = new Date('2026-11-08T10:00:00.000Z')
    const plain = toPlainData({ date })

    expect(plain.date).toBe(date)
  })
})
