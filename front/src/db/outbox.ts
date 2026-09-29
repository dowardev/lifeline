// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { db } from './index'
import type { OutboxOp, OutboxRecord } from './schema'

/**
 * LBDS-231 — outbox queue for queued mutations while offline or retrying.
 *
 * Every public function takes a single `params` object (named-parameters
 * pattern required by the frontend conventions). The queue is a thin layer
 * over the `outbox` table; the processor (db/outboxProcessor.ts) owns the
 * flush loop and the actual HTTP replay.
 */

/** Maximum number of attempts before the row is parked in `failed`. */
export const MAX_ATTEMPTS = 8

/** Backoff schedule, in milliseconds, indexed by `attempts - 1`. */
const BACKOFF_MS: readonly number[] = [
  30_000, // attempt 1 failed: wait 30s
  60_000, // attempt 2 failed: wait 1m
  120_000, // attempt 3 failed: wait 2m
  300_000, // attempt 4 failed: wait 5m
  900_000, // attempt 5 failed: wait 15m
  1_800_000, // attempt 6 failed: wait 30m
  3_600_000, // attempt 7 failed: wait 1h
  3_600_000, // attempt 8 failed: wait 1h (cap)
]

/**
 * Returns the backoff delay for the attempt count passed in. Caps at the
 * last entry of the table; out-of-range attempts use the max delay so the
 * caller cannot accidentally retry instantly when something goes wrong.
 */
export function computeBackoffMs(params: { attempts: number }): number {
  const { attempts } = params
  if (attempts <= 0) return BACKOFF_MS[0]!
  const idx = Math.min(attempts - 1, BACKOFF_MS.length - 1)
  return BACKOFF_MS[idx]!
}

/**
 * Enqueues a mutation. Returns the row id assigned by Dexie. The caller is
 * responsible for reflecting the same op on the local Dexie mirror (the
 * repository does this with an optimistic update before enqueueing).
 */
export async function enqueue(params: {
  entityType: string
  entityId: string | number
  op: OutboxOp
  url: string
  method: 'POST' | 'PUT' | 'DELETE'
  payload?: Record<string, unknown>
}): Promise<number> {
  const { entityType, entityId, op, url, method, payload } = params
  const now = Date.now()
  return db.outbox.add({
    entityType,
    entityId,
    op,
    url,
    method,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  } satisfies OutboxRecord) as Promise<number>
}

/**
 * Returns every row that is still actionable by the processor (pending or
 * due-for-retry). Ordered by `createdAt` so the queue drains FIFO.
 */
export async function peek(params: { now?: number } = {}): Promise<OutboxRecord[]> {
  const now = params.now ?? Date.now()
  const pending = await db.outbox.where('status').equals('pending').toArray()
  const retrying = await db.outbox
    .where('status')
    .equals('retrying')
    .filter((row) => (row.nextRetryAt ?? 0) <= now)
    .toArray()
  return [...pending, ...retrying].sort((a, b) => a.createdAt - b.createdAt)
}

/** Returns the number of actionable rows. */
export async function count(params: { now?: number } = {}): Promise<number> {
  const rows = await peek({ now: params.now })
  return rows.length
}

/** Marks a row as successfully replayed. The processor bulkDeletes it next. */
export async function markDone(params: { id: number }): Promise<void> {
  const { id } = params
  await db.outbox.update(id, {
    status: 'done',
    updatedAt: Date.now(),
    lastError: undefined,
    nextRetryAt: undefined,
  })
}

/**
 * Records a transient failure and schedules the next retry via exponential
 * backoff. Once `attempts` reaches `MAX_ATTEMPTS` the row is parked in
 * `failed` instead of `retrying`, so a stuck mutation does not poison the
 * queue forever.
 */
export async function markRetry(params: { id: number; error: string }): Promise<void> {
  const { id, error } = params
  const current = await db.outbox.get(id)
  if (!current) return
  const attempts = current.attempts + 1
  if (attempts >= MAX_ATTEMPTS) {
    await db.outbox.update(id, {
      status: 'failed',
      attempts,
      updatedAt: Date.now(),
      lastError: error,
      nextRetryAt: undefined,
    })
    return
  }
  const delay = computeBackoffMs({ attempts })
  await db.outbox.update(id, {
    status: 'retrying',
    attempts,
    updatedAt: Date.now(),
    lastError: error,
    nextRetryAt: Date.now() + delay,
  })
}

/** Marks a row as terminally failed without further retry attempts. */
export async function markFailed(params: { id: number; error: string }): Promise<void> {
  const { id, error } = params
  await db.outbox.update(id, {
    status: 'failed',
    updatedAt: Date.now(),
    lastError: error,
    nextRetryAt: undefined,
  })
}

/** Resets a `failed` row back to `pending` so the processor picks it up. */
export async function revive(params: { id: number }): Promise<void> {
  const { id } = params
  await db.outbox.update(id, {
    status: 'pending',
    updatedAt: Date.now(),
    lastError: undefined,
    nextRetryAt: undefined,
  })
}

/** Bulk-deletes the given ids. Used by the processor to drop `done` rows. */
export async function bulkDelete(params: { ids: number[] }): Promise<void> {
  const { ids } = params
  if (ids.length === 0) return
  await db.outbox.bulkDelete(ids)
}

/** Clears every row in the queue. Test/maintenance helper — not for prod use. */
export async function clear(): Promise<void> {
  await db.outbox.clear()
}

/** Returns the rows parked in `failed`. Surfaced by the conflict UI (LBDS-238). */
export async function listFailed(): Promise<OutboxRecord[]> {
  return db.outbox.where('status').equals('failed').toArray()
}
