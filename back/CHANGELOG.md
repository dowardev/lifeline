# Changelog

All notable changes to the LifeLine backend (`back/`) are documented in this file.
The overall project roadmap and releases live in the repository-root `CHANGELOG.md`,
which is the authoritative record for the monorepo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Persist scheduled local-notification ids on events/tasks/notes (`id_reminders`) and reminder selection (`notifications`) via new JSON columns, model casts and API resources; reversible migration `2026_09_01_000001_add_reminder_persistence_columns` — LBDS-211
- Guest invitation emails fired from `EventController::store/update` (authenticated flow only) including the inviter email, via `EventInvitations` support + `EventInvitation` mailable — LBDS-211
- `Support/ReminderOffsets` — backend mirror of the canonical offset vocabulary with `normalize()` (migrate legacy, drop unknown, canonical order) — LBDS-211

### Changed
- Normalize legacy offset codes on write (`notifications`) and accept both string and `{ email }` guest entries in `EventInvitations::normalizeGuests` — LBDS-211

### Fixed
- Make event creation/update flows work both authenticated (server-persisted) and anonymous (local-only), preventing 401s and dropped fields on edit — LBDS-211