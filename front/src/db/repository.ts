// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import type { Ref } from 'vue'
import { db } from './index'
import * as outbox from './outbox'
import { getIsOnline } from '@/composables/useOnlineStatus'

/**
 * H-2 (pre-merge review): when `update()` or `remove()` is called on a
 * row that still has a tempId (i.e. the create that produced it is
 * queued but not yet reconciled), we cannot enqueue the mutation
 * against the server because we have no server id yet. The old code
 * dropped it silently. Instead we stash the mutation in this map;
 * the reconciler drains it after the create succeeds, re-enqueuing
 * each one with the real server id. If the create fails permanently
 * the entries sit in this map until the user resolves the row
 * manually (out of scope here).
 */
export type PendingMutation<R> =
  | { kind: 'update'; patch: Partial<R> }
  | { kind: 'delete' }

const pendingMutations = new Map<string, Array<PendingMutation<unknown>>>()

export function getPendingMutations<R = unknown>(tempId: string): Array<PendingMutation<R>> {
  return (pendingMutations.get(tempId) ?? []) as Array<PendingMutation<R>>
}

export function clearPendingMutations(tempId: string): void {
  pendingMutations.delete(tempId)
}

function recordPendingMutation(tempId: string, mutation: PendingMutation<unknown>): void {
  const list = pendingMutations.get(tempId) ?? []
  list.push(mutation)
  pendingMutations.set(tempId, list)
}

/**
 * Best-effort hint to the outbox processor that a new row is ready. The
 * processor already has a 30s interval + lifecycle triggers, but in this
 * app most writes happen in response to a user tap and we want the round-
 * trip to start immediately. We dynamic-import the processor to avoid a
 * static circular dependency between `repository.ts` and
 * `outboxProcessor.ts`. The `flush()` call is a no-op when offline or
 * already in flight, so calling it from every write is safe.
 */
function hintProcessor(): void {
  void import('./outboxProcessor')
    .then((m) => m.flush())
    .catch(() => {
      // Processor module not loaded yet (or environment missing); the
      // interval / lifecycle events will still pick the row up.
    })
}

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
 * True for ids that are still client-side placeholders waiting for the
 * server-assigned id from a successful POST. Updates against these rows
 * would otherwise hit a 405: `PUT /events` (no id) instead of
 * `PUT /events/{serverId}`.
 */
export function isTempId(id: string | number | undefined): boolean {
  return typeof id === 'string' && id.startsWith('tmp-')
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
      hintProcessor()

      return { id: tempId }
    },

    async update(params): Promise<void> {
      const { id, patch } = params
      // H-2 (pre-merge review): the create is still pending. Apply
      // the patch to the local mirror so the UI stays in sync, and
      // stash the mutation in the pending map so the reconciler
      // re-enqueues it with the real server id after the create
      // round-trips. If the create fails permanently the row sits
      // in `failed` and the user can re-apply the change by hand.
      if (isTempId(id)) {
        recordPendingMutation(String(id), { kind: 'update', patch: patch as Record<string, unknown> })
        const current = await db.table<R>(tableName).get(id as R['id'] & string)
        if (current) {
          await db.table(tableName).put({ ...current, ...patch } as R)
        }
        hooks.patchItem({ id, patch })
        return
      }
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
      hintProcessor()
    },

    async remove(params): Promise<void> {
      const { id } = params
      if (isTempId(id)) {
        // H-2 (pre-merge review): stash the delete in the pending map;
        // the reconciler drops the row locally AND enqueues the DELETE
        // against the real server id once the create round-trips.
        recordPendingMutation(String(id), { kind: 'delete' })
        await db.table(tableName).delete(id)
        hooks.removeItem({ id })
        return
      }
      await db.table(tableName).delete(id)
      hooks.removeItem({ id })

      await outbox.enqueue({
        entityType: tableName,
        entityId: id,
        op: 'delete',
        url: buildUrl(urlBase, id),
        method: 'DELETE',
      })
      hintProcessor()
    },
  }
}

// `Ref` re-export keeps the public API of the data layer in one place for
// callers that need to type their own reactive holders alongside a
// repository.
export type { Ref }
