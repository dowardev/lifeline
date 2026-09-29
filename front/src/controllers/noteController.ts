// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { noteService } from '@/services/noteService'
import { useNoteStore } from '@/store/noteStore'
import { db } from '@/db'
import type { NoteItem } from '@/store/noteStore'
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
 * LBDS-231 - NoteController migrated onto the global offline-first data
 * layer. Same shape as EventController / TaskController: reads go through
 * the repository, writes go through the outbox, and a reconciler swaps
 * the optimistic tempId for the real server id once the POST round-trips.
 */

interface ServerNoteDto {
  id: number
  user_id: number
  document_id?: number
  title: string
  content?: string
  reminder?: string
  notifications?: string[]
  id_reminders?: number[]
}

function buildHooks(): RepositoryHooks<NoteItem> {
  const store = (): ReturnType<typeof useNoteStore> => useNoteStore()
  return {
    setItems: ({ items }): void => store().setNotes({ notes: items }),
    addItem: ({ item }): void => store().addNote({ note: item }),
    patchItem: ({ id, patch }): void =>
      store().updateNote({ id: id as number, updates: patch }),
    removeItem: ({ id }): void => store().removeNote({ id: id as number }),
  }
}

let repositorySingleton: ReturnType<
  typeof createRepository<ServerNoteDto, NoteItem>
> | null = null

function getRepository(): ReturnType<
  typeof createRepository<ServerNoteDto, NoteItem>
> {
  if (!repositorySingleton) {
    repositorySingleton = createRepository<ServerNoteDto, NoteItem>({
      tableName: 'notes',
      urlBase: '/notes',
      service: {
        async list(): Promise<ServerNoteDto[]> {
          const response = (await noteService.getNotes()) as
            | { notes: ServerNoteDto[] }
            | ServerNoteDto[]
          return Array.isArray(response)
            ? response
            : Array.isArray(response?.notes)
              ? response.notes
              : []
        },
      },
      fromServer: ({ server }) => ({ ...server }),
      hooks: buildHooks(),
    })

    registerReconciler({
      tableName: 'notes',
      reconciler: async ({ tempId, server }) => {
        const response = server as
          | { id?: number | string; note?: { id?: number } }
          | undefined
        const id =
          typeof response?.id === 'number' || typeof response?.id === 'string'
            ? response.id
            : response?.note?.id
        if (typeof id !== 'number' && typeof id !== 'string') return

        const local = await db.notes.get(tempId as string)
        if (local) {
          await db.notes.delete(tempId as string)
          await db.notes.put({ ...(server as Record<string, unknown>), id })
        }
        const store = useNoteStore()
        const temp = store.notes.findIndex((n) => n.id === tempId)
        if (temp !== -1) {
          store.removeNote({ id: tempId as string })
          store.addNote({ note: { ...(server as NoteItem), id } })
        }
      },
    })
  }
  return repositorySingleton
}

export class NoteController {
  private get store(): ReturnType<typeof useNoteStore> {
    return useNoteStore()
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

  async loadNotes(): Promise<void> {
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

  async createNote(params: {
    title: string
    content?: string
    document_id?: number
    reminder?: string
    notifications?: string[]
    id_reminders?: number[]
  }): Promise<{ id: string | number }> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id } = await getRepository().create({
        record: {
          title: params.title,
          content: params.content,
          document_id: params.document_id,
          reminder: params.reminder,
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

  async updateNote(params: {
    id: number
    title?: string
    content?: string
    reminder?: string
    notifications?: string[]
    id_reminders?: number[]
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id, ...rest } = params
      const patch: Partial<NoteItem> = {}
      if (rest.title !== undefined) patch.title = rest.title
      if (rest.content !== undefined) patch.content = rest.content
      if (rest.reminder !== undefined) patch.reminder = rest.reminder
      if (rest.notifications !== undefined) patch.notifications = rest.notifications
      if (rest.id_reminders !== undefined) patch.id_reminders = rest.id_reminders
      await getRepository().update({ id, patch })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteNote(params: { id: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await getRepository().remove({ id: params.id })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }
}
