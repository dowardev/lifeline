// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'

// --- Mocked singletons ---------------------------------------------------

const testDbName = 'LifeLineDB-task-doc-tests'
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

const onlineState: { value: boolean } = { value: true }

vi.mock('@/composables/useOnlineStatus', () => ({
  getIsOnline: (): boolean => onlineState.value,
  useOnlineStatus: (): { isOnline: { value: boolean } } => ({ isOnline: { value: true } }),
}))

const apiCalls: Array<{ method: string; url: string }> = []
const serverPayload: { tasks: unknown[]; documents: unknown[] } = {
  tasks: [],
  documents: [],
}

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    async executeQuery({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'GET', url })
      if (url === '/tasks') return { tasks: serverPayload.tasks }
      if (url === '/documents') return { documents: serverPayload.documents }
      return []
    },
    async executeMutation({ url, method }: { url: string; method: 'POST' | 'PUT' }): Promise<unknown> {
      apiCalls.push({ method, url })
      return { id: 42, title: 'mock' }
    },
    async executeDelete({ url }: { url: string }): Promise<unknown> {
      apiCalls.push({ method: 'DELETE', url })
      return null
    },
  },
}))

const { TaskController } = await import('@/controllers/taskController')
const { DocumentController } = await import('@/controllers/documentController')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(async () => {
  await Promise.all([
    testDb.table('tasks').clear(),
    testDb.table('documents').clear(),
    testDb.table('outbox').clear(),
  ])
  apiCalls.length = 0
  serverPayload.tasks = []
  serverPayload.documents = []
  onlineState.value = true
  setActivePinia(createPinia())
})

afterEach(async () => {
  await Promise.all([
    testDb.table('tasks').clear(),
    testDb.table('documents').clear(),
    testDb.table('outbox').clear(),
  ])
})

// --- Tests ---------------------------------------------------------------

describe('TaskController LBDS-231 (offline-first)', () => {
  it('loadTasks mirrors server rows into Dexie + Pinia', async () => {
    serverPayload.tasks = [{ id: 1, user_id: 7, title: 'T1', status: 'pending' }]

    const controller = new TaskController()
    await controller.loadTasks()

    expect(controller.getTasks().map((t) => t.title)).toEqual(['T1'])
    expect(apiCalls[0]).toEqual({ method: 'GET', url: '/tasks' })
    expect((await testDb.table('tasks').toArray())[0].title).toBe('T1')
  })

  it('createTask offline enqueues and optimistically adds; flush reconciles', async () => {
    onlineState.value = false
    const controller = new TaskController()

    const { id: tempId } = await controller.createTask({ title: 'New task' })

    expect(typeof tempId).toBe('string')
    expect(apiCalls).toEqual([])
    expect(controller.getTasks().find((t) => t.id === tempId)?.title).toBe('New task')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'tasks',
      op: 'create',
      url: '/tasks',
      method: 'POST',
    })

    // Reconnect and flush.
    onlineState.value = true
    await controller.flushQueue()

    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain('POST /tasks')
    expect(await testDb.table('outbox').count()).toBe(0)
    expect(controller.getTask({ id: 42 })?.title).toBe('mock')
    expect(controller.getTask({ id: tempId })).toBeNull()
  })

  it('drains the mutations pending against the tempId once the server id is known', async () => {
    // Issue #1: the reconciler drained the pending mutations with an
    // undefined id (`serverId`), so the update was re-enqueued against
    // `/tasks` instead of `/tasks/{serverId}`.
    onlineState.value = false
    const controller = new TaskController()

    const { id: tempId } = await controller.createTask({ title: 'Created offline' })
    await controller.updateTask({
      id: tempId as unknown as number,
      title: 'Edited while pending',
    })

    // Only the create is queued: the update is stashed against the tempId.
    expect(await testDb.table('outbox').count()).toBe(1)

    onlineState.value = true
    await controller.flushQueue()

    const serverId = 42
    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'tasks',
      op: 'update',
      entityId: serverId,
      url: `/tasks/${serverId}`,
      method: 'PUT',
    })

    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain(`PUT /tasks/${serverId}`)
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('drains the pending delete against the server id once it is known', async () => {
    // Issue #1: the delete branch of the H-2 drain must replay against the
    // real server id too, not only the update branch.
    onlineState.value = false
    const controller = new TaskController()

    const { id: tempId } = await controller.createTask({ title: 'Created then deleted offline' })
    await controller.deleteTask({ id: tempId as unknown as number })

    expect(await testDb.table('outbox').count()).toBe(1)

    onlineState.value = true
    await controller.flushQueue()

    const serverId = 42
    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'tasks',
      op: 'delete',
      entityId: serverId,
      url: `/tasks/${serverId}`,
      method: 'DELETE',
    })

    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain(`DELETE /tasks/${serverId}`)
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('updateTaskStatus enqueues a PUT', async () => {
    await testDb.table('tasks').put({ id: 5, user_id: 7, title: 'X', status: 'pending' })
    const controller = new TaskController()
    await controller.loadTasks()

    await controller.updateTaskStatus({ id: 5, status: 'completed' })

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'tasks',
      entityId: 5,
      op: 'update',
      url: '/tasks/5',
      method: 'PUT',
    })
  })

  it('deleteTask enqueues a DELETE', async () => {
    await testDb.table('tasks').put({ id: 8, user_id: 7, title: 'X', status: 'pending' })
    const controller = new TaskController()
    await controller.loadTasks()

    await controller.deleteTask({ id: 8 })

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'tasks',
      entityId: 8,
      op: 'delete',
      url: '/tasks/8',
      method: 'DELETE',
    })
  })
})

describe('DocumentController LBDS-231 (offline-first)', () => {
  it('loadDocuments mirrors server rows', async () => {
    serverPayload.documents = [{ id: 1, user_id: 7, title: 'D1', type: 'note' }]

    const controller = new DocumentController()
    await controller.loadDocuments()

    expect(controller.getUserDocuments()?.map((d) => d.title)).toEqual(['D1'])
    expect((await testDb.table('documents').toArray())[0].title).toBe('D1')
  })

  it('createDocument offline enqueues and optimistically adds; flush reconciles', async () => {
    onlineState.value = false
    const controller = new DocumentController()

    const { id: tempId } = await controller.createDocument({ title: 'New doc' })

    expect(apiCalls).toEqual([])
    expect(controller.getUserDocuments()?.find((d) => d.id === tempId)?.title).toBe('New doc')

    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'documents',
      op: 'create',
      url: '/documents',
      method: 'POST',
    })

    onlineState.value = true
    await controller.flushQueue()

    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain('POST /documents')
    expect(await testDb.table('outbox').count()).toBe(0)
    expect(controller.getUserDocument({ documentId: '42' })?.title).toBe('mock')
  })

  it('drains the mutations pending against the tempId once the server id is known', async () => {
    // Issue #1: same drain defect as events/tasks/notes.
    onlineState.value = false
    const controller = new DocumentController()

    const { id: tempId } = await controller.createDocument({ title: 'Created offline' })
    await controller.updateDocument({
      id: tempId as unknown as number,
      title: 'Edited while pending',
    })

    expect(await testDb.table('outbox').count()).toBe(1)

    onlineState.value = true
    await controller.flushQueue()

    const serverId = 42
    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'documents',
      op: 'update',
      entityId: serverId,
      url: `/documents/${serverId}`,
      method: 'PUT',
    })

    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain(`PUT /documents/${serverId}`)
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('drains the pending delete against the server id once it is known', async () => {
    // Issue #1: the delete branch of the H-2 drain must replay against the
    // real server id too, not only the update branch.
    onlineState.value = false
    const controller = new DocumentController()

    const { id: tempId } = await controller.createDocument({ title: 'Created then deleted offline' })
    await controller.deleteDocument({ id: tempId as unknown as number })

    expect(await testDb.table('outbox').count()).toBe(1)

    onlineState.value = true
    await controller.flushQueue()

    const serverId = 42
    const queued = await testDb.table('outbox').toArray()
    expect(queued).toHaveLength(1)
    expect(queued[0]).toMatchObject({
      entityType: 'documents',
      op: 'delete',
      entityId: serverId,
      url: `/documents/${serverId}`,
      method: 'DELETE',
    })

    await controller.flushQueue()
    expect(apiCalls.map((c) => `${c.method} ${c.url}`)).toContain(`DELETE /documents/${serverId}`)
    expect(await testDb.table('outbox').count()).toBe(0)
  })

  it('updateDocument enqueues a PUT with the patched fields only', async () => {
    await testDb.table('documents').put({ id: 5, user_id: 7, title: 'D5', type: 'note' })
    const controller = new DocumentController()
    await controller.loadDocuments()

    await controller.updateDocument({ id: 5, title: 'Renamed' })

    const queued = await testDb.table('outbox').toArray()
    expect(queued[0]).toMatchObject({
      entityType: 'documents',
      entityId: 5,
      op: 'update',
      url: '/documents/5',
      method: 'PUT',
    })
    expect(queued[0].payload).toMatchObject({ title: 'Renamed' })
  })

  it('deleteDocument enqueues a DELETE', async () => {
    await testDb.table('documents').put({ id: 9, user_id: 7, title: 'D9', type: 'note' })
    const controller = new DocumentController()
    await controller.loadDocuments()

    await controller.deleteDocument({ id: 9 })

    const queued = await testDb.table('outbox').toArray()
    expect(queued[0]).toMatchObject({
      entityType: 'documents',
      entityId: 9,
      op: 'delete',
      url: '/documents/9',
      method: 'DELETE',
    })
  })
})
