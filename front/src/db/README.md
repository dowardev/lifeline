# Data layer — offline-first pattern

**Status**: implemented under `LBDS-231` (merge request draft on `main`).
**Audience**: anyone adding a new domain or extending an existing one.
**Path note**: this document lives next to the code (`front/src/db/`)
because the repo's root `docs/` is in `.gitignore`.

LifeLine's frontend used to mix three ad-hoc strategies (Dexie, in-memory
Pinia, page-local HTTP refs) depending on which controller wrote the code.
External data lived outside the system, Agenda and widgets hit the server
twice for the same payload, and a reload with no network lost unsynced
edits. This document describes the single pattern every domain now follows
and the building blocks that make it work.

## Mental model

```
        ┌───────────────────────────┐
        │  Server (Laravel backend) │
        └─────────────┬─────────────┘
                      │  HTTP (apiClient.executeQuery/Mutation/Delete)
                      ▼
        ┌───────────────────────────┐
        │  outbox (Dexie table)     │  ← every write goes through here
        └─────────────┬─────────────┘
                      │  drain on online / visibility / 30s tick
                      ▼
        ┌───────────────────────────┐
        │  Dexie (per-domain table) │  ← authoritative mirror for offline
        └─────────────┬─────────────┘
                      │  hooks.setItems / addItem / patchItem / removeItem
                      ▼
        ┌───────────────────────────┐
        │  Pinia store (in memory)  │  ← what Vue components subscribe to
        └───────────────────────────┘
```

A read (`fetchAll`) is the only thing that contacts the server directly.
A write always lands on Dexie + Pinia first (optimistic), then on the
outbox; the outbox processor replays it through `apiClient` whenever the
device is online.

## Building blocks

| Module | Responsibility |
|---|---|
| `front/src/db/schema.ts` | Dexie class + per-table record interfaces. Versioned. |
| `front/src/db/repository.ts` | `createRepository<T>({ tableName, urlBase, service, fromServer, hooks })` |
| `front/src/db/outbox.ts` | `enqueue`, `peek`, `markDone`, `markRetry`, `markFailed`, `bulkDelete` |
| `front/src/db/outboxProcessor.ts` | Singleton that drains the outbox + reconciler registry |
| `front/src/db/conflictStore.ts` | Persistent log of conflicts the processor could not auto-resolve |
| `front/src/composables/useOnlineStatus.ts` | Shared `isOnline` ref, no duplicate `online`/`offline` listeners |
| `front/src/composables/useExternalSync.ts` | Shared composable for external data (Google/CalDAV/ICS) |

### Outbox (Dexie v3, additive)

The `outbox` table is the only thing the migration added in v3. The rest
of the schema is unchanged. Each row is a complete replay:

```ts
interface OutboxRecord {
  entityType: string                // 'events' | 'tasks' | ...
  entityId: string | number         // server id, or `tmp-<uuid>` for create
  op: 'create' | 'update' | 'delete'
  url: string                       // '/events/42'
  method: 'POST' | 'PUT' | 'DELETE'
  payload?: Record<string, unknown>
  status: 'pending' | 'retrying' | 'done' | 'failed'
  attempts: number                  // grows with backoff
  createdAt: number
  updatedAt: number
  nextRetryAt?: number              // set when status === 'retrying'
  lastError?: string
}
```

Backoff schedule (in seconds): `30 / 60 / 120 / 300 / 900 / 1800 / 3600 / 3600`.
After 8 attempts the row is parked in `failed` and the UI exposes it
through `outbox.listFailed()` (consumed by `LBDS-238` conflict UI).

### Repository

`createRepository<T, R>` is the seam between the controller and the
offline-first machinery. `T` is the server DTO shape, `R` is the local
row shape (what Dexie + Pinia store). `fromServer` does the DTO → row
mapping; mappers that pass the server payload through unchanged
(`({ server }) => ({ ...server })`) cover the common case.

```ts
const repository = createRepository<ServerDto, EventItem>({
  tableName: 'events',
  urlBase: '/events',
  service: { async list() { return eventService.getEvents() } },
  fromServer: ({ server }) => ({ ...server }),
  hooks: {
    setItems: ({ items }) => store.setEvents({ events: items }),
    addItem: ({ item }) => store.addEvent({ event: item }),
    patchItem: ({ id, patch }) => store.updateEvent({ id, updates: patch }),
    removeItem: ({ id }) => store.removeEvent({ id }),
  },
})
```

The repository returns:

- `fetchAll()` → reads server if online, falls back to Dexie if offline or
  if the server throws. Always mirrors into Pinia through the hooks.
- `create({ record })` → assigns a `tmp-<uuid>` id, optimistic put on
  Dexie + Pinia, then enqueues `op='create'`.
- `update({ id, patch })` → optimistic patch + enqueue.
- `remove({ id })` → optimistic delete + enqueue.

### Reconciler

`create` enqueues with a temporary client-generated id. When the server
responds with the canonical id, the row in Dexie and the entry in Pinia
still hold the tempId, so the rest of the app would point at a phantom.
Each domain registers a reconciler that knows how to swap the tempId for
the canonical id after a successful POST:

```ts
registerReconciler({
  tableName: 'events',
  reconciler: async ({ tempId, server }) => {
    const id = (server as { id?: number }).id
    if (typeof id !== 'number') return
    const local = await db.events.get(tempId)
    if (local) {
      await db.events.delete(tempId)
      await db.events.put({ ...(server as Record<string, unknown>), id })
    }
    // also rewrite the Pinia entry...
  },
})
```

The reconciler is registered from the controller module the first time
`createRepository` is called for that table, so it survives reloads
without any extra wiring.

### External data (LBDS-224)

External data does not own any of the user's edits (the source does), so
the outbox is not involved. `useExternalSync` is a shared composable that:

1. Triggers a sync of every active calendar source (TTL-gated, single
   in-flight).
2. Reads `/external-events`, `/external-contacts`, `/external-tasks`
   exactly once each, mirrors into Dexie, and pushes the rows into the
   three Pinia stores (`useExternalEventStore`, `useExternalContactStore`,
   `useExternalTaskStore`).
3. On launch, hydrates the stores from Dexie so the UI never starts empty.

Every consumer (CalendarPage, CalendarWidget, ExternalTaskListComponent,
...) reads from the stores. There is no second HTTP round-trip.

### Auth

`authStore` persists the local profile in `localStorage` and the SSO token
in `db.tokens` (plus a fallback copy in `localStorage` for `jsdom` /
private-mode browsers). `restoreCachedAuth()` rehydrates the cached
session on launch so a relaunch with no network still lands logged in.
Auth does not use the outbox: there is nothing to enqueue while offline
(the user has to be online to start a session), and a 401 on a queued
write parks the row in `failed` instead of looping forever.

### Conflict resolution

Tier 1 only (this ticket). `conflictStore.resolveByLww` compares
`updated_at` (seconds or milliseconds, both accepted) and picks the
newer side. Tiers 2-3 from the `oneSpend` reference (semantic-overlap
detection, manual resolution UI) are intentionally deferred to
`LBDS-238` — the schema and the persisted conflict list are already in
place to receive them.

## How to migrate a new domain

1. **Schema**: add the table to `front/src/db/schema.ts` with a new
   `this.version(N).stores({ ... })` block. Never edit previous versions.
2. **Store**: extend the existing Pinia store with `setItems / addItem /
   patchItem / removeItem` if it does not already have them (every domain
   store follows this contract).
3. **Service**: keep the existing `xxxService` module. The repository
   consumes `list` only; the outbox processor handles `create / update /
   delete` through `apiClient.executeMutation / executeDelete`.
4. **Controller**: replace the hand-rolled "read Dexie → fetch → set
   store → bulkPut" block with `repository.fetchAll()`. Replace every
   `service.createX / updateX / deleteX` call with the corresponding
   repository method. Expose `useSync()` + `flushQueue()` so the App
   root can mount the processor.
5. **Reconciler**: register one if the domain creates new rows. The
   pattern in `eventController.ts` is the canonical example.
6. **Tests**: at minimum
   - `loadX` mirrors server rows into Dexie + Pinia (online and offline).
   - `createX` enqueues + optimistically adds when offline, reconciles
     after flush.
   - `updateX` / `removeX` enqueue the right method + url.
   See `tests/unit/eventRepository.spec.ts` and
   `tests/unit/taskDocumentRepository.spec.ts` for the shape.

## Conventions

- Every controller method takes a single `params` object (named parameters
  pattern). Never positional arguments.
- Public functions exported from a module are tested by importing the
  named binding, not the module default.
- Mocks in tests use `vi.mock('@/db', ...)` with a `get db()` getter so
  the singleton is replaced per test file. See
  `tests/unit/outbox.spec.ts` for the canonical pattern.
- New Dexie tables are additive; bump the version, declare only the new
  table (Dexie 4 keeps the older indexes from the previous `version(...)`
  calls).
- Lint: `pnpm exec oxlint <files>` + `pnpm exec eslint <files>` on the
  touched scope. `pnpm run lint` auto-fixes the whole tree and churns
  unrelated files; do not run it.

## What this layer does not do

- It does not touch the backend. Conflict resolution, `/api/sync/*`,
  field-hash detection, etc. are LBDS-239 territory.
- It does not provide a UI for failed-outbox rows yet. `LBDS-238`
  consumes `outbox.listFailed()` + `conflictStore.getAll()`.
- It does not implement the tier-2/3 conflict strategies. The hooks
  (`resolveByLww`) are in place but only tier-1 ships today.
