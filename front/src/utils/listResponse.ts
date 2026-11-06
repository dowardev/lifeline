// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Unwraps a list response coming from the backend.
 *
 * The list endpoints answer with a Laravel resource collection:
 *
 *   EventResource::collection($events)  ->  { data: [...], links: {...}, meta: {...} }
 *
 * `apiClient.executeQuery` returns the parsed body as-is, so the data
 * layer has to unwrap the `data` envelope BEFORE mirroring the rows.
 * When it does not, the repository mirrors zero rows and empties the
 * Pinia store of that domain: the calendar still shows events (it falls
 * back to Dexie) but every consumer that reads the store (the edit
 * modal, for one) gets nothing.
 *
 * Three shapes are accepted, in this order:
 *
 *   1. a bare array                      -> the rows
 *   2. `{ data: [...] }`                 -> the Laravel resource collection
 *   3. `{ <legacyKey>: [...] }`          -> the per-domain envelope the
 *                                           backend used before the
 *                                           resource collections
 */
export function extractListRows(response: unknown, legacyKey: string): unknown[] {
  if (Array.isArray(response)) return response
  if (!response || typeof response !== 'object') return []
  const body = response as Record<string, unknown>
  if (Array.isArray(body.data)) return body.data
  const legacy = body[legacyKey]
  return Array.isArray(legacy) ? legacy : []
}
