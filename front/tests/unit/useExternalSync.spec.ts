// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-external-sync-tests'
const testDb = new Dexie(testDbName)
testDb.version(4).stores({
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
})

vi.mock('@/db', () => ({
  get db(): typeof testDb {
    return testDb
  },
}))

const apiCalls: Array<{ url: string }> = []
const serverPayloads = {
  events: [
    {
      id: 1,
      title: 'External A',
      date_start: '2026-10-01T10:00:00Z',
      date_end: '2026-10-01T11:00:00Z',
      source_name: 'Google',
      source_color: '#3880ff',
    },
  ],
  contacts: [
    { id: 11, display_name: 'Alice', email: 'a@example.com', phone: '+1', source_name: 'Google' },
  ],
  tasks: [
    { id: 21, title: 'Buy milk', due_at: '2026-10-02T00:00:00Z', source_name: 'Google' },
  ],
}

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ url })
      if (url === '/external-events') return { events: serverPayloads.events }
      if (url === '/external-contacts') return { contacts: serverPayloads.contacts }
      if (url === '/external-tasks') return { tasks: serverPayloads.tasks }
      if (url === '/calendar-sources') return []
      return []
    },
  },
}))

vi.mock('@/controllers/calendarSourceController', () => ({
  CalendarSourceController: class {
    async listSources(): Promise<[]> { return [] }
    async syncSource(): Promise<{ ok: true }> { return { ok: true } }
  },
}))

vi.mock('@/controllers/reminderController', () => ({
  ReminderController: class {
    async syncExternalReminders(): Promise<void> { /* noop */ }
  },
}))

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: async (): Promise<{ remove: () => Promise<void> }> => ({
      remove: async (): Promise<void> => undefined,
    }),
  },
}))

const { runExternalSync, hydrateExternalStoresFromCache, __resetExternalSyncForTests } =
  await import('@/composables/useExternalSync')
const { useExternalEventStore } = await import('@/store/externalEventStore')
const { useExternalContactStore } = await import('@/store/externalContactStore')
const { useExternalTaskStore } = await import('@/store/externalTaskStore')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('externalEvents').clear(),
    testDb.table('externalContacts').clear(),
    testDb.table('externalTasks').clear(),
  ])
  apiCalls.length = 0
  setActivePinia(createPinia())
  __resetExternalSyncForTests()
})

afterEach(async () => {
  await Promise.all([
    testDb.table('externalEvents').clear(),
    testDb.table('externalContacts').clear(),
    testDb.table('externalTasks').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('useExternalSync LBDS-231 (shared composable, no duplicate requests)', () => {
  it('runExternalSync reads each external endpoint exactly once and fills every store + Dexie mirror', async () => {
    await runExternalSync()

    const urls = apiCalls.map((c) => c.url)
    const externalCalls = urls.filter((u) => u.startsWith('/external-'))
    expect(externalCalls).toEqual(
      expect.arrayContaining(['/external-events', '/external-contacts', '/external-tasks']),
    )
    // No duplicates of any external endpoint on a single sync.
    const counts = externalCalls.reduce<Record<string, number>>((acc, u) => {
      acc[u] = (acc[u] ?? 0) + 1
      return acc
    }, {})
    expect(Object.values(counts).every((n) => n === 1)).toBe(true)

    const eventStore = useExternalEventStore()
    const contactStore = useExternalContactStore()
    const taskStore = useExternalTaskStore()

    expect(eventStore.events.map((e) => e.title)).toEqual(['External A'])
    expect(contactStore.contacts.map((c) => c.displayName)).toEqual(['Alice'])
    expect(taskStore.tasks.map((t) => t.title)).toEqual(['Buy milk'])

    expect(await testDb.table('externalEvents').count()).toBe(1)
    expect(await testDb.table('externalContacts').count()).toBe(1)
    expect(await testDb.table('externalTasks').count()).toBe(1)
  })

  it('concurrent runExternalSync calls share a single in-flight run (no duplicate HTTP)', async () => {
    // First call is TTL-gated to expire only after the test starts, so we
    // restart the timer to force a fresh attempt window.
    await runExternalSync()
    __resetExternalSyncForTests()
    apiCalls.length = 0

    await Promise.all([runExternalSync(), runExternalSync(), runExternalSync()])

    const externalCalls = apiCalls.filter((c) => c.url.startsWith('/external-'))
    // Three external endpoints, once each.
    expect(externalCalls).toHaveLength(3)
  })

  it('hydrateExternalStoresFromCache rebuilds Pinia from Dexie on relaunch', async () => {
    // Simulate a previous sync that wrote rows to Dexie.
    await testDb.table('externalEvents').put({
      key: 'ext-99',
      sourceName: 'Google',
      sourceColor: '#3880ff',
      title: 'Cached',
      syncedAt: Date.now(),
    })

    await hydrateExternalStoresFromCache()

    const store = useExternalEventStore()
    expect(store.events.map((e) => e.title)).toEqual(['Cached'])
  })

  it('empty upstream clears the cache so the UI does not show stale rows', async () => {
    // Seed Dexie with an old row.
    await testDb.table('externalEvents').put({
      key: 'ext-old',
      sourceName: 'Google',
      sourceColor: '#3880ff',
      title: 'Old',
      syncedAt: 0,
    })

    // Make the upstream return no events.
    const original = serverPayloads.events
    ;(serverPayloads as { events: unknown[] }).events = []
    try {
      await runExternalSync()
    } finally {
      ;(serverPayloads as { events: unknown[] }).events = original
    }

    const store = useExternalEventStore()
    expect(store.events).toEqual([])
    expect(await testDb.table('externalEvents').count()).toBe(0)
  })
})
