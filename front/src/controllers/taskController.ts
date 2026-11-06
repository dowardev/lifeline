// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { taskService } from '@/services/taskService'
import { useTaskStore } from '@/store/taskStore'
import { db } from '@/db'
import { getPendingMutations, clearPendingMutations } from '@/db/repository'
import { extractListRows } from '@/utils/listResponse'
import type { TaskRecord } from '@/db/schema'
import type { TaskItem } from '@/store/taskStore'
import {
  createRepository,
  type RepositoryHooks,
} from '@/db/repository'
import {
  flush,
  registerReconciler,
  useOutboxProcessor,
} from '@/db/outboxProcessor'

/**
 * LBDS-231 - TaskController is migrated onto the global offline-first data
 * layer following the same pattern as EventController: server reads via
 * the repository, writes through the outbox, and a reconciler that swaps
 * the optimistic tempId for the real server id once the POST round-trips.
 */

interface ServerTaskDto {
  id: number
  user_id: number
  title: string
  description?: string
  status?: string
  priority?: number
  due_date?: string
  subtasks?: string
  order?: number
  notifications?: string[]
  id_reminders?: number[]
}

function buildHooks(): RepositoryHooks<TaskItem> {
  const store = (): ReturnType<typeof useTaskStore> => useTaskStore()
  return {
    setItems: ({ items }): void => store().setTasks({ tasks: items }),
    addItem: ({ item }): void => store().addTask({ task: item }),
    patchItem: ({ id, patch }): void =>
      store().updateTask({ id: id as number, updates: patch }),
    removeItem: ({ id }): void => store().removeTask({ id }),
  }
}

let repositorySingleton: ReturnType<
  typeof createRepository<ServerTaskDto, TaskItem>
> | null = null

function getRepository(): ReturnType<
  typeof createRepository<ServerTaskDto, TaskItem>
> {
  if (!repositorySingleton) {
    repositorySingleton = createRepository<ServerTaskDto, TaskItem>({
      tableName: 'tasks',
      urlBase: '/tasks',
      service: {
        async list(): Promise<ServerTaskDto[]> {
          // The backend answers with a Laravel resource collection
          // (`{ data: [...] }`); `extractListRows` unwraps it.
          const response = await taskService.getTasks()
          return extractListRows(response, 'tasks') as ServerTaskDto[]
        },
      },
      fromServer: ({ server }) => {
        // C-3 (pre-merge review): strip the `{ task: {...} }` wrapper so
        // the merged row carries the flat fields.
        const response = server as { task?: Record<string, unknown> } | Record<string, unknown> | undefined
        if (response && typeof response === 'object' && 'task' in response) {
          return (response as { task: Record<string, unknown> }).task
        }
        return (response as Record<string, unknown>) ?? {}
      },
      hooks: buildHooks(),
    })

    registerReconciler({
      tableName: 'tasks',
      reconciler: async ({ tempId, server }) => {
        // C-3 / C-4 (pre-merge review): backend wraps the row as
        // `{ task: {...} }`; spreading the wrapper would store the row
        // under a `task.*` sub-object and Pinia consumers would never see
        // the flat fields. Unwrap here.
        const response = server as
          | { id?: number | string; task?: Record<string, unknown> }
          | Record<string, unknown>
          | undefined
        const inner =
          response && typeof response === 'object' && 'task' in response
            ? ((response as { task: Record<string, unknown> }).task)
            : (response as Record<string, unknown> | undefined) ?? {}
        const id =
          typeof inner.id === 'number' || typeof inner.id === 'string'
            ? (inner.id as number | string)
            : typeof (response as { id?: number | string } | undefined)?.id === 'number' ||
                typeof (response as { id?: number | string } | undefined)?.id === 'string'
              ? ((response as { id: number | string }).id)
              : undefined
        if (typeof id !== 'number' && typeof id !== 'string') return

        const local = await db.tasks.get(tempId as string)
        const merged = { ...local, ...inner, id }
        if (local) {
          await db.tasks.delete(tempId as string)
          await db.tasks.put(merged)
        }
        const store = useTaskStore()
        const temp = store.tasks.findIndex((t) => t.id === tempId)
        if (temp !== -1) {
          store.removeTask({ id: tempId as string })
          store.addTask({ task: merged as TaskItem })
          // H-4 (pre-merge review): bump the shared sync clock so views
          // that watch this store refresh from the outbox reconciler.
          store.markSynced({ at: Date.now() })
          // H-2 (pre-merge review): drain pending mutations stashed
          // against the tempId (see repository.ts).
          const pending = getPendingMutations(tempId)
          if (pending.length > 0) {
            clearPendingMutations(tempId)
            for (const m of pending) {
              if (m.kind === 'update') {
                await getRepository().update({ id: serverId as number, patch: m.patch })
              } else {
                await getRepository().remove({ id: serverId as number })
              }
            }
          }
        }
      },
    })
  }
  return repositorySingleton
}

export class TaskController {
  private get store(): ReturnType<typeof useTaskStore> {
    return useTaskStore()
  }

  /** Mounts the outbox processor on the root component. */
  useSync(): void {
    useOutboxProcessor()
  }

  /** Forces a drain of the outbox right now. */
  flushQueue(): Promise<void> {
    return flush()
  }

  // --- Reads ------------------------------------------------------------

  async loadTasks(): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await getRepository().fetchAll()
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  // --- Writes (online + offline) ----------------------------------------

  async createTask(params: {
    title: string
    description?: string
    status?: string
    priority?: number
    due_date?: string
    subtasks?: string
    notifications?: string[]
    id_reminders?: number[]
  }): Promise<{ id: string | number }> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id } = await getRepository().create({
        record: {
          title: params.title,
          description: params.description,
          status: (params.status as TaskItem['status']) ?? 'pending',
          priority: params.priority,
          due_date: params.due_date,
          subtasks: params.subtasks,
          notifications: params.notifications,
          id_reminders: params.id_reminders,
          user_id: 0,
        },
      })
      return { id }
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateTask(params: {
    id?: number
    task?: Partial<TaskItem>
    title?: string
    description?: string
    status?: string
    priority?: number
    due_date?: string
    order?: number
    notifications?: string[]
    id_reminders?: number[]
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const data = params.task || params
      const id = params.id ?? data.id
      if (id === undefined) return
      const patch: Partial<TaskItem> = {}
      if (params.title !== undefined) patch.title = params.title
      if (params.description !== undefined) patch.description = params.description
      if (params.status !== undefined) patch.status = params.status as TaskItem['status']
      if (params.priority !== undefined) patch.priority = params.priority
      if (params.due_date !== undefined) patch.due_date = params.due_date
      if (params.order !== undefined) patch.order = params.order
      if (params.notifications !== undefined) patch.notifications = params.notifications
      if (params.id_reminders !== undefined) patch.id_reminders = params.id_reminders
      if (data.title !== undefined && patch.title === undefined) patch.title = data.title as string
      if (data.description !== undefined && patch.description === undefined)
        patch.description = data.description as string
      if (data.status !== undefined && patch.status === undefined)
        patch.status = data.status as TaskItem['status']
      if (data.priority !== undefined && patch.priority === undefined)
        patch.priority = data.priority as number
      if (data.due_date !== undefined && patch.due_date === undefined)
        patch.due_date = data.due_date as string
      if (data.subtasks !== undefined && (patch as { subtasks?: string }).subtasks === undefined)
        ;(patch as { subtasks?: string }).subtasks = data.subtasks as string
      if (data.order !== undefined && patch.order === undefined) patch.order = data.order as number
      if (data.notifications !== undefined && patch.notifications === undefined)
        patch.notifications = data.notifications as string[]
      if (data.id_reminders !== undefined && patch.id_reminders === undefined)
        patch.id_reminders = data.id_reminders as number[]
      await getRepository().update({ id, patch })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateTaskStatus(params: {
    id: number | string
    status: string
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const id = Number(params.id)
      const safeStatus = params.status as 'pending' | 'in_progress' | 'completed'
      await getRepository().update({ id, patch: { status: safeStatus } })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteTask(params: { id: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await getRepository().remove({ id: params.id })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  // --- Local-only helpers (kept for callers that need them) -------------

  /** Stamps a row into Dexie + Pinia without touching the outbox. */
  async addLocalTask(params: { task: TaskItem }): Promise<void> {
    this.store.addTask({ task: params.task })
    const record: TaskRecord = {
      id: params.task.id,
      user_id: params.task.user_id,
      title: params.task.title,
      description: params.task.description,
      status: params.task.status,
      priority: params.task.priority,
      due_date: params.task.due_date,
      subtasks: typeof params.task.subtasks === 'string' ? params.task.subtasks : '',
      order: params.task.order,
      notifications: params.task.notifications,
      id_reminders: params.task.id_reminders,
    }
    await db.tasks.put(record)
  }

  // --- Derived state (no I/O) -------------------------------------------

  getTasks(): TaskItem[] {
    return this.store.tasks
  }

  getTask(params: { id: number | string }): TaskItem | null {
    const id = Number(params.id)
    return this.store.tasks.find((t) => t.id === id) || null
  }
}
