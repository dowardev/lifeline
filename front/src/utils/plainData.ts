// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Turns reactive payloads into plain, structured-cloneable data.
 *
 * Vue's `reactive()` returns a Proxy. IndexedDB's `put()` / `update()`
 * serialize their argument with the structured clone algorithm, and a
 * Proxy is NOT cloneable: the write fails with
 * `DataCloneError: [object Object] could not be cloned` and the row is
 * never persisted. Any component state that reaches the persistence
 * layer must be unwrapped first.
 *
 * The helper is deliberately dependency-free (no `vue` import): it
 * unwraps the `__v_raw` flag Vue puts on its reactive proxies.
 */

/** Vue's reactive proxies expose the raw target through this flag. */
const RAW_FLAG = '__v_raw'

function toPlainValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value

  const raw = (value as Record<string, unknown>)[RAW_FLAG]
  if (raw !== undefined && raw !== value) return toPlainValue(raw)

  if (Array.isArray(value)) return value.map(toPlainValue)

  const proto = Object.getPrototypeOf(value)
  // Dates, Maps, Sets and class instances are cloneable as they are.
  if (proto !== Object.prototype && proto !== null) return value

  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    out[key] = toPlainValue(item)
  }
  return out
}

/**
 * Returns a deep, plain copy of `value`, safe to persist in IndexedDB.
 * Non-plain objects (Date, Map, Set, class instances) are kept by
 * reference, exactly as the structured clone algorithm expects.
 */
export function toPlainData<T>(value: T): T {
  return toPlainValue(value) as T
}
