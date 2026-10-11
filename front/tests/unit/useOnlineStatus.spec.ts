// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useOnlineStatus,
  getIsOnline,
  __resetOnlineStatusForTests,
} from '@/composables/useOnlineStatus'

/**
 * LBDS-231 — `useOnlineStatus` is the single source of truth that the outbox
 * processor reads to decide when to drain the queue. The composable must:
 *  - reflect `navigator.onLine` on init,
 *  - flip on the `online`/`offline` window events,
 *  - share one ref across every consumer.
 *
 * jsdom exposes `navigator.onLine = true` by default and lets tests dispatch
 * the events directly; we re-define the property between cases to force a
 * deterministic starting state.
 */

function setNavigatorOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

function dispatch(name: 'online' | 'offline'): void {
  window.dispatchEvent(new Event(name))
}

describe('useOnlineStatus (LBDS-231)', () => {
  beforeEach(() => {
    setNavigatorOnline(true)
    __resetOnlineStatusForTests()
  })

  afterEach(() => {
    __resetOnlineStatusForTests()
  })

  it('starts as online when navigator reports online', () => {
    setNavigatorOnline(true)
    __resetOnlineStatusForTests()
    const { isOnline } = useOnlineStatus()
    expect(isOnline.value).toBe(true)
    expect(getIsOnline()).toBe(true)
  })

  it('starts as offline when navigator reports offline', () => {
    setNavigatorOnline(false)
    __resetOnlineStatusForTests()
    const { isOnline } = useOnlineStatus()
    expect(isOnline.value).toBe(false)
    expect(getIsOnline()).toBe(false)
  })

  it('flips to false when the window fires the `offline` event', () => {
    const { isOnline } = useOnlineStatus()
    expect(isOnline.value).toBe(true)
    dispatch('offline')
    expect(isOnline.value).toBe(false)
    expect(getIsOnline()).toBe(false)
  })

  it('flips back to true when the window fires the `online` event', () => {
    setNavigatorOnline(false)
    __resetOnlineStatusForTests()
    const { isOnline } = useOnlineStatus()
    expect(isOnline.value).toBe(false)
    dispatch('online')
    expect(isOnline.value).toBe(true)
    expect(getIsOnline()).toBe(true)
  })

  it('shares the same ref between every consumer (single source of truth)', () => {
    const a = useOnlineStatus()
    const b = useOnlineStatus()
    expect(a.isOnline).toBe(b.isOnline)
    dispatch('offline')
    expect(b.isOnline.value).toBe(false)
    dispatch('online')
    expect(a.isOnline.value).toBe(true)
  })

  it('installs the window listeners exactly once even when called repeatedly', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    useOnlineStatus()
    useOnlineStatus()
    useOnlineStatus()
    const onlineCalls = addSpy.mock.calls.filter(([name]) => name === 'online')
    const offlineCalls = addSpy.mock.calls.filter(([name]) => name === 'offline')
    expect(onlineCalls).toHaveLength(1)
    expect(offlineCalls).toHaveLength(1)
    addSpy.mockRestore()
  })

  it('picks up navigator.onLine on reset even after listeners fired', () => {
    const { isOnline } = useOnlineStatus()
    dispatch('offline')
    expect(isOnline.value).toBe(false)
    // After a reset the next consumer re-reads navigator; the test
    // verifies that the reset hook re-syncs without manual mutation.
    setNavigatorOnline(true)
    __resetOnlineStatusForTests()
    const { isOnline: fresh } = useOnlineStatus()
    expect(fresh.value).toBe(true)
  })
})
