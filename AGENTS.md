# AGENTS.md - LifeLine

## Project Structure

Monorepo con dos directorios:

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

**Database:** MySQL (configurado en `.env`)

## Architecture

### Backend (`back/`)

- **Laravel 13** con PHP ^8.3
- **Autenticación:** Laravel Passport (OAuth2)
- **REST API:** axios en frontend, Laravel routes en backend
- **Build tool:** Vite
- `app/Http/Controllers/` — AuthController, CalendarController,
  EventController
- `app/Models/` — User, Event, Calendar, Tag, AdminTag, UserVerify
- `routes/api.php` — REST API endpoints
  (login, signup, CRUD eventos/calendarios)

### Frontend (`front/`)

- **Ionic 8** + **Vue 3** con Composition API
- **Capacitor 6** para soporte Android (app ID: com.dowardev.lifeline)
- **Axios** + **REST API** para comunicación API
- **Pinia** para manejo de estado
- **SQLite offline** con @capacitor-community/sqlite
- **i18n** con vue-i18n
- **PWA** con vite-plugin-pwa
- **Controladores** en `src/controllers/` — authController, eventController,
  taskController, etc.
- **Stores** en `src/store/` — Pinia stores
- **Vistas** en `src/views/` — home, calendar, documents, tasks,
  integrations, session, etc.
- **Nota:** Repo monorepo unificado con historial completo.
  `.git` en raíz.

## Code Conventions

### Frontend (TypeScript): Named Parameters Pattern

All functions must use a single `params` object instead of positional
parameters. Destructure inside the function body.

```ts
// ✅ Correct
function holaMundo(params: { objeto1: string; objeto2: number }) {
  const { objeto1, objeto2 } = params
}

// ❌ Wrong
function holaMundo(objeto1: string, objeto2: number) { ... }
```

> This pattern requires TypeScript. In plain JS the inline type
> annotation is invalid syntax — use JSDoc `@param` instead if needed.

### Frontend (Vue Components): Controller or Composable Communication

Vue components may contain any **local** logic (props, emits, computed,
watch, onMounted, reactive variables, internal functions, etc.) that is
internal to the component. However, any logic that is **shared** with
or reused by other parts of the application — such as API calls, store
access, or cross-component business logic — must go through
**controllers or composables**, depending on what best fits the case.
These are the bridge between Vue components and external application
layers.

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
import { useAuthStore } from '@/stores/auth'
const store = useAuthStore()

// ❌ Wrong — component calls API service directly
import { authApi } from '@/services/auth'
authApi.login(params)
```

### Frontend (Vue Components): Template Structure

All Vue components must follow the structure and rules defined in
`guides/TemplateView.vue`. Key sections in order:

**Template:**

- `<ion-page>` as root with `<ion-header>` and `<ion-content>`
- Content, modals, popovers, and alerts in dedicated comment-delimited
  sections

**Script (`<script lang="ts" setup>`):**

1. Imports (ionic/vue/ionicons)
2. Controllers / Composables
3. Components
4. Interface and types imports
5. Main (props, emits, etc.)
6. Vars and const
7. Watch
8. Computed
9. OnMounted
10. Functions (must use named parameters pattern)

## Commit Policy

NEVER create git commits unless the user explicitly requests it.
This overrides any skill or workflow that suggests committing as a
final step.
