// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import * as outbox from './outbox'
import { db } from './index'
import { apiClient } from '@/services/apiClient'
import { getIsOnline, useOnlineStatus } from '@/composables/useOnlineStatus'
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * LBDS-231 — outbox processor.
 *
 * Drains the `outbox` table when the device is online. Each row carries the
 * HTTP method + URL + payload that produced it, so a replay is a pure
 * re-execution of the original mutation. The processor also reconciles the
 * tempId (used by the optimistic create) with the real server id the
 * response carries, so Dexie and Pinia both end up holding the canonical
 * row keyed by the server id.
 *
 * Triggers (lifecycle):
 *  - app launch (`useOutboxProcessor` calls `flush` once on mount)
 *  - `online` window event (handled by `useOnlineStatus`)
 *  - `visibilitychange` to `visible` (web/WebView resume)
 *  - a soft 30s interval while the app is in the foreground
 *
 * Concurrency: a single in-flight `flush` Promise collapses concurrent
 * callers (see `useExternalSync` for the same idiom in LifeLine).
 */

/** Async fn that takes a `tempId` + server response and reconciles state. */
export type Reconciler = (params: {
  tempId: string
  server: unknown
}) => Promise<void>

const reconcilers = new Map<string, Reconciler>()

/**
 * Registers the reconciler for one domain. The repository for that domain
 * should call this once on module load. Subsequent calls with the same
 * `tableName` overwrite the previous registration.
 */
export function registerReconciler(params: {
  tableName: string
  reconciler: Reconciler
}): void {
  reconcilers.set(params.tableName, params.reconciler)
}

/** Test-only: clears every registered reconciler. */
export function __clearReconcilersForTests(): void {
  reconcilers.clear()
}

/** Status of the last flush attempt. Surfaced for tests + UI badges. */
export type FlushStatus = 'idle' | 'flushing' | 'success' | 'error'
const flushStatus: Ref<FlushStatus> = ref('idle')
const lastErrorMessage: Ref<string | null> = ref(null)

export function getFlushStatus(): { status: Ref<FlushStatus>; lastError: Ref<string | null> } {
  return { status: flushStatus, lastError: lastErrorMessage }
}

// --- Sync lock -----------------------------------------------------------

let inFlight: Promise<void> | null = null
let timer: ReturnType<typeof setInterval> | null = null

/**
 * Flushes every actionable outbox row. Concurrent callers share the same
 * in-flight Promise. Returns when the queue is fully drained (or has hit
 * the network/transport error for the current attempt).
 *
 * Each row's outcome:
 *  - 2xx → markDone + delete the row on the next pass.
 *  - 401 / 403 → markFailed (no retry — re-login required).
 *  - 404 on DELETE → markDone (idempotent: the row is already gone).
 *  - any other error → markRetry (backoff in `db/outbox.ts`).
 */
export async function flush(): Promise<void> {
  if (inFlight) return inFlight
  if (!getIsOnline()) return

  flushStatus.value = 'flushing'
  lastErrorMessage.value = null
  inFlight = (async (): Promise<void> => {
    try {
      const rows = await outbox.peek()
      if (rows.length === 0) {
        flushStatus.value = 'idle'
        return
      }

      const done: number[] = []
      for (const row of rows) {
        try {
          const response = await runRow(row)
          await applySuccess({ row, response })
          done.push(row.id!)
        } catch (error) {
          const handledId = await applyFailure({ row, error })
          if (handledId !== null) done.push(handledId)
          // Stop draining on the first auth failure; the rest will retry
          // after the user re-logs in. Avoids burning attempts while we
          // know the token is bad.
          const message = error instanceof Error ? error.message : String(error)
          if (isAuthError(message)) {
            break
          }
        }
      }

      await outbox.bulkDelete({ ids: done })
      flushStatus.value = 'error'
      if (done.length === rows.length) flushStatus.value = 'success'
    } catch (error) {
      flushStatus.value = 'error'
      lastErrorMessage.value =
        error instanceof Error ? error.message : String(error)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/**
 * Replays one row through the HTTP layer. Returns the parsed server
 * response (used by `applySuccess` for create reconciliations).
 */
async function runRow(row: import('./schema').OutboxRecord): Promise<unknown> {
  switch (row.method) {
    case 'POST':
      return apiClient.executeMutation({ url: row.url, data: row.payload, method: 'POST' })
    case 'PUT':
      return apiClient.executeMutation({ url: row.url, data: row.payload, method: 'PUT' })
    case 'DELETE':
      return apiClient.executeDelete({ url: row.url })
    default: {
      const exhaustive: never = row.method
      throw new Error(`unsupported method: ${String(exhaustive)}`)
    }
  }
}

/**
 * Reconciles Dexie + Pinia with the server's response after a successful
 * mutation, then marks the row done.
 */
async function applySuccess(params: {
  row: import('./schema').OutboxRecord
  response: unknown
}): Promise<void> {
  const { row, response } = params

  if (row.op === 'create') {
    const reconciler = reconcilers.get(row.entityType)
    if (reconciler) {
      await reconciler({ tempId: String(row.entityId), server: response })
    }
  } else if (row.op === 'update' && response && typeof response === 'object') {
    // Server returned the updated row — mirror it so Pinia/Dexie hold the
    // authoritative post-update state, not just the optimistic patch.
    const serverId = pickId(response)
    if (serverId !== undefined) {
      const existing = await db.table(row.entityType).get(row.entityId as number)
      if (existing) {
        await db.table(row.entityType).put({
          ...(response as Record<string, unknown>),
          id: serverId,
        })
      }
      void serverId
    }
  }

  await outbox.markDone({ id: row.id! })
}

async function applyFailure(params: {
  row: import('./schema').OutboxRecord
  error: unknown
}): Promise<number | null> {
  const { row, error } = params
  const message = error instanceof Error ? error.message : String(error)
  if (isAuthError(message)) {
    await outbox.markFailed({ id: row.id!, error: message })
    return null
  }
  // 404 on DELETE means the server already lost the row (or it never
  // existed there). Treating that as success keeps the queue bounded
  // and lets the caller bulkDelete the row on the same pass.
  if (row.op === 'delete' && isNotFound(message)) {
    await outbox.markDone({ id: row.id! })
    return row.id!
  }
  await outbox.markRetry({ id: row.id!, error: message })
  return null
}

function isAuthError(message: string): boolean {
  return /401|403|unauthori[sz]ed|forbidden/i.test(message)
}

function isNotFound(message: string): boolean {
  return /404|not\s*found/i.test(message)
}

function pickId(response: unknown): string | number | undefined {
  if (!response || typeof response !== 'object') return undefined
  const r = response as { id?: unknown }
  if (typeof r.id === 'number' || typeof r.id === 'string') return r.id
  // The backend wraps created records as `{ event: { id, ... } }`,
  // `{ task: { id, ... } }`, etc. Try the obvious singular keys.
  for (const key of Object.keys(r)) {
    const inner = (r as Record<string, unknown>)[key]
    if (inner && typeof inner === 'object') {
      const id = (inner as { id?: unknown }).id
      if (typeof id === 'number' || typeof id === 'string') return id
    }
  }
  return undefined
}

// --- Vue integration -----------------------------------------------------

/**
 * App-level composable: wires `flush` to the lifecycle events that signal
 * "the user might want to sync now". Idempotent and safe to call once from
 * the root component.
 */
export function useOutboxProcessor(): void {
  // Ensure the online watcher is attached so `flush` re-runs on reconnect.
  useOnlineStatus()

  let onVisibility: (() => void) | null = null
  let onOnline: (() => void) | null = null
  let disposed = false

  function scheduleFlush(): void {
    if (disposed) return
    void flush()
  }

  onMounted(() => {
    scheduleFlush()

    onVisibility = (): void => {
      if (document.visibilityState === 'visible') scheduleFlush()
    }
    document.addEventListener('visibilitychange', onVisibility)

    onOnline = (): void => scheduleFlush()
    window.addEventListener('online', onOnline)

    // Soft interval keeps the queue warm even when the OS keeps the app
    // alive but does not deliver lifecycle events (e.g. background tab on
    // desktop). 30s is short enough that a parked `retrying` row with the
    // smallest backoff (30s) re-attempts promptly when connectivity returns.
    timer = setInterval(scheduleFlush, 30_000)
  })

  onUnmounted(() => {
    disposed = true
    if (onVisibility) document.removeEventListener('visibilitychange', onVisibility)
    if (onOnline) window.removeEventListener('online', onOnline)
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })
}
