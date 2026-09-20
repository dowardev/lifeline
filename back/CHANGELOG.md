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
- CalDAV discovery of address books and VTODO-capable task collections (`discoverAll` reports per-kind failure so a failed sub-discovery never refreshes stored collections); new `ExternalContact`/`ExternalTask` models with `external_contacts`/`external_tasks` tables — LBDS-266
- CalDAV addressbook (`addressbook-query` + VCARD) and task-list (`VTODO`) sync, and Google Tasks + People API contacts, routed per collection kind with the LBDS-264 prune guard applied to every kind — LBDS-266
- `GET /external-contacts` and `GET /external-tasks` endpoints honoring the per-collection `hidden` flag — LBDS-266
- Google OAuth consent now requests the Tasks and Contacts scopes alongside Calendar; discovery isolates each Google API so a disabled API or missing scope reports the failing kind instead of failing the whole discovery, with an actionable message and the console activation link — LBDS-266
- Remodel local identity on the SSO `sub` claim: `sso_sub` nullable-unique migration, `ResolveSsoUser` auto-provisions with or without email (no more 404 for advanced-encryption accounts), pre-remodel rows adopted by verified email only, concurrent first-logins retried instead of 500 — LBDS-230
- Persistent invitation sent-journal (`event_invitation_sends`, UNIQUE `(event_id, email)`) so each (event, guest email) is invited at most once, even under concurrent requests/retries; delete-and-re-add does not resend; journal errors stay fail-open and never block event save — LBDS-220

### Changed
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