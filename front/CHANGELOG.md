# Changelog

All notable changes to the LifeLine frontend (`front/`) are documented in this file.
The overall project roadmap and releases live in the repository-root `CHANGELOG.md`,
which is the authoritative record for the monorepo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `scheduleEventReminders`, `scheduleTaskReminders`, `scheduleNoteReminders` and `syncExternalReminders` now enforce a 10-second minimum lead time on near-future fires so the Capacitor Android plugin no longer silently drops them via its `at < now` early-return — LBDS-268
- Local notification ids are now clamped to Java `int` range (max 2^31−1) so the `@capacitor/local-notifications` Android plugin no longer rejects them with "The identifier should be a Java int" — LBDS-268
- Declare `android.permission.USE_EXACT_ALARM` (API 33+, auto-granted) and `SCHEDULE_EXACT_ALARM` (API 31-32, user-granted) in the Android manifest so the Capacitor plugin uses `AlarmManager.setExact` instead of the inexact `set`, eliminating the seconds-to-minute OS-batching drift — LBDS-268
- Qualify `JvmTarget.JVM_21` to its fully-qualified `org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21` in `front/android/app/build.gradle` so the import-free reference resolves under the Kotlin Gradle DSL classpath — LBDS-268
- Bump `androidxCoreVersion` from the non-existent `1.16.1` to `1.17.0` in `front/android/variables.gradle` (1.16.1 was never published to Google Maven; 1.17.0 is) — LBDS-268

### Changed
- Fetch the HMAC-signed guest token once per page load from `GET calendar-sources/guest-token` and replay it as `X-Guest-Id` (response headers are invisible through the SSO HttpClient wrapper); bootstrap UUID kept for first contact — LBDS-230
- In anonymous (no SSO session) mode, disable the guest-invitation input in the event form and show a hint to sign in before inviting by email; visible guests stay listed but cannot be removed — LBDS-220

### Added
- First-class accounts panel in Settings (Cuentas, `/settings/accounts`) managing Google (OAuth) and CalDAV connections; old `/settings/calendar` and `/calendars` routes redirect — LBDS-266
- Tareas and Contactos sections in the connection modal with per-kind filtering, plus a personalized sync/discovery alert per section kind — LBDS-266
- One external-source sync per visible data surface (app launch, foreground return, entering the calendar page), gated by a 10-minute TTL so navigation cannot hammer providers — LBDS-266
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
- Google discovery no longer fails wholesale when one collection kind is refused: the kind is reported in the toast with its reason and activation link — LBDS-266
- Fix the event form save button never enabling (Vuelidate `timeZone` rule key vs `timezone` field mismatch) — LBDS-211
- Fix Refresh on Google ICS-URL connections (persisted as `type: 'ics'`, undiscoverable): non-OAuth connections skip `discoverCollections` and sync directly, with a `discovering` re-entrancy guard — LBDS-264
- Fix Ionic inputs using `$event.target.value` instead of `$event.detail.value` (name, description, availability, guest email, repeat frequency, timezone search) so form values bind correctly — LBDS-211
- Fix editing an event/task not restoring reminders/repeat and duplicating anonymous task edits (cancel old + update instead of always creating) — LBDS-211
- Request notification permission synchronously within the user gesture (before network awaits) so Capacitor/Chrome accept it — LBDS-211
- Load events on first HomePage widget mount so events show without visiting the Calendar view — LBDS-211
- Add guests reliably on event edit (`getEventById`/`selectedEventData` parse stored JSON guest list) — LBDS-211
- Respect `frecuency` for weekly repeats ("Cada N semanas") and prevent notification-id collisions across controller instances — LBDS-211

### Changed
- Harden and centralize the timezone list (feature guard + fallback for `Intl.supportedValuesOf`) and group the timezone picker by region in collapsible `ion-accordion`s with lazy/cached UTC offsets (non-regional zones reachable via search) — LBDS-206

### Fixed
- Google discovery no longer fails wholesale when one collection kind is refused: the kind is reported in the toast with its reason and activation link — LBDS-266
- Fix event reminder popover crashing on open (Temporal Dead Zone on `startDate`/`endDate` in `RemindersComponent`) — LBDS-206
- Split the shared event reminders popover into dedicated popovers (Tiempo / Notificaciones / Repetir) and replace the `<ion-textarea>` read-only display with `ion-item`/`ion-label` rows — LBDS-206
- Clear the timezone search on popover close so it reopens showing the full grouped list — LBDS-206

### Added
- Dedicated Contacts page (`/contacts`) listing synced Google People / CardDAV contacts with name/email/phone search and a read-only detail modal — LBDS-271
- Side-menu entry "Contactos" between Tareas and Documentos with the `peopleOutline` icon and locale-aware active state — LBDS-271
- Read-only external tasks section in `/tasks` (chip per source, due-date label, status text, lock + "Solo lectura" banner); local Dexie tasks stay fully editable — LBDS-271
- `externalContactService` reader for `GET /external-contacts` with the `ext-contact-<id>` key namespace, distinct from events (`ext-<id>`) and tasks (`ext-task-<id>`) — LBDS-271
- Thin `ExternalContactsController` and `ExternalTasksController` wrappers so pages do not call services directly — LBDS-271
- `useExternalSyncOnEnter` hook wired into `/contacts` and the external tasks section of `/tasks` (TTL 10 min, same pattern as the calendar page) — LBDS-271
- i18n keys under `message.contacts.*` and `message.externalTasks.*` (es + en) — LBDS-271

### Fixed
- External tasks "Vence" label honors the active i18n locale instead of being hardcoded to Spanish — LBDS-271