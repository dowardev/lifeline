// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { documentService } from '@/services/documentService'
import { useDocumentStore } from '@/store/documentStore'
import { db } from '@/db'
import { getPendingMutations, clearPendingMutations } from '@/db/repository'
import { extractListRows } from '@/utils/listResponse'
import type { DocumentRecord } from '@/db/schema'
import type { DocumentItem } from '@/store/documentStore'
import { toPlainData } from '@/utils/plainData'
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
 * LBDS-231 - DocumentController is migrated onto the global offline-first
 * data layer following the same pattern as EventController / TaskController.
 * Notes (which are nested inside documents) keep their own per-document
 * helpers because they are an in-memory-only layer on top of documents.
 */

export interface DocumentElement {
  type: string
  data?: Record<string, unknown>
  reminders?: Record<string, unknown>
  [key: string]: unknown
}

interface ServerDocumentDto {
  id: number
  user_id: number
  title: string
  type?: string
  content?: string
  order?: number
  elements?: unknown
}

/**
 * Maps a server payload (flat or wrapped in `{ document: {...} }`) onto the
 * local item shape. The backend answers with a Laravel resource, so the row
 * arrives wrapped; the wrapper is stripped here.
 */
function toDocumentItem(params: { server: ServerDocumentDto }): DocumentItem {
  const { server } = params
  const raw = server as unknown as Record<string, unknown>
  const inner =
    raw && typeof raw === 'object' && 'document' in raw
      ? ((raw as { document: Record<string, unknown> }).document ?? {})
      : raw
  // The server payload carries the document fields as they are; the local
  // item type only declares the ones the UI reads.
  return inner as unknown as DocumentItem
}

function buildHooks(): RepositoryHooks<DocumentItem> {
  const store = (): ReturnType<typeof useDocumentStore> => useDocumentStore()
  return {
    setItems: ({ items }): void => store().setDocuments({ documents: items }),
    addItem: ({ item }): void => store().addDocument({ document: item }),
    patchItem: ({ id, patch }): void =>
      store().updateDocument({ id: id as number, updates: patch }),
    removeItem: ({ id }): void => store().removeDocument({ id }),
  }
}

let repositorySingleton: ReturnType<
  typeof createRepository<ServerDocumentDto, DocumentItem>
> | null = null

function getRepository(): ReturnType<
  typeof createRepository<ServerDocumentDto, DocumentItem>
> {
  if (!repositorySingleton) {
    repositorySingleton = createRepository<ServerDocumentDto, DocumentItem>({
      tableName: 'documents',
      urlBase: '/documents',
      service: {
        async list(): Promise<ServerDocumentDto[]> {
          // The backend answers with a Laravel resource collection
          // (`{ data: [...] }`); `extractListRows` unwraps it.
          const response = await documentService.getDocuments()
          return extractListRows(response, 'documents') as ServerDocumentDto[]
        },
      },
      fromServer: ({ server }) => {
        // C-3 (pre-merge review): strip the `{ document: {...} }` wrapper.
        return toDocumentItem({ server })
      },
      hooks: buildHooks(),
    })

    registerReconciler({
      tableName: 'documents',
      reconciler: async ({ tempId, server }) => {
        // C-3 / C-4 (pre-merge review): strip the `{ document: {...} }`
        // wrapper; otherwise the row lands in Dexie under `document.*`
        // and Pinia consumers never see the flat fields.
        const response = server as
          | { id?: number | string; document?: Record<string, unknown> }
          | Record<string, unknown>
          | undefined
        const inner =
          response && typeof response === 'object' && 'document' in response
            ? ((response as { document: Record<string, unknown> }).document)
            : (response as Record<string, unknown> | undefined) ?? {}
        const id =
          typeof inner.id === 'number' || typeof inner.id === 'string'
            ? (inner.id as number | string)
            : typeof (response as { id?: number | string } | undefined)?.id === 'number' ||
                typeof (response as { id?: number | string } | undefined)?.id === 'string'
              ? ((response as { id: number | string }).id)
              : undefined
        if (typeof id !== 'number' && typeof id !== 'string') return

        const local = await db.documents.get(tempId)
        const merged = { ...local, ...inner, id } as unknown as DocumentRecord
        if (local) {
          await db.documents.delete(tempId)
          await db.documents.put(merged)
        }
        const store = useDocumentStore()
        const temp = store.documents.findIndex((d) => String(d.id) === tempId)
        if (temp !== -1) {
          store.removeDocument({ id: tempId as string })
          store.addDocument({ document: merged as DocumentItem })
          store.markSynced({ at: Date.now() })
        }
        // H-2 (pre-merge review): drain pending mutations stashed
        // against the tempId (see repository.ts). The drain lives OUTSIDE
        // the store block on purpose: a row deleted while its create was
        // still pending is already gone from the store, and that pending
        // delete still has to reach the server.
        const pending = getPendingMutations(tempId)
        if (pending.length > 0) {
          clearPendingMutations(tempId)
          for (const m of pending) {
            if (m.kind === 'update') {
              await getRepository().update({ id, patch: m.patch })
            } else {
              await getRepository().remove({ id })
            }
          }
        }
      },
    })
  }
  return repositorySingleton
}

export class DocumentController {
  private get store(): ReturnType<typeof useDocumentStore> {
    return useDocumentStore()
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

  async loadDocuments(): Promise<void> {
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

  async createDocument(params: {
    title: string
    type?: string
    content?: string
  }): Promise<{ id: string | number }> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id } = await getRepository().create({
        record: {
          title: params.title,
          type: (params.type as DocumentItem['type']) ?? 'note',
          content: params.content,
          user_id: 0,
        },
      })
      return { id }
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateDocument(params: {
    id: number | string
    title?: string
    type?: string
    content?: string
    order?: number
    elements?: unknown
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id, ...rest } = params
      const patch: Partial<DocumentItem> = {}
      if (rest.title !== undefined) patch.title = rest.title
      if (rest.type !== undefined) patch.type = rest.type as DocumentItem['type']
      if (rest.content !== undefined) patch.content = rest.content
      if (rest.order !== undefined) patch.order = rest.order
      if (rest.elements !== undefined) (patch as { elements?: unknown }).elements = rest.elements
      await getRepository().update({ id, patch })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteDocument(params: { id: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await getRepository().remove({ id: params.id })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  // --- Local-only helpers (kept for callers that need them) -------------

  getUserDocuments(): DocumentItem[] | undefined {
    return this.store.documents
  }

  getUserDocument(params: { documentId: string }): DocumentItem | undefined {
    return this.store.getDocument({ elementSearch: params.documentId })
  }

  // --- In-memory element helpers (notes live inside documents) ----------

  removeElement(params: { index: number | string; documentId: string }): void {
    const idx = Number(params.index)
    const doc = this.store.documents.find((d) => String(d.id) === params.documentId)
    if (doc && doc.elements) {
      const elements = [...doc.elements]
      elements.splice(idx, 1)
      this.store.updateDocument({ id: doc.id as number, updates: { elements } })
    }
  }

  insertElement(params: { documentId: string; element: DocumentElement }): void {
    const doc = this.store.documents.find((d) => String(d.id) === params.documentId)
    if (doc) {
      const elements = doc.elements ? [...doc.elements] : []
      elements.push(params.element)
      this.store.updateDocument({ id: doc.id as number, updates: { elements } })
    }
  }

  updateNoteValue(params: { data: { value: string }; index: number | string; documentId: string }): void {
    const idx = Number(params.index)
    const doc = this.store.getDocument({ elementSearch: params.documentId })
    if (doc && doc.elements && doc.elements[idx]) {
      const elements = [...(doc.elements as DocumentElement[])]
      elements[idx] = { ...elements[idx], data: params.data }
      this.store.updateDocument({ id: doc.id as number, updates: { elements } })
      void this.updateDocument({ id: doc.id as number, elements })
    }
  }

  updateNoteReminder(params: { data: { dateStart: string; dateEnd: string }; index: number | string; documentId: string }): void {
    const idx = Number(params.index)
    const doc = this.store.getDocument({ elementSearch: params.documentId })
    if (doc && doc.elements && doc.elements[idx]) {
      const elements = [...(doc.elements as DocumentElement[])]
      elements[idx] = { ...elements[idx], reminders: params.data }
      this.store.updateDocument({ id: doc.id as number, updates: { elements } })
      void this.updateDocument({ id: doc.id as number, elements })
    }
  }

  // --- Local-only persistence (writes through Dexie + outbox) -----------

  /** Persists element changes locally; mirrors the in-memory store update. */
  async persistElementsLocally(params: {
    documentId: number
    elements: unknown
  }): Promise<void> {
    const updateFields: Partial<DocumentRecord> = {
      elements: params.elements as DocumentRecord['elements'],
    }
    await db.documents.update(params.documentId, toPlainData(updateFields))
  }
}
