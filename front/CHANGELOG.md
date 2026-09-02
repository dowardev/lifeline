# Changelog

All notable changes to the LifeLine frontend (`front/`) are documented in this file.
The overall project roadmap and releases live in the repository-root `CHANGELOG.md`,
which is the authoritative record for the monorepo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Centralize reminder scheduling/cancellation in a single `ReminderController` and a single source of truth for offset codes/terminology (`utils/reminders.ts`), replacing duplicated/inconsistent label dictionaries — LBDS-211
- Persist scheduled local-notification ids (`id_reminders`) through the store, Dexie schema and API for cross-device cancellation — LBDS-211
- Wire event reminder scheduling into the calendar flows (CalendarPage + CalendarWidget) and persist returned notification ids — LBDS-211
- Guest invitation emails on event create/update (authenticated flow) including the inviter email — LBDS-211
- Unit tests for the centralized reminder controller and offset utilities (vitest) — LBDS-211

### Changed
- Rewrite `ReminderController` to a single public surface (`schedule*Reminders` / `cancel*Reminders`) with repeat expansion (bounded, weekly day selection + frequency honored), offset math (date-fns), cancel-then-schedule and batch-unique notification ids — LBDS-211
- Replace legacy offset codes (`just`/`5mb`/`1hb`/…/`1mb`) with a canonical vocabulary (`at_time`, `5m`…`1mo`) plus a migrate-on-touch legacy map; option lists now derive from `REMINDER_OFFSETS` — LBDS-211
- Keep event/task creation and edits working in anonymous (offline-first) mode with local Dexie persistence, while authenticated flows persist to the server — LBDS-211
- Reminder option lists in the events/tasks RemindersComponents derive from the single module and carry `id_reminders` — LBDS-211

### Fixed
- Fix the event form save button never enabling (Vuelidate `timeZone` rule key vs `timezone` field mismatch) — LBDS-211
- Fix Ionic inputs using `$event.target.value` instead of `$event.detail.value` (name, description, availability, guest email, repeat frequency, timezone search) so form values bind correctly — LBDS-211
- Fix editing an event/task not restoring reminders/repeat and duplicating anonymous task edits (cancel old + update instead of always creating) — LBDS-211
- Request notification permission synchronously within the user gesture (before network awaits) so Capacitor/Chrome accept it — LBDS-211
- Load events on first HomePage widget mount so events show without visiting the Calendar view — LBDS-211
- Add guests reliably on event edit (`getEventById`/`selectedEventData` parse stored JSON guest list) — LBDS-211
- Respect `frecuency` for weekly repeats ("Cada N semanas") and prevent notification-id collisions across controller instances — LBDS-211

### Changed
- Harden and centralize the timezone list (feature guard + fallback for `Intl.supportedValuesOf`) and group the timezone picker by region in collapsible `ion-accordion`s with lazy/cached UTC offsets (non-regional zones reachable via search) — LBDS-206

### Fixed
- Fix event reminder popover crashing on open (Temporal Dead Zone on `startDate`/`endDate` in `RemindersComponent`) — LBDS-206
- Split the shared event reminders popover into dedicated popovers (Tiempo / Notificaciones / Repetir) and replace the `<ion-textarea>` read-only display with `ion-item`/`ion-label` rows — LBDS-206
- Clear the timezone search on popover close so it reopens showing the full grouped list — LBDS-206