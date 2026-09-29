// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { ref, type Ref } from 'vue'

/**
 * Module-level reactive flag: `true` when the device reports connectivity,
 * `false` otherwise. The flag is a single source of truth shared by every
 * consumer (composables, controllers, the outbox processor) so a single
 * `online`/`offline` event flips the value everywhere at once.
 *
 * `navigator.onLine` is a coarse heuristic — the browser only knows whether
 * the network interface is up. It does NOT know whether the backend is
 * reachable. The outbox processor treats every server error as a signal to
 * re-enqueue with backoff regardless of this flag, so a stale `true` only
 * delays a sync by one attempt.
 */
const isOnline: Ref<boolean> = ref(
  typeof navigator !== 'undefined' ? navigator.onLine : true,
)

let initialized = false

function readNavigatorOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

function handleOnline(): void {
  isOnline.value = true
}

function handleOffline(): void {
  isOnline.value = false
}

/**
 * Wire the `online`/`offline` window events to the shared ref. Idempotent
 * so calling it from multiple components or from `App.vue` is harmless.
 */
function init(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  // Re-sync from navigator once, in case the module loaded after the page
  // already missed the initial event (e.g. service worker resumed us).
  isOnline.value = readNavigatorOnline()
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}

/**
 * Vue composable that returns the shared reactive `isOnline` ref and
 * guarantees the window listeners are attached. Safe to call from any
 * component — the watcher is installed once.
 */
export function useOnlineStatus(): { isOnline: Ref<boolean> } {
  init()
  return { isOnline }
}

/**
 * Non-reactive accessor for code paths that cannot afford the cost of a
 * Vue ref read (e.g. inside Dexie write transactions, the outbox processor
 * hot path). Returns the last known value as a plain boolean.
 */
export function getIsOnline(): boolean {
  return isOnline.value
}

/**
 * Resets module state. Test-only — lets each test start from a clean
 * navigator state without leaking listeners between cases.
 */
export function __resetOnlineStatusForTests(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
  initialized = false
  isOnline.value = readNavigatorOnline()
}
