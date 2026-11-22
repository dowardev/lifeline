# Frontend type check

> Contract of the frontend type gate. This file is the durable record of the
> decisions below: the agent's task notes live in `odd/` (not versioned) and
> must not be the only place where a decision is written down.

## The gate

| What | Where |
|---|---|
| Local type check | `front/package.json` → `pnpm run typecheck` (`vue-tsc --noEmit`) |
| Local build (type check + bundle) | `front/package.json` → `pnpm run build` (`vue-tsc && vite build`) |
| CI, pull requests and branches | `.github/workflows/ci.yml` → job `frontend_typecheck` |
| CI, release tags | `.github/workflows/ci.yml` → job `frontend_build` (runs `pnpm run build`) |

`vue-tsc` does not emit (`front/tsconfig.json` sets `noEmit: true`), so the
type check never writes files; `vite build` produces the artifact.

**A release that does not type-check is a release that can ship a type
error.** That is why `frontend_build` runs `pnpm run build` and not
`pnpm exec vite build`.

## The exception: the rollback job

`rollback_frontend` rebuilds a tag that was already published, so it keeps
`pnpm exec vite build` and does **not** type-check: the older tags carry known
type errors and the rollback has to be able to go out. The type gate lives in
`frontend_typecheck` and `frontend_build`.

## Type contracts the app depends on

These are not stylistic choices; the runtime and the backend rely on them.

| Contract | Where |
|---|---|
| An offline row carries a **string temp id** (`tmp-<uuid>`) until the reconciler swaps it for the server id, so every `id` on a record/item is `number \| string` | `front/src/db/schema.ts`, `front/src/store/eventStore.ts` |
| `notifications`, `guests` and `repeat` are **arrays** on the wire (Laravel casts them), while older local rows may still hold the comma-separated string form | `back/app/Models/Event.php`, `front/src/components/widgets/CalendarWidget.vue` (`parseNotifications`) |
| The backend answers with a Laravel resource: the row arrives wrapped (`{ event: {...} }`, `{ task: {...} }`, ...) and the controllers strip the wrapper | `front/src/controllers/eventController.ts`, `front/src/controllers/taskController.ts`, `front/src/controllers/documentController.ts`, `front/src/controllers/noteController.ts` |
| A `undefined` value must never reach a local row: the key is dropped, `null` is kept | `front/src/utils/plainData.ts` (`stripUndefined`) |
| The document `url` is a **local slug** (`<title>-<id>`), not a backend field; the document page finds the row by that slug | `front/src/views/documents/DocumentsPage.vue`, `front/src/views/documents/DocumentPage.vue` |
| The WakaTime endpoint proxies the upstream payload; the total is read from `total_seconds` and the widget works in **seconds** | `front/src/services/wakaTimeService.ts`, `front/src/controllers/wakaTimeController.ts` |

## Running the checks locally

```bash
cd front
pnpm run typecheck   # 0 errors
pnpm run test:unit
pnpm run lint:check  # 0 errors
pnpm run build       # the command CI runs to produce the release artifact
```
