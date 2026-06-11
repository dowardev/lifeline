# Codebase Quality Fixes — 38 Issues

Branch: `dowardev/lbds-73-make-it-work`
Base commit: `4ec98f7`

---

## Phase 1: Critical Runtime Crashes (6 issues)

These cause `TypeError: X is not a function` or infinite hangs at runtime.

### Task 1.1 — Add `syncAction` to EventController
- **File:** `front/src/js/eventController.ts`
- **Caller:** `CalendarContentComponent.vue:60` — `await eventController.syncAction()`
- **Fix:** Implement `syncAction` that orchestrates push-then-pull sync flow. Internally calls `pushUserLoggedEventsUpdated` then `syncUserLoggedEventsFromServer` (delegated via UserController).

### Task 1.2 — Add `loadUser` to UserController
- **File:** `front/src/js/userController.ts`
- **Callers:** `LoginPage.vue:465`, `LoginComponent.vue:426`, `router/index.ts:16`
- **Fix:** Implement `loadUser` that loads user from local DB (Dexie `users_logged`) and populates reactive state. Router callers expect `refs.user.value.isAdmin` and `refs.user.value.user` — see Task 1.3.

### Task 1.3 — Add `refs` reactive property to UserController
- **File:** `front/src/js/userController.ts`
- **Callers:** `router/index.ts:25,35,50` — `userController.refs.user.value.isAdmin`, `userController.refs.user.value.user`
- **Fix:** Add `refs = { user: ref<UserRecord | null>(null) }` property. Populate it in `loadUser` and `syncUserLogged`. Expose it publicly.

### Task 1.4 — Add `verifyUserLogged` to UserController
- **File:** `front/src/js/userController.ts`
- **Caller:** `MenuComponent.vue:387` — `userController.verifyUserLogged()`
- **Fix:** Implement `verifyUserLogged` — check Dexie `users_logged` table for current session, return boolean.

### Task 1.5 — Add `getEventReminders` to ReminderController
- **File:** `front/src/js/reminderController.ts`
- **Callers:** `scheduleController.ts:463,487`, `AddTaskComponent.vue:657`, `AddEventCompoenent.vue:789`
- **Fix:** Implement `getEventReminders` that takes `{ dateStart, notifications }` and returns `Date[]` of reminder trigger times, one per notification offset.

### Task 1.6 — Fix infinite loop when `frecuency=0` in ScheduleController
- **File:** `front/src/js/scheduleController.ts:269,601`
- **Bug:** `while (currentDate <= endDate || lastDate <= endDate)` — if `frecuency=0`, `lastDate` never advances, loop never ends.
- **Fix:** Guard: if `frecuency <= 0`, use default `1`. Add max iteration count (1000) as safety net.

---

## Phase 2: High-Priority Bugs (19 issues)

### Task 2.1 — Fix `deleteTask` wrong variable
- **File:** `front/src/js/taskController.ts:69`
- **Bug:** `element.id == id` — `id` is undefined, should be `taskId`
- **Fix:** Change to `element.id == taskId`

### Task 2.2 — Fix `splice(-1)` in tasksStore.removeTask
- **File:** `front/src/store/tasksStore.ts:65`
- **Bug:** `if (index != undefined)` — `findIndex` returns `-1`, never `undefined`. Condition always true. `splice(-1,1)` deletes last task.
- **Fix:** Change to `if (index >= 0)`

### Task 2.3 — Fix `splice(-1)` in documentStore.removeDocument
- **File:** `front/src/store/documentStore.ts:58`
- **Bug:** Same as 2.2. `splice(-1,1)` deletes last document.
- **Fix:** Change to `if (index >= 0)`

### Task 2.4 — Fix `splice(-1)` in documentStore.removeElement
- **File:** `front/src/store/documentStore.ts:67`
- **Bug:** `if (indexDocument != undefined)` — same pattern, crashes on `undefined.splice()`.
- **Fix:** Change to `if (indexDocument >= 0)`

### Task 2.5 — Fix `null >= 0` filter bug in EventController
- **File:** `front/src/js/eventController.ts:162`
- **Bug:** `event.idSync! >= 0` — `null >= 0` is `true` in JS, includes unsynced events.
- **Fix:** `event.idSync != null && event.idSync >= 0`

### Task 2.6 — Fix notes not persisted to storage
- **File:** `front/src/js/noteController.ts:18`
- **Bug:** `notes?.push(note)` but no `storage.set("notes", notes)` call. Notes lost on restart.
- **Fix:** Add `await storage.set("notes", notes)` after push.

### Task 2.7 — Fix documentController double write in updateNoteValue
- **File:** `front/src/js/documentController.ts:113-133`
- **Bug:** `updateLocalUserDocument` called twice with identical data.
- **Fix:** Remove second write block.

### Task 2.8 — Fix documentController data loss in updateNoteReminder
- **File:** `front/src/js/documentController.ts:135-157`
- **Bug:** Replaces entire `elements[index].data` with `{ reminder: {...} }`, overwrites `content`.
- **Fix:** Use spread: `elements[index].data = { ...elements[index].data, reminder: {...} }`

### Task 2.9 — Fix theme comparison always true in LoginPage
- **File:** `front/src/views/sesion/login/LoginPage.vue:293,301`
- **Bug:** `theme == "nord" || "light"` — `"light"` is truthy, always evaluates true.
- **Fix:** `theme == "nord" || theme == "light"`

### Task 2.10 — Fix DocumentsPage duplicate Storage instance
- **File:** `front/src/views/documents/DocumentsPage.vue:92,99-101`
- **Bug:** Creates local `new Storage()` instead of using global instance.
- **Fix:** Remove local Storage import/instance, use global `storage` from `@/main`.

### Task 2.11 — Add Bearer prefix in apiController
- **File:** `front/src/js/apiController.ts:38`
- **Bug:** `config.headers.Authorization = token` — relies on stored token containing "Bearer " prefix. Fragile convention.
- **Fix:** Store raw token (remove "Bearer " prefix at save time in `LoginPage.vue:332`), add `config.headers.Authorization = 'Bearer ' + token` in apiController.

### Task 2.12 — Add 401 interceptor to apiController
- **File:** `front/src/js/apiController.ts`
- **Bug:** No 401 handling. Expired tokens cause unhandled errors.
- **Fix:** Add Axios response interceptor: on 401, clear stale token and redirect to login.

### Task 2.13 — Fix `removeAllTokens` wiping all users
- **File:** `front/src/js/tokenController.ts:40-42`
- **Bug:** `db.tokens.clear()` deletes tokens for ALL users.
- **Fix:** `db.tokens.where('user_id').equals(userId).delete()`

### Task 2.14 — Add sync lock to UserController
- **File:** `front/src/js/userController.ts:197-296`
- **Bug:** No lock on `syncEvents`. Concurrent calls cause duplicate events.
- **Fix:** Add `private isSyncing = false` flag. Skip if already syncing.

### Task 2.15 — Mark events synced after push
- **File:** `front/src/js/eventController.ts:276-302,109-133`
- **Bug:** `pushNewEvent`/`pushUpdateEvent` never update `syncStatus` or `idSync` in local DB.
- **Fix:** After successful server push, update local event: `syncStatus = true`, `idSync = response.id`.

### Task 2.16 — Fix "Unauthorized" error swallowed in eventController
- **File:** `front/src/js/eventController.ts:592`
- **Bug:** `error.message != "Unauthorized"` check — errors from Axios don't have `.message` matching "Unauthorized".
- **Fix:** Check `error.response?.status === 401` instead.

### Task 2.17 — Fix reminderController frequency mutation
- **File:** `front/src/js/reminderController.ts:29,55`
- **Bug:** `frecuency! += frecuency ?? 0` — mutates outer `let` variable in `.map()` loop, causing exponential growth.
- **Fix:** Use separate accumulator: `let nextOffset = frecuency; ... nextOffset += frecuency;`

### Task 2.18 — Fix "1mb" mapped to 2 months instead of 1 minute
- **File:** `front/src/js/reminderController.ts:113`
- **Bug:** `if (notification == "1mb") tr.months = 2;` — "1mb" = 1 minute before, not 2 months.
- **Fix:** `if (notification == "1mb") tr.minutes = 1;`

### Task 2.19 — Fix notification ID collisions
- **File:** `front/src/js/reminderController.ts:137`, `scheduleController.ts:128,472,496`
- **Bug:** `Math.floor(Math.random() * 1000)` and `new Date().getMilliseconds()` produce colliding IDs.
- **Fix:** Use `Date.now() + counter` or `Math.floor(Math.random() * 1000000)`.

---

## Phase 3: API Layer & Auth (4 issues)

### Task 3.1 — Add request timeout to apiController
- **File:** `front/src/js/apiController.ts:18-24`
- **Fix:** Add `timeout: 15000` to `axios.create()` options.

### Task 3.2 — Add missing DB columns + migration
- **File:** `back/database/migrations/` (new migration)
- **Bug:** `is_user_disabled`, `is_admin`, `rol`, `image_id` columns referenced but don't exist.
- **Fix:** Create migration adding: `$table->boolean('is_admin')->default(0)`, `$table->boolean('is_user_disabled')->default(0)`, `$table->string('rol')->nullable()`. Update `User` model `$fillable`.

### Task 3.3 — Fix user enumeration in AuthController
- **File:** `back/app/Http/Controllers/AuthController.php:56-74`
- **Bug:** Different errors for "not found" (404), "disabled" (403), "wrong password" (401).
- **Fix:** Return generic `401 Unauthorized` with `Invalid credentials` for all cases.

### Task 3.4 — Add password validation
- **File:** `back/app/Http/Controllers/AuthController.php:24`
- **Bug:** No min length, no complexity.
- **Fix:** `'password' => 'required|string|min:8'`

---

## Phase 4: Sync & Data Integrity (4 issues)

### Task 4.1 — Fix `calendarSchedule` missing from eventsStore
- **File:** `front/src/store/eventsStore.ts`
- **Caller:** `scheduleController.ts:357` — `this.useEventsStore().calendarSchedule`
- **Fix:** Add `calendarSchedule: ref<Schedule | null>(null)` to store. Wire `scheduleController.saveSchedule` to update it.

### Task 4.2 — Fix `saveSchedule` missing from scheduleController
- **File:** `front/src/js/scheduleController.ts`
- **Bug:** Only `saveScheduleLocal` exists — saves to Ionic Storage but doesn't update store.
- **Fix:** Add `saveSchedule` that calls `saveScheduleLocal` AND updates `eventsStore.calendarSchedule`.

### Task 4.3 — Fix duplicate `id` key in generateEventSchedule
- **File:** `front/src/js/scheduleController.ts:513,523`
- **Bug:** Two `id` properties in object literal — second wins, first (timestamp) lost.
- **Fix:** Rename to distinct keys: `id: idElement` and `scheduleId: id` (or similar based on intent).

### Task 4.4 — Fix WakaTime public endpoint
- **File:** `back/routes/api.php:21`
- **Bug:** `wakatime-durations` route outside `auth:api` middleware — open proxy.
- **Fix:** Move inside `auth:api` middleware group.

---

## Phase 5: Reminder & Schedule Bugs (3 issues)

### Task 5.1 — Fix Carbon strict format crash in EventController
- **File:** `back/app/Http/Controllers/EventController.php:38-39,110-111`
- **Bug:** `Carbon::createFromFormat('Y-m-d\TH:i:s.u\Z', ...)` — crashes if microseconds missing.
- **Fix:** Use `Carbon::parse()` instead.

### Task 5.2 — Add missing event validation in EventController
- **File:** `back/app/Http/Controllers/EventController.php:20-27`
- **Bug:** No validation for `notifications`, `repeat`, `guests`, `description`.
- **Fix:** Add: `'notifications' => 'nullable|json'`, `'repeat' => 'nullable|json'`, `'guests' => 'nullable|json'`, `'description' => 'nullable|string'`. Also make `calendar_id` optional with default.

### Task 5.3 — Add verifyAccount route + fix response
- **File:** `back/routes/api.php`, `back/app/Http/Controllers/AuthController.php`
- **Bug:** Method exists but no route defined. Returns plain text, not JSON.
- **Fix:** Add route `Route::get('verify-account/{token}', ...)`. Return `response()->json(['message' => $message])`.

---

## Phase 6: Store Fixes (4 issues)

### Task 6.1 — Fix `getEvent` uses filter not find
- **File:** `front/src/store/eventsStore.ts:12-18`
- **Bug:** `filter` with conditional return instead of `find`.
- **Fix:** `return events.value.find((event) => event.id == idEvent)`

### Task 6.2 — Fix `updateEvents` replaces not merges
- **File:** `front/src/store/eventsStore.ts:44-59`
- **Bug:** Starts with copy of incoming data, discards existing store events.
- **Fix:** Start with `[...events.value]`, iterate `eventsData` to update/add.

### Task 6.3 — Fix `getDocument` uses filter not find
- **File:** `front/src/store/documentStore.ts:21-29`
- **Bug:** Same filter vs find pattern.
- **Fix:** `return state.documents.find((e) => e.id == search || e.url == search)`

### Task 6.4 — Remove dead commented-out code in scheduleController
- **File:** `front/src/js/scheduleController.ts:15-62`
- **Fix:** Delete 47 lines of commented-out `loadReminders` versions.

---

## Phase 7: Backend Hardening (3 issues)

### Task 7.1 — Add rate limiting to API routes
- **File:** `back/routes/api.php`
- **Fix:** Add `->middleware('throttle:5,1')` to login/signup. Add general throttle to auth group.

### Task 7.2 — Fix documentController findIndex bugs
- **File:** `front/src/js/documentController.ts:200-201,193-205`
- **Bug:** `index != undefined` always true + double `getLocalUserDocuments` calls.
- **Fix:** `if (index >= 0)` and cache `getLocalUserDocuments` result.

### Task 7.3 — Fix tokenController untyped return
- **File:** `front/src/js/tokenController.ts:4`
- **Bug:** `Promise<any>` return type.
- **Fix:** Change to `Promise<string | null>`.

---

## Phase 8: Cleanup & Consistency (3 issues)

### Task 8.1 — Fix DocumentsPage direct store access
- **File:** `front/src/views/documents/DocumentsPage.vue:98-99,119`
- **Bug:** Component directly accesses `useEventsStore()` per AGENTS.md convention violation.
- **Fix:** Route through a controller or composable.

### Task 8.2 — Fix `paramas` typo
- **File:** Find and fix any `paramas` → `params` typo in frontend controllers.
- **Fix:** Search and replace.

### Task 8.3 — Fix `removeElement` findIndex check in documentStore
- **File:** `front/src/store/documentStore.ts:67`
- **Already covered in Task 2.4** — included for completeness.

---

## Execution Notes

- All functions use named parameters pattern per AGENTS.md
- All changes follow existing code conventions (Dexie for DB, Pinia for stores, controllers as bridge)
- Backend changes need migration: `php artisan make:migration`
- Frontend changes should pass `pnpm run lint` in `front/`
- `vue-tsc --noEmit` may need extended timeout (>60s)
- Total: 38 issues, 8 phases, ~30 files touched
