# LBDS-268 — Fase 1: captura de recordatorios externos + scheduling local

Ticket: LBDS-268 (Linear, proyecto LifeLine, team LBDS).
Rama: `dowardev/lbds-268-push-notifications-for-external-reminders-fcm-unifiedpush`
MR: !37 (draft) — https://gitlab.com/dowardev/lifeline/-/merge_requests/37

## Alcance de esta fase (decision del usuario)

Puntos **1 y 2** del ticket:

1. Captura de recordatorios externos: parsear `VALARM` (ICS/CalDAV VEVENT + VTODO) y los
   reminders de Google Calendar; persistir en `external_events` / `external_tasks`; exponer por API.
2. Scheduling en el cliente: en cada sync, programar/cancelar notificaciones locales para los
   recordatorios externos, reutilizando `ReminderController` y `LocalNotifications`.

Puntos **3-6** (deteccion de transporte FCM/UnifiedPush, eleccion de usuario, seccion Settings,
envio server + `device_tokens`) quedan **fuera** de esta fase: dependen del scheduler server-side
que el propio ticket declara fuera de alcance, y no son verificables sin credenciales FCM ni
plugin nativo.

## Modelo de datos (decision de diseno)

Una sola verdad persistida por fila externa:

- `reminder_offsets_seconds` (json, nullable): enteros = **segundos antes** del ancla
  (`date_start` en eventos, `due_at` en tareas). Orden descendente. Puede ser negativo
  (recordatorio despues del inicio). Tope 10.

Los codigos canonicos (`at_time`, `5m`, … `1w`) se derivan **en lectura** (no se persisten) con
`ReminderOffsets::codeForSeconds()`; `1mo` no tiene segundos fijos, por lo que nunca se deriva.
Esto evita el redondeo destructivo: un `TRIGGER:-PT45M` se conserva como 2700 s y sigue disparando.

## Tareas

| # | Tarea | Evidencia |
|---|---|---|
| T1 | Migracion: `reminder_offsets_seconds` json nullable en `external_events` y `external_tasks` | migracion + `migrate` OK |
| T2 | `ReminderOffsets::codeForSeconds()` (derivacion solo para offsets de segundos fijos) + tests | unit tests |
| T3 | `ExternalReminderParser`: VALARM → segundos antes del ancla (ACTION:DISPLAY; RELATED START/END; TRIGGER duracion o DATE-TIME absoluto) | unit tests |
| T4 | Wiring del parser en `CalendarSyncService` (VEVENT upsert + VTODO) y reminders de Google en `GoogleCalendarService::listEvents` | feature tests |
| T5 | Exponer recordatorios en `ExternalEventController::index` y `::tasks` (segundos + codigos derivados) | feature test de API |
| T6 | Frontend: `reminder_offsets_seconds` en `ExternalEventDto` / `ExternalCalendarEvent` | tipos |
| T7 | Frontend: scheduler de recordatorios externos + hook en `useExternalSync` (ids deterministas, cancelacion de items desaparecidos) | unit tests |
| T8 | Frontend: tests de scheduling, cancelacion y degradacion sin permiso / sin recordatorios | vitest |
| T9 | Review pre-merge del diff + triage de hallazgos introducidos | reporte |

## Unidades de trabajo (commits)

- **U1 (backend, T1-T5)** — `feat(external-reminders): capture VALARM and Google reminders`
- **U2 (frontend, T6-T8)** — `feat(external-reminders): schedule local notifications for external reminders on sync`

T9 no commitea: es review + triage.

## Notas de reconocimiento

- `ExternalEvent` / `ExternalTask` no tienen campos de recordatorio. Cero apariciones de `VALARM` en `back/app`.
- `CalendarSyncService::upsert()` (VEVENT) y `syncCaldavTasks()` (VTODO) son los dos puntos de parseo ICS.
- `GoogleCalendarService::listEvents()` es donde entran `reminders.overrides` de Google.
- La API de Google Tasks **no expone recordatorios** → las tareas Google quedan sin offsets (documentado).
- `front/` no consume `external-tasks`: el scheduling cliente de Fase 1 cubre solo eventos externos.
- `ReminderController` ya programa/cancela `LocalNotifications`; `useExternalSync.runExternalSync()` es el hook natural post-sync.
- Identidad de coleccion externa: `calendar_source_id` + `collection_href` + `external_uid`.

## Estado

- [x] Gate In-Progress (webhook movio el ticket, no el agente)
- [ ] U1 backend
- [ ] U2 frontend
- [ ] T9 review + triage
