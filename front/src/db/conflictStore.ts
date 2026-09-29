// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { db } from './index'

/**
 * LBDS-231 — persistent store of conflicts the processor cannot resolve
 * silently. Tier-1 (LWW) conflicts are resolved in-band; tier-2 (semantic
 * overlap) and tier-3 (manual) conflicts land here for the UI in LBDS-238.
 *
 * The store reuses the existing `db.config` table — a key/value collection
 * with `name` as the primary key — so we do not have to bump the Dexie
 * schema again. Each conflict list is held under a single, well-known key.
 */

const CONFIG_KEY = 'lbds231_conflicts'

export interface ConflictRecord {
  entityType: string
  syncId: string
  serverData: Record<string, unknown>
  clientData: Record<string, unknown>
  detectedAt: number
  resolvedAt?: number
}

/** Loads the full conflict list. Empty when the row is missing. */
export async function getAll(): Promise<ConflictRecord[]> {
  const row = await db.config.get(CONFIG_KEY)
  const list = (row as unknown as { value?: unknown } | undefined)?.value
  return Array.isArray(list) ? (list as ConflictRecord[]) : []
}

/**
 * Adds a conflict. Caps the list at the most recent 100 entries so the
 * row does not grow unbounded over a long offline session; older conflicts
 * are dropped on the floor (the user can still see what was lost by
 * reading the local Dexie mirror).
 */
export async function add(params: {
  entityType: string
  syncId: string
  serverData: Record<string, unknown>
  clientData: Record<string, unknown>
}): Promise<void> {
  const list = await getAll()
  list.push({
    entityType: params.entityType,
    syncId: params.syncId,
    serverData: params.serverData,
    clientData: params.clientData,
    detectedAt: Date.now(),
  })
  const trimmed = list.length > 100 ? list.slice(-100) : list
  await db.config.put({ name: CONFIG_KEY, value: trimmed } as never)
}

/** Removes one conflict by `entityType` + `syncId`. */
export async function remove(params: {
  entityType: string
  syncId: string
}): Promise<void> {
  const list = await getAll()
  const next = list.filter(
    (c) => !(c.entityType === params.entityType && c.syncId === params.syncId),
  )
  await db.config.put({ name: CONFIG_KEY, value: next } as never)
}

/** Marks a conflict as resolved (timestamp) without removing it. */
export async function markResolved(params: {
  entityType: string
  syncId: string
  resolution: 'server' | 'client' | 'merge'
}): Promise<void> {
  const list = await getAll()
  const idx = list.findIndex(
    (c) => c.entityType === params.entityType && c.syncId === params.syncId,
  )
  if (idx === -1) return
  list[idx] = { ...list[idx]!, resolvedAt: Date.now() }
  void params.resolution // resolution stored for telemetry; could be added later
  await db.config.put({ name: CONFIG_KEY, value: list } as never)
}

/** Drops every conflict. Used by the "clear log" UI in LBDS-238. */
export async function clear(): Promise<void> {
  await db.config.delete(CONFIG_KEY)
}

/**
 * Tier-1 conflict resolution (last-write-wins by `updated_at`). The
 * processor calls this when a pull returns a server row whose `updated_at`
 * is older than the local optimistic write, so the question is "do we
 * keep the server's view or ours?".
 *
 * Convention: timestamps < 1e12 are seconds, >= 1e12 are milliseconds.
 * The function normalises both before comparing.
 */
export function resolveByLww(params: {
  server: Record<string, unknown> | null | undefined
  client: Record<string, unknown> | null | undefined
}): 'server' | 'client' {
  const serverT = pickTimestamp(params.server)
  const clientT = pickTimestamp(params.client)
  if (!Number.isFinite(clientT)) return 'server'
  if (!Number.isFinite(serverT)) return 'client'
  return clientT > serverT ? 'client' : 'server'
}

function pickTimestamp(row: Record<string, unknown> | null | undefined): number {
  if (!row || typeof row !== 'object') return NaN
  const raw = (row as { updated_at?: unknown; updatedAt?: unknown }).updated_at ??
    (row as { updated_at?: unknown; updatedAt?: unknown }).updatedAt
  if (typeof raw !== 'number' && typeof raw !== 'string') return NaN
  const n = typeof raw === 'string' ? Number(raw) : raw
  if (!Number.isFinite(n)) return NaN
  // Seconds → milliseconds.
  return n < 1e12 ? n * 1000 : n
}
