// Vitest setup file — runs before every test file.
// Provides IndexedDB shim for jsdom (which doesn't implement it natively).
// This is needed because the app uses Dexie (@ionic/storage under the hood)
// which throws DatabaseClosedError when IndexedDB is missing.

import "fake-indexeddb/auto";
