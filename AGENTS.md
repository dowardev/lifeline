# REGLA DURA — pregunta del usuario (máxima prioridad, leer primero)

Cuando el usuario haga una PREGUNTA:
1. Respondo SOLO la pregunta.
2. Paro.
3. Espero instrucción explícita.

PROHIBIDO actuar por cuenta propia ante una pregunta: no editar archivos, no
commitear, no crear tickets, no correr comandos con efectos. Esta regla está
POR ENCIMA de cualquier skill, flujo o impulso de "aprovechar" el turno.
Pregunta = responder y parar. Sin excepciones.

---
# AGENTS.md - LifeLine

## Project Structure

Monorepo with two directories:

- `back/` — Laravel 13 backend (PHP ^8.3)
- `front/` — Ionic Vue 8 frontend (Node.js, pnpm)

## Developer Commands

```bash
# Run backend
cd back && php artisan serve

# Run frontend
cd front && pnpm run dev

# Build frontend
cd front && pnpm run build    # vue-tsc + vite build

# Frontend lint
cd front && pnpm run lint     # oxlint + eslint

# Frontend unit tests
cd front && pnpm run test:unit

# Frontend e2e tests
cd front && pnpm run test:e2e

# Format code
cd front && pnpm run format
```

## Backend Setup

```bash
cd back
composer install
cp .env.example .env
php artisan key:generate
php artisan passport:install
php artisan migrate
php artisan db:seed
php artisan serve
```

**Database:** MySQL (configured in `.env`)

## Architecture

### Backend (`back/`)

- **Laravel 13** con PHP ^8.3
- **Authentication:** Laravel Passport (OAuth2)
- **REST API:** axios in frontend, Laravel routes in backend
- **Build tool:** Vite
- `app/Http/Controllers/` — AuthController, CalendarController, EventController
- `app/Models/` — User, Event, Calendar, Tag, AdminTag, UserVerify
- `routes/api.php` — REST API endpoints (login, signup, CRUD events/calendars)

### Frontend (`front/`)

- **Ionic 8** + **Vue 3** with Composition API
- **Capacitor 6** for Android support (app ID: com.dowardev.lifeline)
- **Axios** + **REST API** for API communication
- **Pinia** for state management
- **SQLite offline** with @capacitor-community/sqlite
- **i18n** with vue-i18n
- **PWA** with vite-plugin-pwa
- **Controllers** in `src/controllers/` — authController, eventController, taskController, etc.
- **Stores** in `src/store/` — Pinia stores
- **Views** in `src/views/` — home, calendar, documents, tasks, integrations, session, etc.
- **Note:** Unified monorepo repo with full history. `.git` at root.

## Code Conventions

### Frontend (TypeScript): Named Parameters Pattern

All functions must use a single `params` object instead of positional parameters. Destructure inside the function body.

```ts
// ✅ Correct
function holaMundo(params: { objeto1: string; objeto2: number }) {
  const { objeto1, objeto2 } = params
}

// ❌ Wrong
function holaMundo(objeto1: string, objeto2: number) { ... }
```

> This pattern requires TypeScript. In plain JS the inline type annotation is invalid syntax — use JSDoc `@param` instead if needed.

### Frontend (Vue Components): Controller or Composable Communication

Vue components may contain any **local** logic (props, emits, computed, watch, onMounted, reactive variables, internal functions, etc.) that is internal to the component. However, any logic that is **shared** with or reused by other parts of the application — such as API calls, store access, or cross-component business logic — must go through **controllers or composables**, depending on what best fits the case. These are the bridge between Vue components and external application layers.

```ts
// ✅ Correct — local logic in component is fine
const isOpen = ref(false)
const label = computed(() => isOpen.value ? 'Open' : 'Closed')
onMounted(() => { isOpen.value = true })

// ✅ Correct — shared logic uses a controller
import { useAuthController } from '@/controllers/authController'
const controller = useAuthController()
controller.login(params)

// ✅ Correct — shared logic uses a composable
import { useAuth } from '@/composables/useAuth'
const { login } = useAuth()
login(params)

// ❌ Wrong — component accesses store directly
import { useAuthStore } from '@/store/auth'
const store = useAuthStore()

// ❌ Wrong — component calls API service directly
import { authApi } from '@/services/auth'
authApi.login(params)
```

### Frontend (Vue Components): Template Structure

There are two distinct template patterns depending on the file type: **Pages** (route-level views) and **Components** (reusable UI blocks). Both must follow the numbered section structure in the script.

#### Pages (`src/views/`)

Pages are route-level views. Root element is `<ion-page>` with `<ion-header>` and `<ion-content>`.
Reference: `guides/TemplatePage.vue`

```vue
<template>
  <ion-page>
    <ion-header>...</ion-header>
    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="4"><!-- content --></ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
    <!-- popovers -->
    <!-- alerts -->
    <!-- modals -->
  </ion-page>
</template>
```

#### Components (`src/views/**/components/` or `src/components/`)

Components are reusable blocks. NO `<ion-page>`, NO `<ion-header>`, NO `<ion-content>`.
Reference: `guides/TemplateComponent.vue`

```vue
<template>
  <!-- No ion-page — this is a reusable component -->
  <ion-list class="transparent">
    <ion-card>
      <ion-item lines="full" class="transparent">...</ion-item>
    </ion-card>
  </ion-list>
</template>
```

**Script (`<script lang="ts" setup>`) — same numbered section structure for both:**

```ts
<script setup lang="ts>
// 1. Imports (ionic/vue/ionicons)
//    - Vue: ref, computed, watch, onMounted, etc.
//    - Ionicons: addOutline, chevronBackOutline, etc.
//    - Utilities: date-fns, messages, db, etc.
//    - Ionic: IonButton, IonContent, IonDatetime, etc.
//    - Local packages: @/utils/..., @/store/..., etc.
import { ref, computed, onMounted } from 'vue'
import { addOutline } from 'ionicons/icons'
import { format } from 'date-fns'
import { IonButton, IonContent, IonDatetime } from '@ionic/vue'

// 2. Controllers / Composables
//    - Import and instantiate controllers/composables
import { AuthController } from '@/controllers/authController'
const authController = new AuthController()

// 3. Components
//    - Import child Vue components
import ChildComponent from '@/components/ChildComponent.vue'

// 4. Interface and types imports
//    - ONLY types/interfaces (import type)
import type { User, EventItem } from '@/store/userStore'
import type { ViewCalendar } from '@/store/calendarStore'

// 5. Main (props, emits, etc.)
defineProps<{ items: Item[] }>()
defineEmits<{ update: [value: string] }>()

// 6. Vars and const
const isOpen = ref(false)
const loading = ref(false)

// 7. Watch
watch(() => props.items, (val) => { /* ... */ })

// 8. Computed
const filtered = computed(() => items.value.filter(...))

// 9. OnMounted
onMounted(() => { loadData() })

// 10. Functions (named parameters pattern)
function loadData(params: { force?: boolean }) { /* ... */ }
</script>
```

**Rules:**
- Each section **must** have its numbered comment (`// 1.`, `// 2.`, etc.)
- Section 1 groups **all** value imports (no types)
- Section 4 is **exclusively** `import type`
- ⚠️ **Ionic imports go in section 1**, never in section 4

### Frontend (Vue Components): Controller vs Composable Decision

Determines when to use a **controller** vs a **composable**:

| Scenario | Use | Example |
|-----------|------|---------|
| Pure business logic (CRUD, calculations, rules) | Controller | `accountsController.getAccounts()` |
| Reactive state + logic (ref, computed, watch) | Composable | `useAccountSelection({ items, getAccountId })` |
| Pinia store access + logic | Controller or Composable | `budgetDayStore.saveBudgetData()` in controller |
| Shared logic across multiple components | Composable | `useAttachments`, `useDatePicker` |
| Operations that do NOT need Vue state | Controller | `budgetEntriesController.getEntries()` |
| Operations that DO need reactive state | Composable | `useDeleteConfirm({ onConfirm })` |

**General rule:** If you need `ref`, `computed`, `watch`, or `onMounted` → **composable**.
If you only need pure functions or data access → **controller**.

---

### Frontend (Vue Components): Ionic Imports

All Vue components that use Ionic components in their template **must explicitly import** those components in **section 1** (`// 1. Imports (ionic/vue/ionicons)`) of the script.

```ts
// ✅ Correct — imports what the template uses in section 1
import { IonButton, IonContent, IonDatetime, IonPopover } from '@ionic/vue'

// ❌ Incorrect — uses IonDatetime in template but does not import it
// (TypeScript cannot infer types: $el is never, methods reset/confirm/cancel do not exist)

// ❌ Incorrect — importing Ionic in section 4 (types)
```

> Ionic Vue registers components globally via `app.use(IonicVue)`, but TypeScript needs the import in **section 1** to correctly infer types (e.g. `InstanceType<typeof IonDatetime>`, access to `$el`, methods like `reset()`, `confirm()`, `cancel()`).

### Frontend (Ionic): Ionic-First Layout

Prefer Ionic layout utilities over custom CSS:

- `ion-grid` / `ion-row` / `ion-col` for responsive layout (never manual flexbox for page layout)
- Utility classes: `ion-padding-*`, `ion-margin-*`, `ion-text-*`, `ion-justify-content-*`, `ion-align-items-*`
- `ion-list` with `ion-item` for forms instead of `<div>` with CSS
- `ion-card` for cards
- Modals: `ion-modal` with `ion-header` + `ion-content`
- Popovers: `ion-popover` with `ion-content`
- Do NOT use `<div>` with manual styles when an equivalent Ionic component exists

## Commit Policy

NEVER create git commits unless the user explicitly requests it. This overrides any skill or workflow that suggests committing as a final step.

## Ticket / Issue Policy

NEVER create or edit GitLab tickets (or any external issue/ticket) without the user explicitly asking for it. Creating a ticket is a mutation an agent must never do on its own initiative — even when a finding, follow-up, or proposal seems obvious. If you think a ticket is warranted, propose it in the conversation and ask the user first; only create it after an explicit request. This also covers branch names derived from tickets: do not branch off a ticket that was not requested.

This rule exists because tickets (unlike code) are project-planning artifacts the user owns: content, priority, and even whether an item deserves a ticket are the user's decisions, not the agent's. The same applies to changelog/package edits that imply a release decision — propose, don't act.


---

## Anchored Summary — Event Creation Modal Calendar Fix (2026-06-22)

### Goal
- Fix event creation modal: clicking "Disponibilidad" replaces form with mobile calendar; tapping a time slot on calendar returns to form with selected time.

### Constraints & Preferences
- Mobile calendar must replace form in same modal (no new modal), hidden behind "Disponibilidad" button in "Tiempo" list header
- Header must stay fixed (title + close/save) when calendar is shown
- Calendar must not have `ion-card` wrapper, must fill available space, must support touch
- Must work consistently after page reload (not only after HMR)

### Progress
#### Done
- Removed conditional header (kept single fixed header with title + close/save)
- Removed `<br />` separator tags between form sections
- Removed `:fullscreen="true"` from `ion-content` and its default padding
- Removed fixed `height: 84dvh` from `.container`
- Moved calendar button from toolbar header to "Tiempo" `ion-list-header` as text button "Disponibilidad" (mobile only)
- Removed `slot="end"` from button (not supported by `ion-list-header`)
- Removed unused `calendarOutline` import
- Replaced form + mobile-calendar dual-template with single `ion-grid` + two responsive `ion-col`
- Removed `ion-card` wrapper around calendar, replaced with flex `.calendar-wrapper`
- Fixed `.calendar-column` with `display: flex; flex-direction: column` and `.calendar-wrapper` with `flex: 1; min-height: 0`
- Changed breakpoint from `< 992` to `< 768` in `AddEventCompoenent.vue` (3 occurrences)
- Moved FullCalendar options from `selectable: false`/`selectAllow: () => true` / `longPressDelay: 180` mobile / `editable: false` mobile to match CalendarPage behavior

#### In Progress
- (none)

#### Blocked
- Touch on time slots in timeGridDay may still not fire `dateClick` reliably

### Key Decisions
- Used `ion-grid` + `ion-row` + `ion-col` with `v-show` instead of two separate templates to keep layout intact
- Used `v-show` on columns rather than `:size="0/12"` to avoid DOM collapse issues
- Removed `setOption` watch for `selectAllow` (unnecessary with `() => true` + `select` callback guard)
- Changed tap detection to use `select` callback as primary: on mobile only emit if duration ≤ 30 min (single slot), otherwise `unselect()`

### Next Steps
- Test with Playwright CLI: verify tap on mobile time slot fires `select` callback and closes calendar with correct time ✅ **DONE**
- Verify fix works after full page reload (not just HMR)

### Critical Context
- `dateClick` may not fire on time slots even with `selectable: true`; `select` callback is used as fallback
- `selectAllow` returning `() => true` allows all selections; filtering done in `select` callback
- `select` on mobile for single slot gives `start=9:00`, `end=9:30` (slot duration), so `isDrag` check uses `> 30 min` threshold
- FullyCalendarVue3 uses `height: 'parent'` so calendar must have an explicit-size parent container
- `touch-action: manipulation` set on `.fullcalendar-wrapper` to prevent double-tap zoom

### Relevant Files
- `front/src/components/events/add/AddEventCompoenent.vue`: event form modal with responsive form/calendar layout
- `front/src/components/calendar/fullcalendar/FullyCalendarVue3.vue`: FullCalendar wrapper with touch/click callbacks
- `front/src/views/calendar/CalendarPage.vue`: main calendar page (reference for working touch behavior)

## Pi lifecycle command guard (gentle-ai)

> **Histórico (gentle-pi v2.2.0):** este guard era un problema de la extensión
> gentle-pi v2.2.0 y fue eliminado en la v2.3.0. Con la versión actual los comandos
> compuestos (con `&&`, `;`, `|`, backtick o `$(`) ya no se bloquean. Esta sección
> se conserva como referencia histórica únicamente.

`git commit` / `git push` / `glab mr ...` desde el bash tool se bloquean si el
comando tiene `&&`, `;`, `|`, backtick o `$(` (reporte: "Compound or wrapped
lifecycle command ... must fail closed"). NO tiene que ver con RDD; RDD off no
bloquea. El guard es stateless: cada comando se evalúa de forma aislada, no queda
"trabado" tras un bloqueo.

Fix: un solo comando directo, sin `&&` ni `cd`, preferiblemente
`git -C <ruta-absoluta> <subcommand> -m "mensaje de una sola linea"`.
IMPORTANTE: el mensaje del `-m` debe ser UNA sola linea (sin saltos de linea);
un cuerpo multilinea introduce un `\n` sin comillar que dispara el mismo bloqueo.
Si un comando "simple" sigue bloqueando, no es estado persistido: tiene algun
control-char sin comillar (`;`, `|`, `&`, backtick, `$(` o `\n`) en la linea.
