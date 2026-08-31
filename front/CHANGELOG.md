# Changelog

All notable changes to the LifeLine frontend (`front/`) are documented in this file.
The overall project roadmap and releases live in the repository-root `CHANGELOG.md`,
which is the authoritative record for the monorepo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Harden and centralize the timezone list (feature guard + fallback for `Intl.supportedValuesOf`) and group the timezone picker by region in collapsible `ion-accordion`s with lazy/cached UTC offsets (non-regional zones reachable via search) — LBDS-206

### Fixed
- Fix event reminder popover crashing on open (Temporal Dead Zone on `startDate`/`endDate` in `RemindersComponent`) — LBDS-206
- Split the shared event reminders popover into dedicated popovers (Tiempo / Notificaciones / Repetir) and replace the `<ion-textarea>` read-only display with `ion-item`/`ion-label` rows — LBDS-206
- Clear the timezone search on popover close so it reopens showing the full grouped list — LBDS-206