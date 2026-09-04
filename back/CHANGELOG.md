# Changelog

All notable changes to the LifeLine backend (`back/`) are documented in this file.
The overall project roadmap and releases live in the repository-root `CHANGELOG.md`,
which is the authoritative record for the monorepo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Harden guest invitation abuse: per-user rate limit (100 invitations/hour via `RateLimiter`) and a 50-guest cap per event payload (`guests|max:50`); regression test asserting no unauthenticated invitation path exists — LBDS-220

### Added
- Persistent invitation sent-journal (`event_invitation_sends`, UNIQUE `(event_id, email)`) so each (event, guest email) is invited at most once, even under concurrent requests/retries; delete-and-re-add does not resend; journal errors stay fail-open and never block event save — LBDS-220

### Changed
- Redesign the guest-invitation email (`EventInvitation` → `emails.event-invitation`) as a branded HTML template: table-based email-safe layout, public PNG logo at `/assets/lifeline_v1.png` resolved from `app.url` (Gmail/Outlook drop base64/webp), accent event card (left border with square left edge), footer linking to https://lifeline.dowar.xyz; original content preserved as plain-text fallback (`emails.event-invitation-text`) — LBDS-219

### Fixed
- Hide the start-date line in the guest-invitation email (HTML and plain-text) when the event has no start date — LBDS-219

### Added
- Persist scheduled local-notification ids on events/tasks/notes (`id_reminders`) and reminder selection (`notifications`) via new JSON columns, model casts and API resources; reversible migration `2026_09_01_000001_add_reminder_persistence_columns` — LBDS-211
- Guest invitation emails fired from `EventController::store/update` (authenticated flow only) including the inviter email, via `EventInvitations` support + `EventInvitation` mailable — LBDS-211
- `Support/ReminderOffsets` — backend mirror of the canonical offset vocabulary with `normalize()` (migrate legacy, drop unknown, canonical order) — LBDS-211

### Changed
- Normalize legacy offset codes on write (`notifications`) and accept both string and `{ email }` guest entries in `EventInvitations::normalizeGuests` — LBDS-211

### Fixed
- Make event creation/update flows work both authenticated (server-persisted) and anonymous (local-only), preventing 401s and dropped fields on edit — LBDS-211