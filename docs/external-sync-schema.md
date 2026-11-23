# The external sync tables: identity key and due dates

> Contract of the tables that mirror Google, CalDAV and ICS data into
> LifeLine (`external_events`, `external_tasks`, `external_contacts`). This
> file is the durable record of the decisions below: the agent's task notes
> live in `odd/` (not versioned) and must not be the only place where a
> decision is written down.

## The identity key

**A row of an external table is identified by its source, its collection and
its external uid — indexed as `(calendar_source_id, uid_hash)`.**

| Rule | Where it lives |
|---|---|
| `uid_hash` is the SHA-256 of `collection_href` and `external_uid`, separated by a NUL byte | `back/app/Support/ExternalUidHash.php` |
| `uid_hash` is derived, never written by hand: the models recompute it on every save | `back/app/Models/Concerns/HashesExternalUid.php` |
| A row **without** a collection keeps a `NULL` hash | `ExternalUidHash::for()` |
| The unique index is `unique(calendar_source_id, uid_hash)` | the three `create_external_*_table` migrations and `2026_11_22_000002_add_uid_hash_to_external_tables.php` |

Why a hash and not the columns themselves: the identity is
`(calendar_source_id, collection_href(1024), external_uid(512))`, which needs
about 6144 bytes in a `utf8mb4` index — above the 3072-byte InnoDB limit of
MySQL 8. The MariaDB in use tolerates it, MySQL 8 does not, so the schema was
made portable instead of relying on the engine in production.

Why not a prefix index: a unique index over a prefix compares only the
prefix, so two different hrefs that share their first 191 characters would
collide, and a legitimate row could be rejected. A hash keeps the guarantee.

The key costs 264 bytes (an 8-byte bigint plus a 64-character hash), so it
fits every supported engine with room to spare.

### The NULL case

`collection_href` is nullable, and neither MySQL nor SQLite treats two NULLs
as equal inside a unique index. The old composite index therefore allowed
repeated rows for a source without a collection; the hash keeps that
behaviour (`uid_hash` stays `NULL` there, and NULLs never collide). Do not
"fix" this by hashing the NULL away: it would start rejecting rows that were
always allowed.

### Existing databases

The three `create_external_*_table` migrations are edited, so a **fresh**
install never creates the over-long index. A database that already exists is
brought to the same shape by `2026_11_22_000002_add_uid_hash_to_external_tables.php`:
add the column, backfill the hash, drop the old index, add the new one. The
migration deletes no row and rewrites no identity.

### Rolling back

`down()` of the fix-up migration drops the hash column and restores the
original wide index — an index that **does not fit MySQL 8**, so the rollback
itself fails there (with the engine's own message). That is deliberate: the
rollback returns the schema to a state the new code no longer supports.
`down()` of the timezone migration drops `time_zone`; the stored `due_at` wall
clock stays, but the zone it belonged to is gone, and a later sync cannot
recover it for a row that is no longer being written.

## Due dates of external tasks

**`external_tasks.due_at` is a wall clock, and `external_tasks.time_zone`
names the zone that wall clock belongs to.**

| Rule | Where it lives |
|---|---|
| The sync stores the local wall clock of the due date, never a shifted one | `CalendarSyncService::dueParts()` |
| `time_zone` holds the name of that zone (`UTC`, `America/New_York`, `-03:00`) | `external_tasks.time_zone` |
| The API returns `due_at` as an ISO 8601 string **with the offset of that zone**, plus `time_zone` | `back/app/Http/Controllers/ExternalEventController.php` |
| The model reads the pair back as an instant | `ExternalTask::dueAtInTimezone()` |

The `datetime` cast re-reads `due_at` in the application timezone, so the
cast alone cannot answer "when is this task due": it only knows the wall
clock. The pair (`due_at`, `time_zone`) is what describes the instant, and
`dueAtInTimezone()` is the only supported way to read it. A task due at 09:00
in New York and a task due at 09:00 in Madrid are different rows now, and
they stay different.

### Rows written before the change

`2026_11_22_000001_add_time_zone_to_external_tasks_table.php` fills
`time_zone` with the application timezone (`UTC`) for the rows that have
none. Their wall clock was written in the application timezone, so their
instant is preserved and **no stored `due_at` is rewritten**.

One exception, self-healing: a row that came from CalDAV was stored with the
**source's** local wall clock, so anchoring it to the application timezone
shifts its instant by the offset of that zone. The next sync of the
collection rewrites both fields from the source, and the row is correct
again.

## The three kinds of source

The account can hold three kinds of external source, and the frontend keeps
them apart because they are not the same thing:

| Kind | `calendar_sources.type` | Where it lives in the app |
|---|---|---|
| A Google account (OAuth) | `google` | Settings → Cuentas → **Google Calendar** |
| A calendar published as an ICS URL | `ics` | Settings → Cuentas → **Calendario por URL (ICS)** |
| A CalDAV server | `caldav` | Settings → Cuentas → **CalDAV** |

An ICS feed belongs to no provider (Google, Fastmail, Proton, iCloud or a
private server can all publish one), so it is a section of its own and not a
kind of Google account. The frontend classifies the sources by their `type`;
the backend stores the three types separately.

## Checking an ICS feed by hand

The URL of an ICS feed has to be **public**: the SSRF guard
(`back/app/Traits/ValidatesPublicUrl.php`) rejects `localhost` and every
private range, so a file served from your own machine will not work.

A feed that is public and needs no account:

```
https://www.calendarlabs.com/ical-calendar/ics/76/US_Holidays.ics
```

The path to check it, from the UI:

1. Settings → Cuentas → **Calendario por URL (ICS)** → *Agregar*.
2. Name it (`Días festivos`) and paste the URL → *Guardar*. The app tests
   the URL first, then creates the source and syncs it.
3. The connection appears under its own section as "URL ICS guardada", and
   the events of the feed show up in the calendar (27 events for the feed
   above).

The same thing from the API, with the owner of the sources:

```
GET /api/v1/calendar-sources?calendar_owner=<sub>   # the source, type "ics"
GET /api/v1/external-events?calendar_owner=<sub>     # the imported events
GET /api/v1/external-tasks?calendar_owner=<sub>      # the VTODOs of the feed
```

A feed with tasks is rare in the wild; the `VTODO` path is covered by the
backend tests (`back/tests/Feature/ExternalReminderCaptureTest.php`).

## Client-visible API changes

- `GET /api/v1/external-tasks` returns `due_at` with the offset of the
  task's own zone (before: the offset of the application timezone) and adds a
  `time_zone` field.
- The frontend reads `due_at` as an ISO 8601 string
  (`front/src/composables/useExternalSync.ts`); the instant it denotes does
  not change, only the offset it is written with.
