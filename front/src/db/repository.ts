// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import type { Ref } from 'vue'
import { db } from './index'
import * as outbox from './outbox'
import { getIsOnline } from '@/composables/useOnlineStatus'

/**
 * LBDS-231 — generic repository that every domain (events, tasks,
 * documents, notes, calendars, tags) follows. The repository owns three
 * things:
 *
 * 1. **Mirror writes**: an enqueued mutation also reflects the change on
 *    the local Dexie row and on the in-memory Pinia store so the UI is
 *    always consistent with the optimistic write.
 * 2. **Server reads**: `fetchAll` reads from the server when online and
 *    mirrors into Dexie; when offline it returns the Dexie rows the
 *    processor has accumulated.
 * 3. **Mutation routing**: every mutation goes through the outbox so a
 *    single replay path handles online and offline writes uniformly.
 *
 * The actual HTTP replay and id reconciliation happens in
 * `db/outboxProcessor.ts`; the repository only enqueues.
 */

/** Hooks the repository calls to keep the Pinia store in sync. */
export interface RepositoryHooks<R> {
  /** Replace the entire list of items in the store. */
  setItems(params: { items: R[] }): void
  /** Add a single item (optimistic create). */
  addItem(params: { item: R }): void
  /** Patch a single item by id (optimistic update). */
  patchItem(params: { id: string | number; patch: Partial<R> }): void
  /** Remove a single item by id (optimistic delete). */
  removeItem(params: { id: string | number }): void
}

/** Backend-agnostic service the repository talks to for reads. */
export interface RepositoryService<T> {
  list(): Promise<T[]>
}

/** Configuration for `createRepository`. */
export interface RepositoryConfig<T, R extends { id?: string | number }> {
  /** Dexie table name (`'events'`, `'tasks'`, ...). */
  tableName: string
  /** Path prefix the outbox uses to build the per-row URL (`/events`). */
  urlBase: string
  /** Backend service used by `fetchAll`. */
  service: RepositoryService<T>
  /** Map a server DTO into the local record shape stored in Dexie/Pinia. */
  fromServer(params: { server: T }): R
  /** Pinia hooks for the optimistic updates. */
  hooks: RepositoryHooks<R>
}

export interface Repository<R extends { id?: string | number }> {
  /** List rows from server (online) or Dexie (offline); mirrors into both. */
  fetchAll(): Promise<R[]>
  /** Optimistically create + enqueue. Returns the id used in the local row. */
  create(params: { record: Partial<R> }): Promise<{ id: string | number }>
  /** Optimistically patch + enqueue. */
  update(params: { id: string | number; patch: Partial<R> }): Promise<void>
  /** Optimistically remove + enqueue. */
  remove(params: { id: string | number }): Promise<void>
}

function newTempId(): string {
  // Prefer crypto.randomUUID when available (modern browsers, secure
  // contexts); fall back to a Math.random hex string otherwise.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `tmp-${crypto.randomUUID()}`
  }
  return `tmp-${Math.random().toString(16).slice(2, 10)}-${Date.now().toString(16)}`
}

function buildUrl(urlBase: string, id: string | number | undefined): string {
  if (id === undefined || id === null || id === '') return urlBase
  // tempId (string) is only used locally; the processor replaces it with
  // the real server id before the mutation is sent. We still need a stable
  // URL for the row, so the create op keeps the base path.
  if (typeof id === 'string' && id.startsWith('tmp-')) return urlBase
  return `${urlBase}/${id}`
}

/**
 * Build a repository bound to a single domain table. See the file header
 * for the contract; the returned object exposes the four operations every
 * domain needs plus `fetchAll`.
 */
export function createRepository<T, R extends { id?: string | number }>(
  config: RepositoryConfig<T, R>,
): Repository<R> {
  const { tableName, urlBase, service, hooks, fromServer } = config

  async function mirrorServer(params: { serverRows: T[] }): Promise<R[]> {
    const rows = params.serverRows.map((server) => fromServer({ server }))
    await db.table(tableName).bulkPut(rows)
    hooks.setItems({ items: rows })
    return rows
  }

  return {
    async fetchAll(): Promise<R[]> {
      if (getIsOnline()) {
        try {
          const serverRows = await service.list()
          return await mirrorServer({ serverRows })
        } catch {
          // Server unreachable: fall back to Dexie so the UI still has data.
          const local = await db.table<R>(tableName).toArray()
          hooks.setItems({ items: local })
          return local
        }
      }
      const local = await db.table<R>(tableName).toArray()
      hooks.setItems({ items: local })
      return local
    },

    async create(params): Promise<{ id: string | number }> {
      const tempId = newTempId()
      const optimistic: R = {
        ...(params.record as R),
        id: tempId,
      }
      // Optimistic mirror: Dexie first (source of truth for offline reads),
      // then Pinia so the UI updates on the next tick.
      await db.table(tableName).put(optimistic)
      hooks.addItem({ item: optimistic })

      await outbox.enqueue({
        entityType: tableName,
        entityId: tempId,
        op: 'create',
        url: buildUrl(urlBase, tempId),
        method: 'POST',
        payload: { ...params.record } as Record<string, unknown>,
      })

      return { id: tempId }
    },

    async update(params): Promise<void> {
      const { id, patch } = params
      const current = await db.table<R>(tableName).get(id as R['id'] & string)
      if (current) {
        await db.table(tableName).put({ ...current, ...patch } as R)
      }
      hooks.patchItem({ id, patch })

      await outbox.enqueue({
        entityType: tableName,
        entityId: id,
        op: 'update',
        url: buildUrl(urlBase, id),
        method: 'PUT',
        payload: { ...patch } as Record<string, unknown>,
      })
    },

    async remove(params): Promise<void> {
      const { id } = params
      await db.table(tableName).delete(id)
      hooks.removeItem({ id })

      await outbox.enqueue({
        entityType: tableName,
        entityId: id,
        op: 'delete',
        url: buildUrl(urlBase, id),
        method: 'DELETE',
      })
    },
  }
}

// `Ref` re-export keeps the public API of the data layer in one place for
// callers that need to type their own reactive holders alongside a
// repository.
export type { Ref }
