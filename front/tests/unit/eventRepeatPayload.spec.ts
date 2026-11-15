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
const { parseStoredRepeat, toServerRepeat } = await import('@/utils/repeat')
const { setActivePinia, createPinia } = await import('pinia')

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

describe('EventController update payload (Laravel repeat contract)', () => {
  it('sends `repeat` as an array so the backend does not answer 422', async () => {
    await testDb.table('events').put({
      id: 42,
      user_id: 7,
      title: 'Servidor',
      calendar_id: 1,
    } as never)

    const controller = new EventController()
    await controller.updateEvent({ id: 42, name: 'Renombrado', repeat: 'unique' })

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    const payload = queued[0].payload as Record<string, unknown>
    // The Laravel backend validates `repeat` as an ARRAY on
    // PUT /events/{id} ("sometimes|nullable|array").
    expect(Array.isArray(payload.repeat)).toBe(true)
    expect(payload.repeat).toEqual([])
  })

  it('sends the repeat rule as a single-element array', async () => {
    await testDb.table('events').put({
      id: 43,
      user_id: 7,
      title: 'Servidor',
      calendar_id: 1,
    } as never)

    const controller = new EventController()
    await controller.updateEvent({ id: 43, name: 'Renombrado', repeat: 'daily' })

    const queued = await testDb.table('outbox').toArray()
    const payload = queued[0].payload as Record<string, unknown>
    expect(payload.repeat).toEqual([{ type: 'daily', frecuency: 1 }])
  })

  it('omits `repeat` when the caller does not send it', async () => {
    await testDb.table('events').put({
      id: 44,
      user_id: 7,
      title: 'Servidor',
      calendar_id: 1,
    } as never)

    const controller = new EventController()
    await controller.updateEvent({ id: 44, name: 'Renombrado' })

    const queued = await testDb.table('outbox').toArray()
    const payload = queued[0].payload as Record<string, unknown>
    expect('repeat' in payload).toBe(false)
  })
})

describe('repeat helpers', () => {
  it('toServerRepeat maps the app shapes to the wire array', () => {
    expect(toServerRepeat({ repeat: 'unique' })).toEqual([])
    expect(toServerRepeat({ repeat: '' })).toEqual([])
    expect(toServerRepeat({ repeat: undefined })).toEqual([])
    expect(toServerRepeat({ repeat: 'weekly' })).toEqual([
      { type: 'weekly', frecuency: 1 },
    ])
    expect(toServerRepeat({ repeat: { type: 'daily', frecuency: 3 } })).toEqual([
      { type: 'daily', frecuency: 3 },
    ])
    expect(toServerRepeat({ repeat: [{ type: 'monthly', frecuency: 2 }] })).toEqual([
      { type: 'monthly', frecuency: 2 },
    ])
  })

  it('parseStoredRepeat unwraps the wire array back to the app shape', () => {
    expect(parseStoredRepeat([{ type: 'daily', frecuency: 1 }])).toMatchObject({
      type: 'daily',
      frecuency: 1,
    })
    expect(parseStoredRepeat('daily')).toMatchObject({ type: 'daily' })
    expect(parseStoredRepeat(undefined)).toMatchObject({ type: 'unique' })
  })
})
