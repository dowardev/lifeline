// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-231 follow-up - event id lookups must be type insensitive.
 *
 * Offline-first rows carry a tempId string ('tmp-<uuid>') until the
 * reconciler swaps it for the server id, and FullCalendar always hands
 * ids back as strings. A strict `===` comparison therefore misses rows
 * that are actually there:
 *
 *   - `getEvent({ idEvent: '42' })` misses the numeric row 42
 *   - `updateEvent({ id: '42' })` silently updates nothing
 *
 * And the calendar click handler used to coerce the id with parseInt,
 * which turns a tempId into NaN, so the update modal received
 * `undefined` and rendered empty while offline.
 *
 * Coverage:
 *   - sameEntityId matches across the number/string boundary
 *   - resolveEntityId never coerces a tempId into NaN
 *   - the store's updateEvent applies the patch for a string id
 *   - the controller's getEvent finds the row for a string id
 *   - the controller's getEvent finds a not-yet-reconciled tempId row
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isServerOwnedId } from '@/utils/entityId'

vi.mock('@/db', () => {
  const emptyRows = async (): Promise<unknown[]> => [];
  const emptyTable = (): {
    clear: () => Promise<void>;
    toArray: () => Promise<unknown[]>;
  } => ({
    clear: async (): Promise<void> => {},
    toArray: emptyRows,
  });
  return {
    db: {
      events: { toArray: emptyRows },
      table: emptyTable,
    },
  };
})

const { sameEntityId, resolveEntityId } = await import('@/utils/entityId')
const { useEventStore } = await import('@/store/eventStore')
const { EventController } = await import('@/controllers/eventController')
const { setActivePinia, createPinia } = await import('pinia')

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('event id helpers', () => {
  it('matches the same id across the number/string boundary', () => {
    expect(sameEntityId(42, '42')).toBe(true)
    expect(sameEntityId('42', 42)).toBe(true)
    expect(sameEntityId('tmp-abc', 'tmp-abc')).toBe(true)
  })

  it('does not match different ids', () => {
    expect(sameEntityId(42, 'tmp-abc')).toBe(false)
    expect(sameEntityId(42, 43)).toBe(false)
    expect(sameEntityId(null, null)).toBe(false)
    expect(sameEntityId(undefined, '42')).toBe(false)
  })

  it('never coerces an id, so a tempId cannot become NaN', () => {
    expect(resolveEntityId('tmp-abc')).toBe('tmp-abc')
    expect(resolveEntityId('42')).toBe('42')
    expect(Number.isNaN(Number(resolveEntityId('tmp-abc')))).toBe(true)
    expect(resolveEntityId(42)).toBe(42)
  })
})

describe('eventStore.updateEvent - string id', () => {
  it('applies the patch when the caller passes the id as a string', () => {
    const store = useEventStore()
    store.addEvent({ event: { id: 42, title: 'Servidor', user_id: 1, calendar_id: 1 } })

    store.updateEvent({ id: '42', updates: { title: 'Renombrado' } })

    expect(store.events[0].title).toBe('Renombrado')
  })

  it('applies the patch when the caller passes a tempId', () => {
    const store = useEventStore()
    store.addEvent({ event: { id: 'tmp-abc', title: 'Local', user_id: 1, calendar_id: 1 } })

    store.updateEvent({ id: 'tmp-abc', updates: { title: 'Renombrado' } })

    expect(store.events[0].title).toBe('Renombrado')
  })
})

describe('EventController.getEvent - string id', () => {
  it('finds the row when the caller passes the id as a string', () => {
    const store = useEventStore()
    store.addEvent({ event: { id: 42, title: 'Servidor', user_id: 1, calendar_id: 1 } })
    const controller = new EventController()

    expect(controller.getEvent({ idEvent: '42' })?.title).toBe('Servidor')
  })

  it('finds a not-yet-reconciled tempId row', () => {
    const store = useEventStore()
    store.addEvent({ event: { id: 'tmp-abc', title: 'Local', user_id: 1, calendar_id: 1 } })
    const controller = new EventController()

    expect(controller.getEvent({ idEvent: 'tmp-abc' })?.title).toBe('Local')
  })
})

describe('isServerOwnedId', () => {
  it('un id numerico (o su forma string) pertenece al servidor', () => {
    expect(isServerOwnedId(42)).toBe(true)
    expect(isServerOwnedId('42')).toBe(true)
    expect(isServerOwnedId(0)).toBe(true)
  })

  it('un tempId NO pertenece al servidor', () => {
    expect(isServerOwnedId('tmp-abc')).toBe(false)
    expect(isServerOwnedId(-1)).toBe(false)
    expect(isServerOwnedId(null)).toBe(false)
    expect(isServerOwnedId(undefined)).toBe(false)
  })

  it('la sesion no participa: un id del servidor sigue siendo del servidor sin sesion', () => {
    // Sin sesion (authStore.isAnonymous) la mutacion igual debe encolarse:
    // si no, el cambio offline se queda solo en local y nunca llega.
    expect(isServerOwnedId('42')).toBe(true)
  })
})
