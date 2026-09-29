# LBDS-231 — Capa global offline-first (Server ⇄ Pinia ⇄ Dexie + outbox)

Ticket: LBDS-231 (Linear, proyecto LifeLine, team LBDS).
Rama: `dowardev/lbds-231-global-offline-first-data-layer-serverpiniadexie-outbox`
MR: draft en https://gitlab.com/dowardev/lifeline/-/merge_requests/42

## Alcance de este ticket

Estandarizar el flujo **Server ⇄ Pinia ⇄ Dexie** en todos los dominios del frontend
(events, tasks, documents, notes, calendars, auth, tags, external), agregando:

- **Outbox persistente** para writes offline con sync on reconnect.
- **Shared composable** para external data (LBDS-224) que elimine las duplicate requests
  entre `CalendarPage` / `CalendarWidget` y los widgets de `HomePage`.
- **Auto-resolución de conflictos** por `updated_at` (LWW).
- **Documentación del patrón** (parte del acceptance).

Todo sync es del lado del cliente; **no se toca el backend**.

## Decisiones de diseño

- **Outbox persistente en Dexie** (sobrevive a refresh + cierre de app). Sigue el patrón
  de oneSpend (LBDS-244 / LBDS-276).
- **Outbox global** (una sola cola para todos los dominios). Evita order issues entre
  entidades, simplifica el processor.
- **Sync cursor `last_sync` y conflict store en `db.config`** (la tabla `config` ya existe
  con primary key `name`; perfecto para estos key-value sin tocar el schema).
- **Dexie version 3** (nueva tabla `outbox`). Migration aditiva que no rompe data existente.
- **Conflict strategy**: auto-resolución por `updated_at` (LWW). El tier 2/3 de oneSpend
  (semantic overlap, manual resolution UI) queda **fuera de scope** de este ticket y se
  propone como follow-up (LBDS-238).
- **Auth**: NO requiere outbox (no se encola login), sí requiere persistencia de la sesión
  (cached token + user funcionan offline).
- **External data**: shared composable único que sirve a `CalendarPage`, `CalendarWidget`
  y los widgets de HomePage. Cachea en Dexie (`external_events`, `external_contacts`,
  `external_tasks`) con TTL corto controlado por `useExternalSync`.

## Tabla de tareas

| # | Tarea | Evidencia |
|---|---|---|
| T1 | Dexie schema v3: nueva tabla `outbox` + tablas `external_events`, `external_contacts`, `external_tasks` | migración + tests de schema |
| T2 | `composables/useOnlineStatus.ts` (`navigator.onLine` + eventos online/offline) | unit tests |
| T3 | `db/outbox.ts`: `enqueue`, `peek`, `markDone`, `markFailed`, `markRetry`, `applyBackoff`, `bulkDelete`, `count` | unit tests |
| T4 | `db/repository.ts`: `createRepository<T>` con `fetchAll`, `create`, `update`, `remove`, `queueSync` | unit tests |
| T5 | `db/outboxProcessor.ts`: singleton con sync lock, flush on online event, backoff automático, reconnect hook | unit tests |
| T6 | `db/conflictStore.ts`: persist en `db.config`, `add`, `getAll`, `clear`, `resolveByLww` | unit tests |
| T7 | Migrar `eventController` a `createRepository` (acceptance criteria del ticket) | tests + verificación manual |
| T8 | Migrar `taskController` a `createRepository` | tests + verificación manual |
| T9 | Migrar `documentController` a `createRepository` | tests + verificación manual |
| T10 | Migrar `noteController` a `createRepository` | tests + verificación manual |
| T11 | Migrar `calendarController` (CRUD simple) | tests + verificación manual |
| T12 | Migrar `tagController` a `createRepository` | tests + verificación manual |
| T13 | Persistencia offline de auth (cached session + user funcionan sin red); sin outbox | tests |
| T14 | `externalEventStore` / `externalContactStore` / `externalTaskStore` + Dexie cache | tests |
| T15 | Refactor `useExternalSync` + shared composable para servir a `CalendarPage`, `CalendarWidget` y widgets Home | tests + verificación de "sin duplicate requests" |
| T16 | `docs/data-layer.md`: patrón documentado (server calls, Pinia shape, Dexie schema, outbox, cómo migrar un dominio nuevo) | archivo |
| T17 | Tests integration: write offline → reconnect → sync → verify (events end-to-end) | tests |

## Unidades de trabajo (commits)

- **U1 — Base layer (T1-T6)** — `feat(data-layer): repository, outbox, online status, conflict store`
- **U2 — Events (T7) + external (T14-T15)** — `feat(data-layer): migrate events + external data through repository`
- **U3 — Tasks (T8) + documents (T9)** — `feat(data-layer): migrate tasks and documents`
- **U4 — Notes (T10) + calendars (T11) + tags (T12) + auth (T13)** — `feat(data-layer): migrate remaining domains`
- **U5 — Docs (T16) + integration test (T17)** — `docs(data-layer): pattern documentation + integration test`

## Notas de reconocimiento

- **Stores existentes** (10): auth, calendar, document, event, note, tag, task, theme,
  wakaTime, widget.
- **Controllers existentes** (14): auth, calendar, calendarSource, document, event,
  externalContacts, externalTasks, note, reminder, system, tag, task, theme, wakaTime.
- **Dexie actual** (v2): events, users, usersLogged, tokens, config, tasks, documents, notes.
- **`db/config`** ya existe con PK `name` (perfecto para `last_sync` cursor + conflict store).
- **HTTP layer**: wrapper sobre SSO HttpClient (`apiClient.ts`), soporta guest mode con
  `X-Guest-Id`. Si SSO no disponible, throw explícito → fallback a Dexie.
- **External sync actual**: `useExternalSync` es singleton con TTL 10min, no escribe a Dexie
  ni a stores — `CalendarPage` y `CalendarWidget` cargan por separado (duplicate requests).
- **Auth actual**: SSO callback flow (`AuthCallbackPage.vue`), `authService` con token.
- **Reference para patrón maduro**: `oneSpend/front/src/services/sync/` (LBDS-244, LBDS-276).
- **Constraint**: ionic/Capacitor puede tener clock skew → el sync cursor debe ser monotónico
  (como `advanceLastSyncMonotonic` en oneSpend).
- **No tocar backend**: el ticket es frontend-only. Endpoints Laravel existentes se mantienen.

## Estado

- [x] Gate In-Progress (webhook movió el ticket, no el agente)
- [x] Rama + MR draft creados
- [x] Plan de tasks armado
- [ ] U1 base layer
- [ ] U2 events + external
- [ ] U3 tasks + documents
- [ ] U4 notes + calendars + tags + auth
- [ ] U5 docs + integration test
- [ ] Review pre-merge + triage

## Follow-up tickets propuestos

- **LBDS-232**: migrar `calendarSourceController` (CRUD de sources externos)
- **LBDS-238**: conflict resolution UI completa (tier 2/3 de oneSpend, semantic overlap +
  manual resolution)
- **LBDS-239**: backend conflict detector (PHP) si se quiere field-level overlap detection
