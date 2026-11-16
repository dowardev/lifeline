// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import Dexie, { type EntityTable } from 'dexie'
import type { ServerRepeat } from '@/utils/repeat'

export interface EventRecord {
  // LBDS-231 - Dexie preserves the id it is given, so a row created
  // offline carries a tempId string ('tmp-<uuid>') until the reconciler
  // swaps it for the server id.
  id?: number | string
  user_id: number
  title: string
  // GitLab #2 - `null` means "this event has no calendar yet"; the key is
  // never present with an `undefined` value (GitLab #3).
  calendar_id: number | null
  date_start?: string
  date_end?: string
  notifications?: string
  // The server stores the repeat rule as an array (Laravel casts the
  // column to `array`); the app also writes the bare type string.
  repeat?: string | ServerRepeat
  time_zone?: string
  guests?: string
  description?: string
  availability?: string
  id_reminders?: number[]
}

export interface UserRecord {
  id?: number
  name: string
  user_name: string
  email: string
  image_profile?: string
}

export interface UserLoggedRecord {
  id?: number
  user: string
  token: string
}

export interface TokenRecord {
  id?: number
  user_id: number
  name: string
  token: string
}

export interface ConfigRecord {
  name: string
  value: string
}

export interface TaskRecord {
  id?: number
  user_id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority?: number
  due_date?: string
  subtasks?: string
  order?: number
  notifications?: string[]
  id_reminders?: number[]
}

export interface DocumentRecord {
  id?: number
  user_id: number
  title: string
  type: 'note' | 'list' | 'richtext' | 'todo'
  content?: string
  order?: number
  elements?: unknown
}

export interface NoteRecord {
  id?: number
  user_id: number
  document_id?: number
  title: string
  content?: string
  reminder?: string
  notifications?: string[]
  id_reminders?: number[]
}

/**
 * Outbox op queued while offline or retrying. The processor drains the queue
 * on reconnect, applies each mutation through the same service the controller
 * would use online, and moves the row to `done` or `retrying` with backoff.
 *
 * `entityId` is the server id when known, or a client-side tempId (string)
 * for create ops that have not yet round-tripped. The processor uses
 * `entityId` + `entityType` to update the local Dexie mirror on success.
 *
 * `url` + `method` + `payload` are stored verbatim so a retry is just a
 * replay — no controller-side state is needed to reconstruct the mutation.
 */
export type OutboxOp = 'create' | 'update' | 'delete'
export type OutboxStatus = 'pending' | 'retrying' | 'done' | 'failed'

export interface OutboxRecord {
  id?: number
  /** Domain of the mutation, e.g. 'events' | 'tasks' | 'documents'. */
  entityType: string
  /** Server id when known; tempId (string) for create ops not yet round-tripped. */
  entityId: string | number
  /** Operation kind. */
  op: OutboxOp
  /** Backend endpoint to call (relative to apiClient). */
  url: string
  /** HTTP method to use when replaying. */
  method: 'POST' | 'PUT' | 'DELETE'
  /** Body to send (omitted for DELETE). Stored as-is. */
  payload?: Record<string, unknown>
  /** Lifecycle state of this row. */
  status: OutboxStatus
  /** Number of attempts already made; backoff grows with this. */
  attempts: number
  /** Wall-clock timestamp of enqueue. */
  createdAt: number
  /** Last update (status change, retry tick). */
  updatedAt: number
  /** When to attempt next (ms epoch). Only meaningful when status === 'retrying'. */
  nextRetryAt?: number
  /** Last error message captured by the processor; cleared on success. */
  lastError?: string
}

/**
 * External data (LBDS-224) is read-only from the user's perspective: the
 * sources (Google / CalDAV / ICS) own the write side. We mirror whatever
 * the server last returned into Dexie so the calendar can render the
 * previous sync when offline, and we let the sync layer replace the rows
 * wholesale on each successful refresh.
 *
 * `key` is the stable composite id used everywhere in the UI
 * (`ext-<id>` for events, `ext-contact-<id>` for contacts, `ext-task-<id>`
 * for tasks). It is the primary key so a re-sync can do a `bulkPut` without
 * juggling autoincrement collisions.
 */
export interface ExternalEventRecord {
  key: string
  sourceId?: number
  sourceName: string
  sourceColor: string
  title: string
  dateStart?: string
  dateEnd?: string
  description?: string
  reminderOffsetsSeconds?: number[]
  /** Wall-clock timestamp of the last sync that wrote this row. */
  syncedAt: number
}

export interface ExternalContactRecord {
  key: string
  sourceId?: number
  sourceName: string
  displayName: string
  email: string
  phone: string
  syncedAt: number
}

export interface ExternalTaskRecord {
  key: string
  sourceId?: number
  sourceName: string
  title: string
  status?: string
  dueAt?: string
  description?: string
  reminderOffsetsSeconds?: number[]
  syncedAt: number
}

/**
 * Admin-defined tags (LBDS-231). Users can attach these to events but cannot
 * create new ones from the app. The list is read-heavy, write-light, and
 * small enough that we cache it locally instead of round-tripping every
 * time a tag picker opens.
 */
export interface AdminTagRecord {
  id: number
  name: string
}

export class LifeLineDB extends Dexie {
  events!: EntityTable<EventRecord, 'id'>
  users!: EntityTable<UserRecord, 'id'>
  usersLogged!: EntityTable<UserLoggedRecord, 'id'>
  tokens!: EntityTable<TokenRecord, 'id'>
  config!: EntityTable<ConfigRecord, 'name'>
  tasks!: EntityTable<TaskRecord, 'id'>
  documents!: EntityTable<DocumentRecord, 'id'>
  notes!: EntityTable<NoteRecord, 'id'>
  outbox!: EntityTable<OutboxRecord, 'id'>
  externalEvents!: EntityTable<ExternalEventRecord, 'key'>
  externalContacts!: EntityTable<ExternalContactRecord, 'key'>
  externalTasks!: EntityTable<ExternalTaskRecord, 'key'>
  adminTags!: EntityTable<AdminTagRecord, 'id'>

  constructor() {
    super('LifeLineDB')
    this.version(1).stores({
      events: '++id, user_id, title',
      users: '++id, email',
      usersLogged: '++id, user',
      tokens: '++id, user_id, name',
      config: '++id, name',
      tasks: '++id, user_id, title, status, due_date',
      documents: '++id, user_id, title, type',
      notes: '++id, user_id, document_id, title',
    })
    this.version(2).stores({
      config: 'name',
    })
    // LBDS-231: outbox table for queued mutations while offline or retrying.
    // Additive: existing rows in other tables are untouched.
    this.version(3).stores({
      outbox: '++id, entityType, entityId, status, nextRetryAt, createdAt',
    })
    // LBDS-231 v4: external data mirrors (read-only offline cache for
    // Google/CalDAV/ICS sources exposed via the shared composable).
    this.version(4).stores({
      externalEvents: 'key, sourceName, dateStart, syncedAt',
      externalContacts: 'key, sourceName, displayName, syncedAt',
      externalTasks: 'key, sourceName, dueAt, syncedAt',
    })
    // LBDS-231 v5: admin-defined tags cache. Read-only from the app's
    // perspective; the admin tools own the create/update/delete side.
    this.version(5).stores({
      adminTags: '++id, name',
    })
  }
}
