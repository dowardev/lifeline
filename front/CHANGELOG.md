# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.0] - 2026-07-01

### Added
- Migrate authentication to tu-org/sso-server and fix OAuth redirect loop
- Add dev-only form fill button with Faker-generated random data
- New data flow architecture for LBDS-105
- SSO-style environment configuration

### Changed
- Upgrade to OAuth2-based authentication via SSO server
- Replace GraphQL with REST API (LBDS-62)
- Improve overall UI/UX (LBDS-74)
- Refactor architecture and data layer (LBDS-52)
- Improve SQLite sync logic (LBDS-61)
- Clean up and improve post-migration SSO integration

### Fixed
- Fix login flow and authentication (LBDS-71)
- Fix SQLite data synchronization issues (LBDS-61)
- Fix event creation and calendar selection

### Removed
- Remove GraphQL dependency and related code

### Security
- Replace direct auth with SSO-based OAuth2 authentication flow