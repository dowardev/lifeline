# Default calendar and the calendar invariant

> Contract of the calendar invariant. This file is the durable record of the
> decisions below: the agent's task notes live in `odd/` (not versioned) and
> must not be the only place where a decision is written down.

## The invariant

**Every event belongs to exactly one calendar, and every account has exactly
one protected local default calendar.**

Concretely:

| Rule | Where it lives |
|---|---|
| Every account has exactly one **local** default calendar (`source_id === null`), named `Personal` | `back/app/Services/DefaultCalendarService.php` |
| The default calendar cannot be renamed nor deleted | `back/app/Http/Controllers/CalendarController.php` |
| Every event has a calendar (`events.calendar_id` is `NOT NULL`) | `back/database/migrations/2026_11_17_000001_enforce_event_calendar_required.php` |
| The client never sends `calendar_id: null` (it omits the key) | `front/src/controllers/eventController.ts`, `front/src/utils/calendarId.ts` |
| A `null` calendar in a write is resolved to the account's default, not rejected | `back/app/Http/Controllers/EventController.php` |

## Provisioning the default

Two idempotent triggers:

- **When the SSO user is resolved** (`ResolveSsoUser`): a failure is logged and
  the login is **not** broken; the account recovers through the lazy path.
- **Lazily** on `GET /api/v1/calendars`.

The slot is taken with a **bounded number of passes** (`COLLISION_PASSES = 3`)
to survive the unique-index race, and only **transient** database failures are
retried (deadlock / lock wait timeout: MySQL 1205/1213, SQLSTATE 40001, and the
PostgreSQL equivalents). Any other error surfaces: it is a real failure, not
contention.

A **mirrored** calendar (Google/Outlook) that holds the default slot gives it
up; a soft-deleted local default is restored. **The default is never a mirror.**

## Deleting a local calendar

`DELETE /api/v1/calendars/{id}` requires an explicit `strategy`. Without it the
request is a `422` and **nothing is deleted**.

- `strategy=delete_events` — deletes the calendar and its events.
- `strategy=move&destination_calendar_id=<id>` — moves the events to another
  **local** calendar of the same account and deletes the origin.

Rules that matter when touching this code:

- The whole deletion is **one transaction** (`DB::transaction(..., 3)` retries a
  concurrency error), and it **locks the source and the destination rows**
  (`lockForUpdate`) so a concurrent deletion cannot leave events pointing at a
  calendar that is disappearing.
- The destination must be **local** (`source_id === null`) and **not archived**;
  the default is the fallback only when it is local.
- The strategy travels in the **body and in the query string**: a proxy or a
  CDN can strip the body of a DELETE.
- Mirrored calendars are not deleted from here and are never a `move` target.

## Archived mirrors

An event that already lives in a **disconnected mirror** keeps its
`calendar_id` and stays editable. What is rejected is *attaching or moving*
another event to an archived calendar (`422`).

## Frontend

- The write payload omits `calendar_id` when there is none. A `null` never
  reaches the server.
- The picker falls back to the default when the selection is cleared.
- The local calendars UI lives in **Settings → Cuentas**
  (`front/src/views/settings/components/LocalCalendarsSection.vue`), not in the
  calendar page.

## Client-visible API changes

- `DELETE /api/v1/calendars/{id}` requires `strategy` (or
  `destination_calendar_id` with `strategy=move`).
- The calendar resource exposes `protected` and `local`.
- `events.calendar_id` is `NOT NULL`.
