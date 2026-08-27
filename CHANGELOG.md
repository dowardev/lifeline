# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **front:** Make authentication optional — the app boots to a usable anonymous mode with no SSO, backed by a persisted local profile (`lifeline_local_user`) anchored to a real `user_id` in IndexedDB (LBDS-199)
- **front:** Soft router guard with opt-in `requiresAuth` meta; app-shell routes (home, calendar, tasks, documents, notes) are reachable anonymously
- **front:** `AuthController` façade splitting always-available `LocalAuthController` from optional `SsoAuthController`; `apiClient` degrades to local Dexie when no SSO is available
- **root:** Add DEPLOY.md deployment guide (manual SSH setup, tag-based GitLab CI/CD, rollback, dryrun tags)
- **front:** Widget system on the home page: desktop GridStack grid (drag/resize) and a mobile horizontal pager (scroll-snap, one full-width page per widget) with an active-pill page indicator, persisted per breakpoint in localStorage (LBDS-102)
- **front:** Add `gridstack` dependency and extract `CalendarWidget` / `WakaTimeWidget` from the home page

### Changed
- **front:** Remove redundant type cast in `useAppVersion` composable (`chipClass` return type already declares the union).
- **front:** Refactor: extract `useCalendarModals` composable from `CalendarPage.vue` (no user-facing change).
- **front:** Remove dead `requiresAuth` meta from router and use static SSO client import
- **front:** HomePage mounts only the active layout (grid on desktop/tablet, pager on mobile) instead of both
- **front:** Persist events created from the home calendar widget via `EventController.addLocalEvent()` (store + IndexedDB)
- **front:** Simplify the widget layout model to `lg`/`md` breakpoints only (`sm` slot removed); mobile order follows desktop drag order

### Fixed
- **front:** Persist widget drag/resize positions after grid drags (GridStack events previously carried empty payloads)
- **front:** Hydrate the WakaTime API key from IndexedDB and restore a functional "Configurar API Key" modal on the home widget

## [0.15.0] - 2026-08-10

### Added
- **front:** SPA `.htaccess` in `front/public/` so history-mode routing works on page reload
- **root:** CI copies the `FRONTEND_ENV_FILE` File variable into `front/.env.production` before `frontend_build` and `rollback_frontend`, so the pipeline compiles the frontend with the configured production URLs

### Fixed
- **root:** Deploy script glob expansion disabled while building tarball excludes, preventing local `.env` files from reaching the server
- **root:** Remote deploy creates `storage/framework/{views,cache/data,sessions}` before `artisan`, fixing "Please provide a valid cache path"

## [0.14.0] - 2026-08-09

### Added
- **root:** Unified hardened deploy script with safety checks, dry-run, and npm/composer version checks (`scripts/deploy/deploy.sh` + `deploy.conf`)
- **root:** Optional setup script upload to the server (`SETUP_SCRIPT`)

## [0.13.0] - 2026-07-01

### Added
- **front:** Migrate authentication to tu-org/sso-server and fix OAuth redirect loop
- **front:** Add dev-only form fill button with Faker-generated random data
- **front:** New data flow architecture for LBDS-105
- **front:** SSO-style environment configuration

### Changed
- **front:** Upgrade to OAuth2-based authentication via SSO server
- **front:** Replace GraphQL with REST API (LBDS-62)
- **front:** Improve overall UI/UX (LBDS-74)
- **front:** Refactor architecture and data layer (LBDS-52)
- **front:** Improve SQLite sync logic (LBDS-61)
- **front:** Clean up and improve post-migration SSO integration

### Fixed
- **front:** Fix login flow and authentication (LBDS-71)
- **front:** Fix SQLite data synchronization issues (LBDS-61)
- **front:** Fix event creation and calendar selection

### Removed
- **front:** Remove GraphQL dependency and related code

### Security
- **front:** Replace direct auth with SSO-based OAuth2 authentication flow

## [0.12.0] - 2026-06-12

### Added
- **front:** Add oneSpend UI/UX theme system with 4 themes: light, dark, catppuccin-latte-maroon, catppuccin-macchiato-maroon
- **front:** Add component utility classes (card shadows, ion-item variants, ion-list styling, border color utilities)
- **front:** Add body-class-based theme switching with `auto` mode and system dark mode listener
- **front:** Add old theme migration (gruvbox, nord, cherry → new catppuccin equivalents)

### Changed
- **front:** Replace old 4-theme system (gruvbox, nord, cherry, light) with oneSpend design system
- **front:** Update ThemeController to use `document.body` theme classes with oneSpend naming convention
- **front:** Update TemplatePage.vue structure to match oneSpend template with content/modals/popovers/alerts sections
- **front:** Update theme selector UI to reflect new theme names

### Removed
- **front:** Remove old theme files: gruvbox.css, nord.css, cherry.css, light.css

## [0.11.1] - 2026-06-11

### Fixed
- **back:** Prevent null pointer crash on login and eliminate user enumeration via uniform 401 response
- **back:** Remove `$guarded` from User model (Eloquent ignores it when `$fillable` is set)
- **back:** Remove `user_id` from `$fillable` on all 5 models; set explicitly in controllers for defense-in-depth
- **back:** Change `unsignedInteger` to `unsignedBigInteger` for `user_id` foreign keys to match `id()` PK type
- **back:** Validate dates as `date` type and JSON fields as `array` to prevent 500 on bad input and double-encoding
- **front:** Assign string page titles instead of boolean comparisons in MainPage
- **front:** Await `storage.create()` before bootstrap and remove unnecessary `DOMContentLoaded` wrapper
- **front:** Fix `apiClient` 401 redirect from `window.location.href` to `router.push` with concurrent 401 storm guard
- **front:** Convert store `setLoading`/`setError` to named parameters pattern per project convention
- **front:** Replace template method calls with computed property in DocumentsPage; fix `useDocument` direct store mutations and `any` types
- **front:** Apply named parameters pattern to `presentToast` in LoginPage

### Changed
- **back:** Move resource routes out of `/v1/auth/` prefix to `/v1/` for proper REST semantics
- **back:** Rename CalendarController methods to standard resource names (store, update, destroy)
- **front:** Convert `calendarController.ts` to lazy store getter with typed `getViewDates` return

### Added
- **root:** Add `.eslintcache` to `.gitignore`

## [0.11.0] - 2026-06-09

### Added
- **front:** Migrate from SQLite (Capacitor SQLite) to Dexie.js (IndexedDB) for offline persistence with schema versioning and automatic recovery
- **front:** Add Pinia stores for auth, events, tasks, documents, tags, theme, and WakaTime
- **front:** Add remaining controllers (calendar, event, note, reminder, schedule, system, tag, theme, wakaTime)
- **front:** Add diagnostic logging for userId mismatch in event loading
- **back:** Add CRUD endpoints for tasks, documents, and notes

### Changed
- **front:** Refactor from legacy js/ controllers to services/controllers/stores layered architecture
- **front:** Load events from IndexedDB first (instant), sync with server in background
- **front:** Replace OAuth token flow with new AuthController pattern
- **front:** Migrate Dexie config primary key from auto-increment id to name (schema v2)
- **front:** Add defensive guards for null/invalid dates, empty month names, and null user in router
- **front:** Initialize viewDates with current date in calendar store

### Removed
- **front:** Remove @capacitor-community/sqlite dependency and all SQLite-related code
- **front:** Remove old js/ controller files and legacy stores
- **front:** Remove dead getViewDates/setCurrentDates call from MainPage

### Fixed
- **front:** Resolve 38 codebase quality issues across all phases — critical sync loop, data loss, token management, notification collisions, backend validation, store logic, rate limiting, and code cleanup
- **front:** Resolve 13 TypeScript and runtime issues across CalendarComponent, HomePage, LoginPage, controllers, stores, and components
- **front:** Resolve 10 functional issues in Dexie migration — schema upgrade, event validation, userId resolution, database corruption recovery
- **front:** Fix resolveUserId fallback and data migration for events with missing user_id
- **front:** Fix AddTaskComponent — send title field instead of name, add null guard on taskData.id
- **front:** Fix unit tests — correct HomePage import path, stub WakaTimeController, use forks pool
- **front:** Validate events before saving to IndexedDB, preserve local events on server sync

## [0.10.0] - 2026-05-27

### ⚠ BREAKING CHANGES

- **back:** Upgrade Laravel 9 → 13 with Passport-only auth and Vite. PHP min version raised to ^8.3. Removes Sanctum, fruitcake/laravel-cors, graphql-playground, and Laravel Mix (webpack). Migrates to L13 bootstrap/app.php + providers.php architecture.
- **front:** Upgrade Capacitor 6 → 8 (Android SDK 36, AGP 8.13, Kotlin 2.2, minSdk 24). Upgrade Vite 5 → 8 with Rolldown bundler (replaces esbuild/Rollup). Upgrade Vue Router 4 → 5, Pinia 2 → 3, vue-i18n 10 → 11, vue-tsc 2 → 3.

### Added

- **front:** Update all Vue ecosystem packages to latest stable - Vue 3.5.35, Vue Router 5.0.7, Pinia 3.0.4, vue-i18n 11.4.4, vue-tsc 3.3.2
- **front:** Update Ionic 8.3.1 → 8.8.8 and ionicons 7 → 8 with pnpm patch for Rolldown exports compatibility
- **front:** Update build toolchain - Vite 5.4.8 → 8.0.14, @vitejs/plugin-vue 5 → 6, vite-plugin-pwa 0.20 → 1.3, vitest 2 → 4, TypeScript 5.6 → 5.9
- **front:** Update Capacitor plugins to 8.x with pnpm-workspace.yaml configuration
- **front:** Add Vite plugin for ionicons resolution compatibility with Rolldown
- **front:** Add pnpm-workspace.yaml for monorepo package management
- **back:** Upgrade Laravel framework ^9.0 → ^13.0 (PHP ^8.0 → ^8.3)
- **back:** Implement Passport-only authentication (removed Sanctum)
- **back:** Migrate build system from Laravel Mix to Vite
- **back:** Update PHPUnit configuration for PHPUnit 12

### Fixed

- **back:** Fix migration bugs - rename password_resets to password_reset_tokens, fix column mismatches
- **back:** Sync Event/Calendar models with actual migration schemas
- **front:** Fix CalendarComponent.vue - remove defineProps import (compiler macro in Vue 3.5+)
- **front:** Remove erroneous `core: link:@apollo/client/core` dependency that blocked pnpm install
- **front:** Fix Android config for Capacitor 8 - add `navigation` and `density` to configChanges, update namespace syntax
- **front:** Fix PWA build - set maximumFileSizeToCacheInBytes for large JS bundles (2.27 MB)

### Changed

- **front:** Remove unused `bundledWebRuntime` config from capacitor.config.ts
- **front:** Multiple auto-fixes from oxlint - shorthand object properties, correct Ionic event naming
- **front:** Apply Java 21 compileOptions and Kotlin 2.x compilerOptions in Android build

### Changed

- Update AGENTS.md with flattened monorepo structure, developer commands, and code conventions

## [0.9.4] - 2026-05-26

### Added

- Original Ionic 8 / Capacitor 6 / Laravel 9 stack
