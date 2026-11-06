// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * The four list endpoints answer with a Laravel resource collection:
 *
 *   EventResource::collection($events)  ->  { data: [...], links, meta }
 *
 * The data layer reads that body through `apiClient.executeQuery` (which
 * returns the parsed JSON as-is), so every controller's `service.list()`
 * has to unwrap the `data` envelope. When it does not, the repository
 * mirrors ZERO rows and empties the Pinia store of that domain: the
 * calendar still shows events (it falls back to Dexie) but the edit modal
 * reads the store and gets nothing, so the modal opens empty.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-laravel-list-shape'
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

vi.mock('@/composables/useOnlineStatus', () => ({
  getIsOnline: (): boolean => true,
  useOnlineStatus: (): { isOnline: { value: boolean } } => ({ isOnline: { value: true } }),
}))

const EVENT_ROW = {
  id: 7,
  user_id: 11,
  name: 'Evento de prueba',
  calendar_id: 1,
  dateStart: '2026-11-03T10:00:00Z',
  dateEnd: '2026-11-03T11:00:00Z',
}
const TASK_ROW = { id: 8, user_id: 11, title: 'Tarea de prueba', status: 'pending' }
const DOCUMENT_ROW = { id: 9, user_id: 11, title: 'Documento de prueba', type: 'note' }
const NOTE_ROW = { id: 10, user_id: 11, title: 'Nota de prueba' }

// The real backend shape for every list endpoint.
function laravelCollection(rows: unknown[]): unknown {
  return { data: rows, links: {}, meta: {} }
}

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      if (url === '/events') return laravelCollection([EVENT_ROW])
      if (url === '/tasks') return laravelCollection([TASK_ROW])
      if (url === '/documents') return laravelCollection([DOCUMENT_ROW])
      if (url === '/notes') return laravelCollection([NOTE_ROW])
      return laravelCollection([])
    },
    async executeMutation(): Promise<unknown> {
      return { id: 1 }
    },
    async executeDelete(): Promise<null> {
      return null
    },
  },
}))

// --- Subject under test --------------------------------------------------

const { EventController } = await import('@/controllers/eventController')
const { TaskController } = await import('@/controllers/taskController')
const { DocumentController } = await import('@/controllers/documentController')
const { NoteController } = await import('@/controllers/noteController')
const { useEventStore } = await import('@/store/eventStore')
const { useTaskStore } = await import('@/store/taskStore')
const { useDocumentStore } = await import('@/store/documentStore')
const { useNoteStore } = await import('@/store/noteStore')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('tasks').clear(),
    testDb.table('documents').clear(),
    testDb.table('notes').clear(),
    testDb.table('outbox').clear(),
  ])
  setActivePinia(createPinia())
})

afterEach(async () => {
  await Promise.all([
    testDb.table('events').clear(),
    testDb.table('tasks').clear(),
    testDb.table('documents').clear(),
    testDb.table('notes').clear(),
    testDb.table('outbox').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('the list endpoints answer with a Laravel resource collection', () => {
  it('mirrors the events into the store', async () => {
    const controller = new EventController()
    await controller.loadEvents()
    expect(useEventStore().events).toHaveLength(1)
    expect(useEventStore().events[0]?.title).toBe('Evento de prueba')
  })

  it('mirrors the tasks into the store', async () => {
    const controller = new TaskController()
    await controller.loadTasks()
    expect(useTaskStore().tasks).toHaveLength(1)
    expect(useTaskStore().tasks[0]?.title).toBe('Tarea de prueba')
  })

  it('mirrors the documents into the store', async () => {
    const controller = new DocumentController()
    await controller.loadDocuments()
    expect(useDocumentStore().documents).toHaveLength(1)
    expect(useDocumentStore().documents[0]?.title).toBe('Documento de prueba')
  })

  it('mirrors the notes into the store', async () => {
    const controller = new NoteController()
    await controller.loadNotes()
    expect(useNoteStore().notes).toHaveLength(1)
    expect(useNoteStore().notes[0]?.title).toBe('Nota de prueba')
  })
})
