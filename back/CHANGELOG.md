# Changelog

All notable changes to the LifeLine backend (`back/`) are documented in this file.
The overall project roadmap and releases live in the repository-root `CHANGELOG.md`,
which is the authoritative record for the monorepo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Require an HMAC-signed guest token for the `X-Guest-Id` header (`App\Support\GuestToken`, `ResolveCalendarOwner`, `GET calendar-sources/guest-token` body endpoint, `X-Guest-Token` CORS exposure): raw UUIDs no longer resolve to another guest's sources — LBDS-230
- Harden guest invitation abuse: per-user rate limit (100 invitations/hour via `RateLimiter`) and a 50-guest cap per event payload (`guests|max:50`); regression test asserting no unauthenticated invitation path exists — LBDS-220

### Added
- Mirror service for external calendar sources: each `calendar_sources` row gets a
  `calendars` row (`source_id`, nullable FK `ON DELETE SET NULL`, unique) so the event
  modal's calendar picker lists local and external calendars together.
  `CalendarSourceMirrorObserver` keeps the mirror in sync on source create, rename and
  delete; a disconnected source leaves an `archived_at` ghost row that still resolves
  existing `events.calendar_id` but is not selectable. New columns: `calendars.source_id`,
  `calendars.archived_at`, `calendars.default_user_id` (generated) and
  `calendar_sources.user_id` (denormalized from `users.sso_sub`) — LBDS-305
- `GET /calendars` embeds the source block (`type`, `name`, `color`, `username`) and
  `selectable: false` for archived rows, so a consumer can tell a mirrored row from a
  local one — LBDS-305
- The "one active default calendar per user" invariant is now enforced at the database
  level: a generated column that yields `user_id` only for an active default, plus a
  unique index over it (MySQL/MariaDB have no partial unique indexes) — LBDS-305
- CalDAV discovery of address books and VTODO-capable task collections (`discoverAll` reports per-kind failure so a failed sub-discovery never refreshes stored collections); new `ExternalContact`/`ExternalTask` models with `external_contacts`/`external_tasks` tables — LBDS-266
- CalDAV addressbook (`addressbook-query` + VCARD) and task-list (`VTODO`) sync, and Google Tasks + People API contacts, routed per collection kind with the LBDS-264 prune guard applied to every kind — LBDS-266
- `GET /external-contacts` and `GET /external-tasks` endpoints honoring the per-collection `hidden` flag — LBDS-266
- Google OAuth consent now requests the Tasks and Contacts scopes alongside Calendar; discovery isolates each Google API so a disabled API or missing scope reports the failing kind instead of failing the whole discovery, with an actionable message and the console activation link — LBDS-266
- Remodel local identity on the SSO `sub` claim: `sso_sub` nullable-unique migration, `ResolveSsoUser` auto-provisions with or without email (no more 404 for advanced-encryption accounts), pre-remodel rows adopted by verified email only, concurrent first-logins retried instead of 500 — LBDS-230
- Persistent invitation sent-journal (`event_invitation_sends`, UNIQUE `(event_id, email)`) so each (event, guest email) is invited at most once, even under concurrent requests/retries; delete-and-re-add does not resend; journal errors stay fail-open and never block event save — LBDS-220

### Changed
- External calendar sources are linked to their `users` row when it becomes
  resolvable: `ResolveSsoUser` links the sources of a freshly provisioned (or adopted)
  account, and `ResolveCalendarOwner` links the guest sources adopted at login. A source
  connected before the account existed was previously invisible in the picker — LBDS-305
- `CalendarSource::VALID_TYPES` / `MANUAL_TYPES` centralize the source kinds
  (`google`, `caldav`, `ics`); the manual "Cuentas" endpoints validate against the
  constant instead of a duplicated literal — LBDS-305
- Redesign the guest-invitation email (`EventInvitation` → `emails.event-invitation`) as a branded HTML template: table-based email-safe layout, public PNG logo at `/assets/lifeline_v1.png` resolved from `app.url` (Gmail/Outlook drop base64/webp), accent event card (left border with square left edge), footer linking to https://lifeline.dowar.xyz; original content preserved as plain-text fallback (`emails.event-invitation-text`) — LBDS-219

### Fixed
- Skip the SSRF guard for OAuth Google sources (`url` sentinel `google-oauth` made every refresh/sync abort with 422) — LBDS-266
- Only a real subscribe-to-unsubscribe transition deletes stored rows on update, instead of every payload carrying an unsubscribed collection — LBDS-266
- Use `people/me/connections` (without `resourceName`) for Google contacts; `people/me` requires a scope this app never requests — LBDS-266
- CalDAV 207 per-resource error statuses (403/404/…) fail the collection instead of looking like an empty confirmed one, so prune never wipes stored rows — LBDS-266
- UID-less vCards keep a stable identity from the DAV resource href instead of a content hash — LBDS-266
- `discoverAll` reports sub-discovery failures so a failed CardDAV PROPFIND no longer drops stored contact collections — LBDS-266
- Stored `tasks`/`contacts` collections are not downgraded to `calendar` when a server omits `supported-calendar-component-set` — LBDS-266
- Guest-to-login adoption now migrates `external_contacts`/`external_tasks` along with sources and events — LBDS-266
- Hide the start-date line in the guest-invitation email (HTML and plain-text) when the event has no start date — LBDS-219
- Fix a stray `{` parse error in `CalendarSourceController` that 500'd every `calendar-sources` route since LBDS-224 (pre-existing drive-by found while adding the guest-token endpoint) — LBDS-230
- Guard CalDAV prune against unreadable responses (`extractCalendarData` throws with a body snippet, per-collection isolation with `$confirmed`/`$skipped`, prune skips unconfirmed; total failure still reports `ok: false`); regression test `CalendarSyncPruneGuardTest` — LBDS-264

### Added
- CalDAV discovery of address books and VTODO-capable task collections (`discoverAll` reports per-kind failure so a failed sub-discovery never refreshes stored collections); new `ExternalContact`/`ExternalTask` models with `external_contacts`/`external_tasks` tables — LBDS-266
- CalDAV addressbook (`addressbook-query` + VCARD) and task-list (`VTODO`) sync, and Google Tasks + People API contacts, routed per collection kind with the LBDS-264 prune guard applied to every kind — LBDS-266
- `GET /external-contacts` and `GET /external-tasks` endpoints honoring the per-collection `hidden` flag — LBDS-266
- Google OAuth consent now requests the Tasks and Contacts scopes alongside Calendar; discovery isolates each Google API so a disabled API or missing scope reports the failing kind instead of failing the whole discovery, with an actionable message and the console activation link — LBDS-266
- Persist scheduled local-notification ids on events/tasks/notes (`id_reminders`) and reminder selection (`notifications`) via new JSON columns, model casts and API resources; reversible migration `2026_09_01_000001_add_reminder_persistence_columns` — LBDS-211
- Guest invitation emails fired from `EventController::store/update` (authenticated flow only) including the inviter email, via `EventInvitations` support + `EventInvitation` mailable — LBDS-211
- `Support/ReminderOffsets` — backend mirror of the canonical offset vocabulary with `normalize()` (migrate legacy, drop unknown, canonical order) — LBDS-211

### Changed
- Normalize legacy offset codes on write (`notifications`) and accept both string and `{ email }` guest entries in `EventInvitations::normalizeGuests` — LBDS-211

### Fixed
- Skip the SSRF guard for OAuth Google sources (`url` sentinel `google-oauth` made every refresh/sync abort with 422) — LBDS-266
- Only a real subscribe-to-unsubscribe transition deletes stored rows on update, instead of every payload carrying an unsubscribed collection — LBDS-266
- Use `people/me/connections` (without `resourceName`) for Google contacts; `people/me` requires a scope this app never requests — LBDS-266
- CalDAV 207 per-resource error statuses (403/404/…) fail the collection instead of looking like an empty confirmed one, so prune never wipes stored rows — LBDS-266
- UID-less vCards keep a stable identity from the DAV resource href instead of a content hash — LBDS-266
- `discoverAll` reports sub-discovery failures so a failed CardDAV PROPFIND no longer drops stored contact collections — LBDS-266
- Stored `tasks`/`contacts` collections are not downgraded to `calendar` when a server omits `supported-calendar-component-set` — LBDS-266
- Guest-to-login adoption now migrates `external_contacts`/`external_tasks` along with sources and events — LBDS-266
- Make event creation/update flows work both authenticated (server-persisted) and anonymous (local-only), preventing 401s and dropped fields on edit — LBDS-211