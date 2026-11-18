# LBDS-292 — Calendario por defecto + todo evento pertenece a un calendario

Ticket: **LBDS-292** (Linear, proyecto LifeLine, team LBDS) — "Every event must belong to a calendar (auto-create a default on signup / first sync)".
GitLab: **issue #6** en `dowardev/lifeline` (migrado desde Linear, prioridad **High**, abierta).
**Cómo referirse a este ticket**: `LBDS-292` es el identificador canónico. **"#6" es el número del issue en GitLab de este proyecto y puede cambiar si se abre otro issue** — si alguien dice "vamos con #6", el ticket al que se refiere es LBDS-292 (este documento). La fuente de verdad del contrato funcional es la descripción de GitLab #6; este archivo es el espejo local + plan de ejecución + bitácora de decisiones.

Estado: **en implementación**. Rama: `feat/lbds-292-default-calendar`. MR: pendiente.

## Specs

Las specs son el contrato funcional. Cada una cita el texto literal del usuario
(o del issue) que la origina; no se reinterpretan.

**S1 — Calendario default siempre existente.**
> "el funcionamiento correcto es que siempre debe existir un calendario por defecto"

Un calendario default activo (`default = 1`, `archived_at IS NULL`) existe para
toda cuenta. Se crea automáticamente y de forma idempotente. Trigger: en el paso
que auto-provisiona el `users` row (`ResolveSsoUser`, sólo cuando la fila se
crea o se vincula) **y** de forma defensiva en `GET /api/v1/calendars`.

**S2 — Todo evento pertenece a exactamente un calendario.**
> "un evento nunca puede existir si un calendario asignado / relacion:1 calendario puede tener muchos eventos y un evento solo pertenece a un evento"

`events.calendar_id` es NOT NULL. `POST /events` sin `calendar_id` resuelve al
default del usuario; `PUT /events/{id}` con `calendar_id: null` **no** borra la
asociación: resuelve al default. El cliente no manda `null`.

**S3 — El default es un elemento protegido.**
> "el calendario defaul tampoco se podra borrar"
> "el calendario por defecto debe ser un elemento protejido(no editable ni borrable)"

El calendario default no se puede renombrar (no hay columna `color` ni de
visibilidad en `calendars`: la protección abarca `name` y cualquier otro campo
editable) ni borrar, por ninguna vía (API o UI).

**S4 — Borrar un calendario del usuario ofrece exactamente dos opciones.**
> "cuando el usuario quiera borrar un calendario creado por el se le mostraran dos opciones:1-borrar calendario junto a sus eventos 2-mover eventos a otro calendario"

La API expone ambas estrategias en `DELETE /calendars/{id}`: `delete_events`
(borra el calendario y sus eventos) y `move` (reasigna los eventos a un
calendario local del usuario y luego borra el origen). El destino del `move`
sólo puede ser un calendario **local** (sin `source_id`) del mismo usuario; el
default es el destino natural cuando el usuario no elige. No existe la vía que
deja eventos huérfanos.

## Alcance de este ticket

Requisito del usuario (verbatim):

> el funcionamiento correcto es que siempre debe existir un calendario por defecto y un evento nunca puede existir si un calendario asignado
> relacion:1 calendario puede tener muchos eventos y un evento solo pertenece a un evento

> el calendario defaul tampoco se podra borrar,cuando el usuario quiera borrar un calendario creado por el se le mostraran dos opciones:1-borrar calendario junto a sus eventos 2-mover eventos a otro calendario

> el calendario por defecto debe ser un elemento protejido(no editable ni borrable)

*(El usuario escribió "un evento solo pertenece a un evento"; se entiende "un evento solo pertenece a un calendario" — la relación es 1:N de calendario a eventos.)*

Traducción a invariantes:

1. **Siempre existe un calendario por defecto** por usuario (incluido el flujo read-only `guest:`), y se crea automáticamente.
2. **Un evento nunca existe sin calendario**: `events.calendar_id` es NOT NULL. Un calendario tiene muchos eventos; un evento pertenece a **exactamente uno**.
3. **El calendario por defecto es un elemento protegido**: no se puede editar (nombre, color, visibilidad) ni borrar, por ninguna vía (API o UI).
4. **Borrar un calendario creado por el usuario** ofrece exactamente dos opciones: (1) borrarlo junto a sus eventos, (2) mover sus eventos a otro calendario y luego borrarlo. No existe la vía que deja eventos huérfanos.

## Decisiones de diseño

### Calendario por defecto protegido

- Precedente: Google Calendar y Outlook/Microsoft 365 **protegen el calendario primario contra el borrado** (en Google se lo puede renombrar y recolorear; en Outlook es una carpeta especial). La decisión de LifeLine es **más estricta**: ni editable ni borrable.
- Invariante ya implementada: `calendars.default_user_id` (columna generada) + índice único `calendars_default_user_id_unique` garantizan **a lo sumo un** default activo por usuario (`2026_10_19_000002_add_source_id_to_calendars_table.php`, LBDS-305; issue #12/P2). Lo que falta es la **existencia** del default (auto-provisión).

### Política de borrado de un calendario del usuario

- Las dos opciones terminan con el calendario borrado; difieren en qué pasa con sus eventos.
- La **opción 1** (borrar con los eventos) sale gratis con la FK actual: `events.calendar_id -> calendars.id` tiene **`onDelete('cascade')`** (`2021_09_08_025810_create_events.php:38`).
- La **opción 2** (mover) necesita reasignación explícita antes del delete: `UPDATE events SET calendar_id = <destino>` y recién después borrar el origen.
- **El destino debe ser un calendario local** del usuario: una fila espejada de fuente externa (Google/CalDAV, vía `calendar_sources`) no es destino válido — un evento local colgado de un calendario externo contradice el sync de la fuente.
- El default es el destino natural cuando el usuario no elige explícitamente.
- La API tiene que expresar ambas estrategias (p. ej. `DELETE /calendars/{id}` con estrategia y, para el move, el id de destino).

### Precedente de industria (para el implementador)

- Google Calendar: el primario no se borra; borrar un secundario **borra sus eventos** con confirmación explícita ("se van a eliminar N eventos") y red de seguridad (Papelera, ~30 días). El "borrar calendario y eventos" también ofrece **mover los eventos a otro calendario**. Nunca deja eventos huérfanos.
- Outlook/Microsoft 365: el calendario default del buzón no se borra; borrar un calendario compartido borra sus ítems con aviso. Los calendarios SharePoint/Teams ofrecen "borrar sólo el calendario" → eventos **huérfanos** (el estado que el invariante 2 prohíbe).
- iCloud: en compartidos, "quitar" (conserva eventos) o "borrar" (los lleva).

### Contrato con el cliente (ya mergeado)

GitLab #2 / #3 (`922835a`, "fix(front): keep calendar-less events out of calendar 1") dejaron el cliente honesto: `calendar_id: null` significa "sin calendario" y **nunca** se coerce a otro id (`front/src/utils/calendarId.ts` → `resolveCalendarId`; `front/src/utils/calendarEventItem.ts` → `normalizeEvents` / `eventToEventItem`).

**Bajo el invariante 2 ese estado es inválido**: cuando este ticket aterrice, `null` debe resolverse al default o ser rechazado, nunca persistirse. El cliente debe dejar de mandar `null` en create y en update.

Backend relacionado (a cambiar en este ticket):

- `back/app/Http/Controllers/EventController.php:26` — POST acepta `integer|nullable`.
- `:35` — el check de ownership se saltea cuando `calendar_id` es null.
- `:142-143` — PUT con `calendar_id: null` **pone la columna en null** (hoy ese es el mecanismo de "desasociar"). Bajo el invariante 2 hay que rechazarlo o resolverlo al default.
- `back/app/Http/Controllers/EventController.php:89` — PUT: `sometimes|integer|nullable`.

Frontend relacionado:

- `front/src/controllers/eventController.ts` — `createEvent` / `updateEvent` (manda `null` hoy).
- `front/src/components/events/add/AddEventCompoenent.vue` — `preSelectCalendar()`: hoy distingue `null` (explícito) de `undefined` (no cargado) y **preserva el `null`**; además el picker permite "vaciar la selección" → es la afordancia a revisar: si todo evento debe tener calendario, esa operación deja de existir (o se traduce a "mover al default").
- `front/src/utils/calendarId.ts` — helper con el contrato (`null` = sin calendario). **Alinear con este ticket**: `null` pasa a ser un estado transitorio/inválido, no permanente.

### Decisiones cerradas (2026-11-17, confirmadas por el usuario)

- **Nombre del default**: `"Personal"` (open question #1 de GitLab #6 → resuelta).
- **Trigger de auto-provisión**: en el paso de auto-provisión del `users` row
  (`ResolveSsoUser`) **y** de forma defensiva en `GET /api/v1/calendars`
  (open question #2 → resuelta).
- **Cuentas read-only / `guest:`**: toda fila de `users` recibe default. El
  prefijo `guest:` de LifeLine es un *owner* de calendario externo
  (`ResolveCalendarOwner`), no un tipo de cuenta de LifeLine: no existe una
  cuenta read-only separada, así que la invariante "cada cuenta tiene un
  default" se cumple para todas las cuentas reales (open question #3 →
  resuelta).
- **Filas huérfanas actuales**: los `events` con `calendar_id IS NULL` se
  migran al default de su usuario (no son fixtures: son datos reales creados
  por el bug de LBDS-231).
- **`PUT /events/{id}` con `calendar_id: null`**: se **resuelve al default**
  (no se rechaza), para que el cliente no pueda dejar un evento desasociado.
- **Calendarios espejados (`source_id IS NOT NULL`)**: no se borran vía la API
  de calendarios (los gestiona el ciclo de vida de `calendar_sources`, LBDS-305);
  borrarlos en cascada llevaría consigo eventos del usuario de forma
  surprising.

## Tareas

| # | Tarea | Specs | Ruta | Commit |
|---|---|---|---|---|
| T1 | Migración: backfill de huérfanos + `events.calendar_id` NOT NULL | S2 | back | WU-1 |
| T2 | Auto-provisión del calendario default (trigger SSO + `GET /calendars`) | S1 | back | WU-1 |
| T3 | Validación: POST/PUT de eventos resuelven el default; `null` no se persiste | S2 | back | WU-1 |
| T4 | Default protegido: no editable ni borrable | S3 | back | WU-2 |
| T5 | Borrado de calendario del usuario con las dos estrategias (cascade / move) | S4 | back | WU-2 |
| T6 | Cliente: dejar de mandar `calendar_id: null`; resolver al default | S2 | front | WU-3 |
| T7 | UI: modal de borrado con las dos opciones + destino sólo local | S4 | front | WU-4 |
| T8 | UI: default no editable ni borrable (ocultar acciones) | S3 | front | WU-4 |
| T9 | Migración de las filas huérfanas (`id = 1`, `id = 2`) | S2 | back | WU-1 |
| T10 | Tests (backend feature + front unit) de cada regla | S1-S4 | back/front | WU-1..WU-3 |
| T11 | CHANGELOG + review pre-merge | S1-S4 | root | WU-4 |

**Work units**: WU-1 = backend núcleo (T1, T2, T3, T9) · WU-2 = backend borrado/protección
(T4, T5) · WU-3 = contrato del cliente (T6) · WU-4 = UI de calendarios (T7, T8) ·
WU-5 = cierre (T11).

**Commits** (rama `feat/lbds-292-default-calendar`):

| Work unit | Commit |
|---|---|
| WU-1 | `1f04a17` feat(back): provision a default calendar and require one per event |
| WU-2 | `7828787` feat(back): protect the default calendar and offer two ways to delete a calendar |
| WU-3 | `817bb5b` feat(front): never send a null calendar_id and speak the delete contract |
| WU-4 | `19015d2` feat(front): manage the local calendars from settings |
| WU-5 | `28a6339` docs: record LBDS-292 in the changelog and the feature document |
| WU-6 (review 1) | `ff72916` fix(back): restore a soft-deleted default calendar instead of failing |
| WU-7 (review 1) | `c75dbd4` fix(back): make the calendar deletion atomic and stop masking database errors |
| WU-8 (review 2) | `53854ae` fix(back): require an explicit delete strategy and reject unusable calendars |
| WU-9 (review 3) | `eb222dd` fix(back): survive transient database contention and never hand out a mirror as the default |

## Estado

- [x] Invariantes y decisiones definidos y anotados en GitLab #6 (fuente de verdad del contrato)
- [x] Precedente Google / Outlook / iCloud relevado
- [x] Decisiones cerradas (nombre "Personal", trigger SSO + `GET /calendars`, guests, huérfanos)
- [x] Auto-provisión del default (`DefaultCalendarService` + trigger SSO + lazy en `GET /calendars`)
- [x] `events.calendar_id` NOT NULL (migración + backfill de los huérfanos)
- [x] Política de borrado con las dos opciones (`delete_events` / `move`)
- [x] Cliente sin `calendar_id: null`
- [x] Tests (backend feature + front unit)
- [x] CHANGELOG
- [ ] MR (el usuario decide el push / PR / merge)

### Límites de slice (delivery strategy)

- **WU-1** (backend núcleo) = 839 líneas: el documento del feature (191) + el
  servicio de default-provisión + el middleware + los controladores + la
  migración del schema + los tests de S1/S2. Supera el target de ~400
  líneas porque arrastra el documento del feature y la migración con el
  backfill de datos; se acepta como una sola unidad (servicio + schema +
  sus tests son el mismo comportamiento).
- **WU-2** (backend borrado/protección) = 385 líneas ✓
- **WU-3** (contrato del cliente) = 165 líneas ✓
- **WU-4** (UI de calendarios) y **WU-5** (cierre) se mantienen por debajo
  del target.

## Notas de reconocimiento

- `events.calendar_id`: `unsignedInteger` nullable (`2026_06_10_000003_remove_calendar_id_default.php` la volvió nullable a propósito; antes era `default(1)`), FK a `calendars` con `onDelete('cascade')`.
- `calendars.default` (boolean) + invariante DB de un default activo por usuario (LBDS-305).
- `calendar_sources` → espejo en `calendars` con `source_id` + `archived_at` (LBDS-305): las filas espejadas **no** son calendarios locales válidos como destino de un "move".
- El picker unificado (locales + externos con badge de tipo/cuenta) ya existe: LBDS-305 / GitLab #7.
- Precedente de UI del picker: `front/src/components/events/add/AddEventCompoenent.vue` (`preSelectCalendar()`).

## Trampas del entorno (medidas en este repo)

- **La CI puede no correr**: los runners SaaS de gitlab.com compartido se quedan sin cuota → los jobs fallan con `ci_quota_exceeded` sin arrancar, y el gate "pipelines must succeed" bloquea el merge. Workaround usado: bajar `only_allow_merge_if_pipeline_succeeds`, mergear, restaurarlo (verificar que vuelva a `true`).
- **`frontend_lint` corre `lint:check` sobre todo el repo** (`oxlint . && eslint .`): la deuda preexistente (GitLab #15) puede hacer fallar el job por código ajeno al cambio.
- **`pnpm run build` está roto** (GitLab #16: `vue-tsc` con 64+ errores preexistentes). No bloquea el job de tests (el build de e2e usa `vite build` directo, sin `vue-tsc`), pero ensucia cualquier build local. Baseline medido en `main`: **67 errores de `vue-tsc`**, 0 nuevos permitidos.
- **No correr `oxfmt` sobre archivos tocados**: `.oxfmtrc.json` pide `semi: true` y el código commiteado no usa semicolons → reformatea el archivo entero (~700 líneas de ruido). Si hay que formatear, hacerlo sólo sobre líneas nuevas.
- Los tests de front corren con `pnpm run test:unit` (vitest, ~16 min la suite completa: el costo es el entorno jsdom por archivo).

## Log

- **L1** (usuario, verbatim): "el funcionamiento correcto es que siempre debe existir un calendario por defecto y un evento nunca puede existir si un calendario asignado / relacion:1 calendario puede tener muchos eventos y un evento solo pertenece a un evento".
- **L2** (usuario, verbatim): "ok actualiza #6 pero tambien quiero dejar claro que el calendario por defecto debe ser un elemento protejido(no editable ni borrable)".
- **L3** (usuario, verbatim): "ok,entonces lo que haremos nosotros,el calendario defaul tampoco se podra borrar,cuando el usuario quiera borrar un calendario creado por el se le mostraran dos opciones:1-borrar calendario junto a sus eventos 2-mover eventos a otro calendario".
- **L4** (decisión): el default es protegido y **no editable** (más estricto que Google/Outlook, que permiten renombrarlo).
- **L5** (decisión): borrado de calendario del usuario → dos opciones exactas; sin vía que deje huérfanos.
- **L6** (decisión): el destino del "move" es un calendario **local**; el default es el fallback natural.
- **L7** (contexto): GitLab #2 / #3 mergeados (`922835a`) dejaron el cliente honesto (`null` = sin calendario). Este ticket debe convertir ese estado en uno inválido: `null` → default o rechazo. Contrato del helper en `front/src/utils/calendarId.ts`.
- **L8** (precedente): Google Calendar y Outlook protegen el calendario primario; borrar un secundario es destructivo con confirmación; Google ofrece además "mover los eventos a otro calendario". Los precedents de "conservar eventos" (iCloud quitar, SharePoint borrar-sólo-calendario) dejan huérfanos → prohibidos por el invariante 2.
- **L9** (decisión, 2026-11-17, confirmada por el usuario): el default se llama **"Personal"**; se auto-provisiona en el paso de provisioning del `users` row **y** defensivamente en `GET /api/v1/calendars`; **toda** cuenta (incluido el flujo read-only) recibe default; los `events` huérfanos actuales se migran al default de su usuario; `PUT /events/{id}` con `calendar_id: null` se resuelve al default en lugar de rechazarse; los calendarios espejados (`source_id` presente) no se borran vía la API de calendarios.
- **L10** (usuario, verbatim): "ok,comienza" — luz verde para implementar según el resumen y las decisiones propuestas.
- **L11** (decisión, 2026-11-17, confirmada por el usuario): la UI de borrado de calendarios vive en **Settings → Accounts**, como una sección nueva **"Calendarios locales"** (la vista que ya administra las conexiones externas Google/CalDAV). No se replica en `CalendarPage`.
- **L12** (autorización, 2026-11-17, confirmada por el usuario): el usuario **autoriza commits por unidad de trabajo** en la branch `feat/lbds-292-default-calendar` (override puntual del "nunca commitear sin pedido explícito" del AGENTS.md del repo), para que cada unidad sea revisable y sea el candidato de la review nativa.
- **L13** (verificación independiente, 2026-11-17): `gentle-ai-verify` ejecutó la ruta MySQL de la migración sobre una base scratch (MySQL/MariaDB real): todas las cuentas quedan con un default local "Personal", los eventos sin calendario (incluidos los soft-deleted) se mueven a su default, la columna queda NOT NULL (un INSERT con NULL es rechazado) y el `rollback` devuelve la columna nullable. La suite backend quedó verde (130 tests, 340 assertions).
- **L14** (defecto encontrado por la verificación y corregido): la columna generada `default_user_id` **no mira `deleted_at`**, así que un default soft-deleted seguía ocupando el slot único y `ensureForUser` reventaba con violación del índice. El default es un elemento protegido que no se puede borrar: ahora `ensureForUser` **restaura** la fila trashed en vez de reemplazarla (reemplazarla llevaría por cascada los eventos que la apuntan). Cubierto por `test_a_soft_deleted_default_is_restored_instead_of_blocking_the_account`.
- **L15** (review nativa, 2026-11-17): la review nativa (4 lentes: risk, resilience, readability, reliability) corrió sobre `origin/main..HEAD` y cerró **escalada** (`native_stop_required`, causalidad desconocida) con 3 hallazgos severos escalados (R1-1, R1-2, R4-5) y 1 **corroborado** (R3-2: el borrado de un calendario no era atómico). Se corrigió el corroborado y su escalado hermano: el borrado (move + delete) ahora corre dentro de una transacción, con test de regresión (`test_a_failed_move_leaves_the_calendar_and_its_events_untouched`). Además se endureció `ensureForUser`: sólo reintenta ante la violación del índice `default_user_id` (R1-4), y cualquier otro error de base emerge en vez de enmascararse como carrera.
- **L16** (hallazgos escalados en la 1ª review, pendientes de decisión del mantenedor):
  - **R1-1** (CRITICAL, risk): "permite mover eventos al calendario default aunque ese default sea un espejo (`source_id !== null`)". **Falso positivo**: `resolveMoveDestination` ya aborta con 422 cuando el default es un espejo (`CalendarController.php:145-152`).
  - **R1-2** (CRITICAL, risk): "usa `forceDelete()` en eventos y calendario, salteando soft delete, observers y audit trail". Decisión de diseño deliberada de este ticket (un evento soft-deleted apuntando a un calendario trashed es exactamente el estado "evento sin calendario" que la invariante prohíbe) → el refutador de la 2ª review la **refutó** (ver L18): la decisión queda cerrada a favor del diseño.
  - **R4-5** (CRITICAL, resilience): "el borrado no es transaccional". **Corregido** junto con R3-2.
- **L17** (segunda review nativa, 2026-11-17, lineage `review-4b91144e75859972`): volvió a cerrar **escalada** con 2 hallazgos de causalidad desconocida:
  - **R4-2** (CRITICAL, resilience): "Calendar delete strategy sent in DELETE request body can be stripped by proxies/CDNs, causing unintended 'delete_events' instead of 'move'". **Corregido**: la estrategia ahora es **obligatoria** en el servidor (`required|in:delete_events,move`): si un proxy se come el body, la respuesta es 422 y **nada se destruye** (antes el default implícito borraba los eventos). El cliente la manda **en el query string y en el body**, y el contrato de `deleteCalendar` la exige. Test: `test_deleting_a_calendar_without_a_strategy_is_rejected`.
  - **R2-7** (CRITICAL, readability): "onCalendarSelectChange() cae a `getDefaultCalendar()?.id ?? null` ... el fallback null contradice la invariante". Ajustado: el comentario aclara que el `null` **nunca viaja al servidor** (el payload omite la clave y el servidor resuelve el default); con default disponible se elige el default, y sin default la clave se omite.
  - Además, por hallazgos no bloqueantes de la misma corrida: `trashedDefaultFor()` ahora exige una fila **local** (R3-2), `resolveCalendar()` **rechaza** un espejo desconectado (R3-4), el 403 de calendario externo ya no filtra detalle de arquitectura (R1-2) y la migración apunta a `DefaultCalendarService::DEFAULT_NAME` en un comentario (R2-1/R2-4).
- **L18** (nota de la 2ª review): el refutador **refutó** R1-1 (el `forceDelete` del borrado): "permanent deletion is the explicitly requested delete_events behavior, and the UI warns that the events will be deleted; no concrete retention-policy violation or unauthorized destruction is demonstrated". Es decir: la objeción de la 1ª review sobre `forceDelete` quedó sin sustento → la decisión de mantenedor planteada en L16 se cierra aceptando el diseño (con la transactividad ya garantizada).
- **L19** (tercera review nativa, 2026-11-17, lineage `review-3994332c9c581604`): las 4 lentes corrieron sobre el candidato `sha256:03514ad1…` y el refutador cerró la ronda **escalada** (`unknown_causality`) con 3 hallazgos severos escalados y 1 **corroborado**:
  - **R4-1** (CRITICAL, resilience, corroborado): "`ensureForUser()` no reintenta ante errores transitorios de base (deadlock, lock wait timeout), así que una falla transitoria de la escritura de aprovisionamiento convierte un request sano en un 500". **Corregido**: el INSERT de aprovisionamiento ahora reintenta hasta 3 veces **sólo** ante errores transitorios (errno MySQL 1213/1205 o SQLSTATE 40001, con espera creciente); cualquier otro error sigue emergiendo sin máscara.
  - **R3-2** (CRITICAL, reliability, causalidad desconocida): "la rama de colisión puede devolver un espejo como default protegido". **Corregido**: la rama de colisión sólo acepta un default **local** (`source_id === null`); si el slot lo tomó un espejo, el espejo cede el slot y se crea el default local. Cubierto por `test_the_protected_default_is_always_a_local_calendar`.
  - **R2-CalendarControllerDestroyComplexity** (CRITICAL, readability, causalidad desconocida): "`destroy()` creció a 100 líneas con HTTP + reglas + mutación". **Corregido**: la mutación se extrajo a `deleteCalendarWithStrategy()`; `destroy()` quedó con validación + transacción.
  - **R3-7** (SUGGESTION, reliability): el test de migración dejaba `events.calendar_id` nullable para el resto del proceso (el DDL no se revierte con la transacción del test). **Corregido**: el test restaura la columna NOT NULL al terminar.
  - Descartados por el refutador (falsos positivos, con prueba): R3-1 (un espejo trashed no puede restaurar el default: `trashedDefaultFor` exige `source_id` nulo), R3-3 (la migración usa el query builder, que **no** aplica el scope de soft delete: los eventos soft-deleted sí se migran), R3-8 (`ensureForUser` degrada el espejo y crea un default local), R2-DefaultCalendarServiceEnsureForUserComplexity, R2-LocalCalendarsSectionGodComponent (mantenibilidad, no violación del comportamiento pedido).
  - Descartados por análisis propio: **R3-4** (el `resolveCalendar()` **sí** aborta con 422 cuando `archived_at !== null`: el review leydo al revés), R2-AddEventComponentConflictingComments (el comentario obsoleto ya había sido reescrito en la ronda anterior).
- **L20** (cuarta review nativa, 2026-11-17, lineage `review-9fb472fe9aa5849f`): las 4 lentes corrieron sobre el candidato `sha256:3966b02f…` (incluye WU-9). El refutador cerró **escalada** (`unknown_causality`) con 2 hallazgos escalados y 1 **corroborado**:
  - **R3-ArchivedMirrorEventEditFailure** (CRITICAL, reliability, corroborado): "los eventos que viven en un espejo desconectado ya no se pueden actualizar (arrastrar/redimensionar) porque el backend rechaza el espejo archivado y el frontend sigue mandando el `calendar_id` del evento". **Corregido**: `resolveCalendar()` ahora distingue "adjuntar un evento a un calendario archivado" (422, se rechaza) de "un evento que **ya** vive en ese calendario" (se acepta: conserva su calendario y sigue siendo editable). Test: `test_an_event_that_already_lives_in_a_disconnected_mirror_can_still_be_updated`.
  - **R1-1** (CRITICAL, risk, escalado): "el destino explícito del `move` puede ser un espejo". **Falso positivo**: `resolveMoveDestination()` filtra el destino con `whereNull('archived_at')` **y** `whereNull('source_id')`: un espejo activo tiene `source_id`, y un espejo archivado tiene `archived_at` → ningún espejo puede ser destino.
  - **R1-2** (CRITICAL, risk, escalado): "el `forceDelete()` sin red de seguridad y la transacción pueden dejar la base inconsistente". **Falso positivo**: la objeción al `forceDelete` ya fue refutada en la ronda 2 (L18) y la transacción revierte **todo** si algo falla: no hay estado intermedio inconsistente.
  - Descartados por el refutador: R1-3 (el retry transitorio vive en `createDefaultCalendar()`, no en el `catch` externo), R1-4 y R4-2 (si el aprovisionamiento falla, la migración se aborta **antes** de tocar los huérfanos: la rama de borrado es inalcanzable), R4-1 (el índice se llama `calendars_default_user_id_unique`, nombre estable en el mensaje de MySQL).
- **L21** (quinta review nativa, 2026-11-17, lineage `review-937ab0eede7fa3cb`): las 4 lentes corrieron sobre el candidato `sha256:7735c055…` (incluye WU-10). El refutador cerró **escalada** (`unknown_causality`) con 1 hallazgo escalado y 1 **corroborado**:
  - **R4-1** (CRITICAL, resilience, corroborado): "el retry transitorio sólo cubre el INSERT: el SELECT inicial y el UPDATE que libera el slot pueden fallar con deadlock o lock wait timeout y abortar el request". **Corregido**: el retry transitorio pasó a envolver **toda** la secuencia de aprovisionamiento (`ensureForUser` reintenta `ensureLocalDefault`, que relee el estado en cada intento); el `INSERT` quedó como una escritura simple y la colisión del índice único se sigue resolviendo como carrera.
  - **R4-2** (CRITICAL, resilience, escalado): "la transacción del borrado no reintenta ante contención transitoria". **Corregido**: `DB::transaction(..., 3)` reintenta la transacción completa ante un error de concurrencia (la transacción revierte entera, así que un reintento arranca desde el mismo estado: nunca queda un calendario a medio borrar).
- **L22** (sexta review nativa, 2026-11-17, lineage `review-9604b73b03e935fe`): las 4 lentes corrieron sobre el candidato `sha256:e7d930eb…` (incluye WU-11). El refutador cerró **escalada** (`unknown_causality`) con 4 hallazgos escalados (todos de legibilidad o con ubicación no verificada) y 1 **corroborado**:
  - **R4-DefaultCalendarProvisioningCollision** (CRITICAL, corroborado): "el INSERT de respaldo (tras degradar un espejo) queda fuera del manejador de colisiones: si otra request toma el slot entre medias, ese INSERT vuelve a violar el índice único y el request termina en 500". **Corregido**: la resolución del slot pasó a ser un **bucle de pasadas** (`COLLISION_PASSES = 3`): cada pasada relee el estado, degrada un espejo si hace falta, restaura un default soft-deleted e inserta el default local; si el INSERT pierde la carrera, la pasada siguiente reintenta con el estado fresco. Si todas las pasadas pierden, se devuelve la fila ganadora (local) y, si tampoco la hay, se propaga el error.
  - Refutados por el refutador: R2-001 (el literal 'Personal' repetido en la migración es intencional: una migración histórica no debe depender de una constante mutable), R2-008 y R3-1 (la rama de colisión nunca devuelve un espejo como default), R3-3 (las filas soft-deleted también reciben un `calendar_id` activo, así que el NOT NULL no falla), R3-6 (el retry transitorio envuelve la secuencia completa, SELECT y UPDATE incluidos).
  - Nota de la corrida: dos intentos de la lente de legibilidad fueron rechazados en la admisión por un resultado malformado (faltaban campos obligatorios en un hallazgo) y el slot se re-ofertó hasta que el reviewer produjo un resultado admisible.
- **L23** (séptima review nativa, 2026-11-17, lineage `review-2f3ce98992158971`): las 4 lentes corrieron sobre el candidato `sha256:0dbadb0b…` (incluye WU-12). El refutador cerró **escalada** con 1 hallazgo escalado (R3-2, ubicación no verificada) y 1 **corroborado**:
  - **R4-1** (CRITICAL, corroborado): "el aprovisionamiento del default corre dentro de la resolución SSO: si agota los reintentos, el **login** falla; el fallback lazy de `GET /calendars` no puede recuperar un login que ya falló". **Corregido**: el aprovisionamiento del default en `ResolveSsoUser` ya no puede abortar el login: se captura el error, se registra (`Log::warning`) y la cuenta sigue usable; el default se aprovisiona después por la vía lazy (`GET /api/v1/calendars`) o al resolver el calendario del primer evento.
  - Refutados por el refutador: R3-1 (el ganador de las pasadas sólo se devuelve si es local), R3-3 (si falla el aprovisionamiento la migración se aborta antes de tocar los huérfanos), R3-4 (el borrado es atómico: la transacción revierte los `forceDelete` si falla el borrado del calendario).
  - Límite de la cobertura: el camino de fallo del aprovisionamiento (la rama `catch` del middleware) no tiene test automatizado porque no hay forma limpia de inyectar el fallo de base de datos en esa capa; queda demostrado por la vía lazy, que es la que recupera la cuenta.
- **L24** (octava review nativa, 2026-11-17, lineage `review-b5abf407636330b7`): las 4 lentes corrieron sobre el candidato `sha256:0aef8473…` (incluye WU-13). El refutador cerró **escalada** con 4 hallazgos escalados (ubicaciones no verificadas) y 1 **corroborado**:
  - **R3-2** (CRITICAL, corroborado): "la migración hace una búsqueda y un UPDATE por cada evento huérfano: con miles de huérfanos son miles de viajes a la base". **Corregido**: `reassignOrphanEvents()` ahora agrupa por cuenta: una query para las cuentas con huérfanos, una búsqueda del default y **un** UPDATE por cuenta → el costo escala con las cuentas, no con los eventos.
  - Refutados por el refutador: R1-3 (si el aprovisionamiento falla la migración se aborta antes de los huérfanos), R3-1 (el detector transitorio reconoce también 40P01/55P03 de PostgreSQL por mensaje), R3-10 (la transacción re-resuelve y re-valida el destino en cada reintento), R4-1 (el retry transitorio envuelve toda la secuencia) y R4-2 (Laravel reintenta sólo errores de concurrencia, no fallos de DNS o conexión).
  - Nota de la corrida: la lente de legibilidad fue rechazada dos veces en la admisión (payload malformado: un objeto JSON con campos faltantes y, después, varios objetos JSON en la misma respuesta); el slot se re-ofertó hasta que el reviewer produjo un resultado admisible.
- **L25** (novena review nativa, 2026-11-17, lineage `review-ef72b169dc51fa88`, sobre el candidato final `sha256:1f147f72…`): las lentes **risk, resilience y readability** corrieron y fueron admitidas sobre el candidato final; la lente **reliability no pudo cerrar**: el reviewer produjo cuatro payloads que el proveedor rechazó en la admisión (uno truncado a 112 bytes, dos con inspección de rutas fuera del candidato congelado y uno sin objeto JSON completo) y el slot se re-ofertó en cada caso hasta agotar los reintentos. Es un **defecto del provider/modelo**, no del código: la misma lente corrió sin incidentes en las rondas 5-8 sobre el mismo código, y la cobertura equivalente del candidato final quedó en las tres lentes admitidas más la suite backend (135 tests, 356 assertions) y los specs frontend (16 tests).
- **L26** (novena review, hallazgos abiertos): de las tres lentes admitidas sobre el candidato final, sólo **R4-3** era un defecto real: "la transacción del borrado resuelve el destino dentro de la transacción, y un borrado concurrente podría hacer desaparecer el destino entre la validación y el uso". **Corregido**: la transacción ahora **bloquea** (`lockForUpdate`) la fila del calendario origen y la del destino antes de mover un solo evento; si el destino desapareció en el meantime, la respuesta es 422 en vez de dejar los eventos en un calendario que se está borrando. Además, el detector transitorio reconoce también el mensaje de PostgreSQL (`lock timeout`) y las dos constantes de reintento están documentadas en su declaración.
  - Falsos positivos descartados con la evidencia del código: **R1-DeleteStrategyBodyStripping** (`Request::input()` fusiona el body con el query string — `getInputSource()->all() + $this->query->all()` — así que el valor leído por el controlador es EXACTAMENTE el mismo que validó `validate()`), **R4-1** (`defaultFor()` se llama DENTRO de `ensureLocalDefault()`, que es lo que envuelve el retry transitorio), **R2-5/R2-6** (los comentarios de `preSelectCalendar()` y de `resolveCalendarId()` describen exactamente el comportamiento implementado: el contrato de lectura no cambia y el de escritura omite el `null`), **R4-2** (si la base está caída, el request honestamente falla; ocultarlo escondería un fallo real).
- **L27** (décima review nativa, 2026-11-17, lineage `review-a3a1514451b4e3ef`, candidato `sha256:46ed969a…`): las **4 lentes** corrieron y fueron admitidas (la lente reliability que no había podido cerrar en la novena round sí cerró en esta). El refutador refutó 9 hallazgos (incluido **R4-3**, que confirma que el fix de bloqueo de filas quedó bien aplicado) y cerró la review **escalada** (`unknown_causality`) con 5 hallazgos escalados, todos descartados con evidencia del código:
  - **R4-2** (CRITICAL): "la transacción del borrado no reintenta ante contención transitoria" → falso positivo: `DB::transaction($callback, 3)` reintenta la transacción completa ante un error de concurrencia.
  - **R3-5** (CRITICAL): "el callback de la transacción captura `$request` por referencia" → falso positivo: la closure usa `use ($request, $calendar, $strategy)`, o sea **por valor**.
  - **R3-10** (CRITICAL): "`params.calendar_id ?? undefined` trata el `0` como `undefined`" → falso positivo: `??` sólo reemplaza `null`/`undefined`; el `0` se conserva (y no es un id válido).
  - **R3-9** (CRITICAL): "el picker puede dejar `calendarId` en `null` y ese `null` se manda al servidor" → falso positivo: la **ruta de escritura** arma `calendar_id: params.calendar_id ?? undefined` y `stripUndefined()` **elimina la clave**, así que el `null` nunca llega al servidor (el `null` se conserva sólo en la ruta de lectura, que es lo correcto: el servidor lo envió).
  - **R3-3** (CRITICAL): "el espejo archivado puede dejar el `calendar_id` del evento irresoluble" → comportamiento **diseñado**: el evento conserva su calendario archivado y sigue siendo editable; lo que se rechaza es **adherir o mover** otro evento a un calendario archivado.
- **Límite de slice (delivery strategy)**: la feature completa son **16 commits / 2509 líneas authored / 26 archivos** sobre `origin/main`. Es un único cambio de comportamiento (la invariante del calendario default) con su migración, su UI y sus tests; partirlo en MRs encadenados separaría la migración de la lógica que la invoca y dejaría el backend sin el default en los commits intermedios, que es exactamente el estado que la migración corrige. La estrategia aplicada es, entonces, **una sola unidad de entrega** con commits por unidad de trabajo ya reviewed (cada commit es revisable por separado), y el MR se abriría **en draft** apenas exista la rama.
- **L28** (undécima review nativa, 2026-11-17, lineage `review-64afc0566093e6b8`, candidato `sha256:c7da8364…`): el candidato es **idéntico en código** al de la décima round (sólo cambió el commit documental `6ea343b`). Las **4 lentes** corrieron y fueron admitidas; el refutador refutó 4 hallazgos y cerró **escalada** (`unknown_causality`) con 8 escalados, todos descartados con evidencia del código:
  - **R1-1 / R3-2** (CRITICAL): "el destino del `move` puede ser un espejo (un calendario espejado) y dejaría eventos locales bajo una fuente externa" → falso positivo: el destino explícito se filtra con `whereNull('archived_at')` **y** `whereNull('source_id')` (`CalendarController::resolveMoveDestination()`), y el default como fallback se rechaza explícitamente con `abort(422)` cuando `source_id !== null`.
  - **R1-2** (CRITICAL): "el `forceDelete` de eventos y calendario deja datos destruidos si la transacción falla en medio" → falso positivo: el borrado completo corre dentro de `DB::transaction(...)`, así que un fallo revierte los `forceDelete`; y el `forceDelete` es el contrato explícito de la estrategia `delete_events` (un evento no puede quedar apuntando a un calendario destruido).
  - **R3-3 / R3-5 / R3-9 / R3-10** (CRITICAL): son los mismos hallazgos ya descartados en la décima round (espejo archivado editable por diseño, captura por valor en la closure, `null` que la ruta de escritura elimina del payload, y `??` que no trata el `0` como `undefined`).
- **L29** (duodécima review nativa, 2026-11-17, lineage `review-93f3360cd24a6f1a`, candidato `sha256:3eeeed8e…`): el candidato es **idéntico en código** al de la undécima round (sólo cambió el commit documental `29e4801`). Por eso la única lente pertinente fue **readability** (lo único que había cambiado desde la review anterior es el documento de la feature). Resultado: **APROBADA** — el refutador refutó R2-7 y dejó los otros 11 hallazgos como **informativos (no bloqueantes)**: R2-1, R2-2, R2-3, R2-4, R2-5, R2-6, R2-8, R2-9, R2-10, R2-11 y R2-12. Ninguno abrió una corrección ni reabre la review: quedan como trabajo posterior aparte. La autoridad quedó **quemada** con el acknowledgement exacto (`native-approved-acknowledgement-completed`, evidencia `gentle-ai.review-acknowledged/v1`); la entrega sigue la política ordinaria del repositorio (push y MR son del mantenedor).
- **Estado de cierre**: 18 commits en `feat/lbds-292-default-calendar` (2520 líneas authored, 26 archivos), suite backend verde (135 tests, 356 assertions), specs frontend verdes, lint (`oxlint` + `eslint`) limpio sobre los archivos tocados, `pint` limpio en PHP, working tree limpio. Doce reviews nativas corridas; los hallazgos confirmados por el refutador están corregidos y verificados. Push y MR quedan como decisión del mantenedor.
