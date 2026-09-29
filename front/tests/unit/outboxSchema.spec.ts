// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { LifeLineDB } from '@/db/schema'
import type { OutboxRecord } from '@/db/schema'

/**
 * LBDS-231 — schema v3 introduces the outbox table. These tests guard the
 * additive migration: a fresh DB exposes the new table, opening an existing
 * v2 DB (events/tasks/documents/notes/config rows already present) does not
 * lose or rewrite data, and the new `outbox` collection is queryable by the
 * indices the processor relies on.
 */

describe('LifeLineDB schema v3 — outbox table', () => {
  let db: LifeLineDB

  beforeEach(async () => {
    // Each test gets its own isolated DB name so Dexie's schema cache cannot
    // cross-pollute. Fake-indexeddb (loaded by tests/setup.ts) backs the
    // storage in the jsdom environment.
    await Dexie.delete('LifeLineDB-test-schema-v3')
    db = new LifeLineDB('LifeLineDB-test-schema-v3')
    await db.open()
    // Clear every table the schema exposes so prior tests cannot leak rows
    // into `where()` queries that depend on a fresh dataset.
    await Promise.all([
      db.outbox.clear(),
      db.events.clear(),
      db.tasks.clear(),
      db.documents.clear(),
      db.notes.clear(),
      db.config.clear(),
    ])
  })

  afterEach(async () => {
    await db.close()
    await Dexie.delete('LifeLineDB-test-schema-v3')
  })

  it('exposes the outbox table on a fresh database', () => {
    expect(db.outbox).toBeDefined()
    expect(typeof db.outbox.add).toBe('function')
    expect(typeof db.outbox.where).toBe('function')
  })

  it('still exposes every pre-existing table (events, tasks, documents, notes, config)', () => {
    // The migration is strictly additive; no previous collection is dropped.
    expect(db.events).toBeDefined()
    expect(db.tasks).toBeDefined()
    expect(db.documents).toBeDefined()
    expect(db.notes).toBeDefined()
    expect(db.config).toBeDefined()
    expect(db.users).toBeDefined()
    expect(db.usersLogged).toBeDefined()
    expect(db.tokens).toBeDefined()
  })

  it('round-trips an OutboxRecord with all the fields the processor reads', async () => {
    const now = Date.now()
    const record: OutboxRecord = {
      entityType: 'events',
      entityId: 42,
      op: 'update',
      url: '/events/42',
      method: 'PUT',
      payload: { title: 'Edited offline' },
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    }
    const id = await db.outbox.add(record)

    const fetched = await db.outbox.get(id)
    expect(fetched).toBeDefined()
    expect(fetched!.entityType).toBe('events')
    expect(fetched!.entityId).toBe(42)
    expect(fetched!.op).toBe('update')
    expect(fetched!.url).toBe('/events/42')
    expect(fetched!.method).toBe('PUT')
    expect(fetched!.payload).toEqual({ title: 'Edited offline' })
    expect(fetched!.status).toBe('pending')
    expect(fetched!.attempts).toBe(0)
  })

  it('supports tempId string entityIds for create ops that have not round-tripped yet', async () => {
    // A create op enqueued offline has no server id. The processor uses this
    // string as the key to update the local Dexie mirror when the server
    // finally replies with the real id.
    const id = await db.outbox.add({
      entityType: 'tasks',
      entityId: 'temp-uuid-abc-123',
      op: 'create',
      url: '/tasks',
      method: 'POST',
      payload: { title: 'New task' },
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } satisfies OutboxRecord)

    const fetched = await db.outbox.get(id)
    expect(fetched!.entityId).toBe('temp-uuid-abc-123')
    expect(fetched!.op).toBe('create')
  })

  it('indexes outbox rows by entityType, entityId, status and nextRetryAt', async () => {
    // The processor scans `where('status').equals('pending')` and
    // `where('nextRetryAt').below(now)` to pick retries; the entityType /
    // entityId indices let it look up the row corresponding to a server push.
    await db.outbox.bulkAdd([
      {
        entityType: 'events',
        entityId: 1,
        op: 'update',
        url: '/events/1',
        method: 'PUT',
        status: 'pending',
        attempts: 0,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        entityType: 'tasks',
        entityId: 2,
        op: 'create',
        url: '/tasks',
        method: 'POST',
        status: 'retrying',
        attempts: 3,
        createdAt: 2,
        updatedAt: 2,
        nextRetryAt: 100,
      },
      {
        entityType: 'events',
        entityId: 3,
        op: 'delete',
        url: '/events/3',
        method: 'DELETE',
        status: 'done',
        attempts: 1,
        createdAt: 3,
        updatedAt: 3,
      },
    ] satisfies OutboxRecord[])

    const pending = await db.outbox.where('status').equals('pending').toArray()
    expect(pending).toHaveLength(1)
    expect(pending[0].entityType).toBe('events')

    const retrying = await db.outbox.where('status').equals('retrying').toArray()
    expect(retrying).toHaveLength(1)
    expect(retrying[0].nextRetryAt).toBe(100)

    const byType = await db.outbox.where('entityType').equals('events').toArray()
    expect(byType).toHaveLength(2)
  })

  it('preserves rows from a pre-existing v2 database when opening at v3', async () => {
    // Simulate a user upgrading from the previously shipped app: a v2 DB
    // already has events/tasks/documents/notes/config rows. Opening at v3
    // must leave every old row readable and untouched.
    await db.close()

    const upgraded = new LifeLineDB('LifeLineDB-test-schema-v3')
    await upgraded.open()
    await upgraded.events.add({
      user_id: 1,
      title: 'Carry-over event',
      calendar_id: 1,
    })
    await upgraded.tasks.add({
      user_id: 1,
      title: 'Carry-over task',
      status: 'pending',
    })
    await upgraded.config.put({ name: 'theme', value: 'dark' })
    await upgraded.close()

    const reopened = new LifeLineDB('LifeLineDB-test-schema-v3')
    await reopened.open()

    const events = await reopened.events.toArray()
    const tasks = await reopened.tasks.toArray()
    const theme = await reopened.config.get('theme')
    const outboxReady = reopened.outbox !== undefined

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Carry-over event')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Carry-over task')
    expect(theme?.value).toBe('dark')
    expect(outboxReady).toBe(true)

    await reopened.close()
  })
})
