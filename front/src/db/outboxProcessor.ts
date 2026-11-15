// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import * as outbox from './outbox'
import { db } from './index'
// `isTempId` is imported dynamically below to avoid a static cycle
// (`repository.ts` dynamically imports this module from `hintProcessor`).
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
          const message = error instanceof Error ? error.message : String(error)
          const handledId = await applyFailure({ row, error })
          if (handledId !== null) done.push(handledId)
          // Stop draining on the first auth failure; the rest will retry
          // after the user re-logs in. Avoids burning attempts while we
          // know the token is bad.
          if (isAuthError(error, message)) {
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

/** Test-only: surfaces the actionable row count without running the flush. */
export async function peekCount(): Promise<number> {
  return outbox.count()
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
    // C-2 (pre-merge review): the repository.update() path skips enqueueing
    // when the id is a tempId, so this defensive guard is belt-and-braces,
    // but it keeps the processor safe if that invariant is ever broken.
    // `isTempId` is checked via inline shape because importing
    // `./repository` statically would create a cycle (repository dynamic-
    // imports this module from its `hintProcessor`).
    const entityIdIsTemp = typeof row.entityId === 'string' && row.entityId.startsWith('tmp-')
    if (
      serverId !== undefined &&
      !entityIdIsTemp
    ) {
      // C-3 (pre-merge review): unwrap the `{ event/task/document/note: {...} }`
      // wrapper before spreading, otherwise Dexie would store the row under
      // a wrapper key and the next read would not find the domain fields.
      const raw = response as Record<string, unknown>
      const wrapperKey = Object.keys(raw).find(
        (k) => k !== 'id' && raw[k] && typeof raw[k] === 'object',
      )
      const inner = wrapperKey
        ? (raw[wrapperKey] as Record<string, unknown>)
        : raw
      const existing = await db.table(row.entityType).get(row.entityId as number)
      if (existing) {
        await db.table(row.entityType).put({
          ...inner,
          id: serverId,
        })
      }
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
  if (isAuthError(error, message)) {
    // A 401/403 means the SSO session is gone or expired, not that the
    // mutation is wrong. Parking the row in `failed` dropped the offline
    // change for good (nothing revived those rows), so only the changes
    // made while online reached the server. The session can be restored,
    // so the row goes back to the queue with a backoff and is replayed on
    // the next flush (the SSO client renews the token meanwhile).
    await outbox.markRetry({ id: row.id!, error: message })
    return null
  }
  // 404 on DELETE means the server already lost the row (or it never
  // existed there). Treating that as success keeps the queue bounded
  // and lets the caller bulkDelete the row on the same pass.
  if (row.op === 'delete' && isNotFound(error, message)) {
    await outbox.markDone({ id: row.id! })
    return row.id!
  }
  await outbox.markRetry({ id: row.id!, error: message })
  return null
}

// H-5 / H-8 (pre-merge review): prefer the structured `cause.status`
// from the apiClient (set in `services/apiClient.ts`). Falling back to
// the regex keeps the old message-shape path working for callers that
// throw plain errors.
function statusFromError(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'cause' in error) {
    const cause = (error as { cause?: { status?: number } }).cause
    if (cause && typeof cause.status === 'number') return cause.status
  }
  return undefined
}

function isAuthError(error: unknown, message: string): boolean {
  const status = statusFromError(error)
  if (status === 401 || status === 403) return true
  return /401|403/i.test(message)
}

function isNotFound(error: unknown, message: string): boolean {
  const status = statusFromError(error)
  if (status === 404) return true
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
