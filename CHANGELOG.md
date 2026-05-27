# Changelog

## [0.10.0] - 2026-05-27

### ⚠ BREAKING CHANGES

- **back:** Upgrade Laravel 9 → 13 with Passport-only auth and Vite. PHP min version raised to ^8.3. Removes Sanctum, fruitcake/laravel-cors, graphql-playground, and Laravel Mix (webpack). Migrates to L13 bootstrap/app.php + providers.php architecture.
- **front:** Upgrade Capacitor 6 → 8 (Android SDK 36, AGP 8.13, Kotlin 2.2, minSdk 24). Upgrade Vite 5 → 8 with Rolldown bundler (replaces esbuild/Rollup). Upgrade Vue Router 4 → 5, Pinia 2 → 3, vue-i18n 10 → 11, vue-tsc 2 → 3.

### Features

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

### Bug Fixes

- **back:** Fix migration bugs - rename password_resets to password_reset_tokens, fix column mismatches
- **back:** Sync Event/Calendar models with actual migration schemas
- **front:** Fix CalendarComponent.vue - remove defineProps import (compiler macro in Vue 3.5+)
- **front:** Remove erroneous `core: link:@apollo/client/core` dependency that blocked pnpm install
- **front:** Fix Android config for Capacitor 8 - add `navigation` and `density` to configChanges, update namespace syntax
- **front:** Fix PWA build - set maximumFileSizeToCacheInBytes for large JS bundles (2.27 MB)

### Code Improvements

- **front:** Remove unused `bundledWebRuntime` config from capacitor.config.ts
- **front:** Multiple auto-fixes from oxlint - shorthand object properties, correct Ionic event naming
- **front:** Apply Java 21 compileOptions and Kotlin 2.x compilerOptions in Android build

### Documentation

- Update AGENTS.md with flattened monorepo structure, developer commands, and code conventions

## [0.9.4] - 2026-05-26

### Previous release

- Original Ionic 8 / Capacitor 6 / Laravel 9 stack
