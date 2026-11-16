// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { eventService } from '@/services/eventService'
import { externalEventService } from '@/services/externalEventService'
import type { ExternalCalendarEvent } from '@/services/externalEventService'
import { useEventStore } from '@/store/eventStore'
import { useAuthStore } from '@/store/authStore'
import type { EventItem } from '@/store/eventStore'
import { db } from '@/db'
import { getPendingMutations, clearPendingMutations } from '@/db/repository'
import { extractListRows } from '@/utils/listResponse'
import { sameEntityId } from '@/utils/entityId'
import { toServerRepeat } from '@/utils/repeat'
import { toPlainData, stripUndefined } from '@/utils/plainData'
import { resolveCalendarId } from '@/utils/calendarId'
import {
  createRepository,
  type RepositoryHooks,
} from '@/db/repository'
import {
  flush,
  registerReconciler,
  useOutboxProcessor,
} from '@/db/outboxProcessor'

/**
 * LBDS-231 — EventController is the first domain migrated onto the global
 * offline-first data layer. Server reads still come from `eventService`;
 * every write goes through the repository so the outbox replays it on
 * reconnect. The reconciler the processor calls swaps the optimistic
 * tempId (string) for the real server id and updates Pinia + Dexie so
 * the rest of the app sees the canonical row.
 */

// --- Repository wiring ---------------------------------------------------

interface ServerEventDto {
  id: number
  user_id: number
  title: string
  // GitLab #2 / #3 - the calendar is optional: a row can exist without
  // one until the server provisions the default calendar (LBDS-292).
  calendar_id?: number | null
  date_start?: string
  date_end?: string
  notifications?: string
  repeat?: string
  time_zone?: string
  guests?: string
  description?: string
  availability?: string
  id_reminders?: number[]
}

function buildHooks(): RepositoryHooks<EventItem> {
  const store = (): ReturnType<typeof useEventStore> => useEventStore()
  return {
    setItems: ({ items }): void => store().setEvents({ events: items }),
    addItem: ({ item }): void => store().addEvent({ event: item }),
    patchItem: ({ id, patch }): void =>
      store().updateEvent({ id: id as number, updates: patch }),
    removeItem: ({ id }): void => store().removeEvent({ id }),
  }
}

/**
 * LBDS-231 - normalises the Laravel EventResource response shape (camelCase
 * `name` / `dateStart` / `dateEnd` / `timeZone` + snake_case `calendar_id`)
 * into the snake_case `EventItem` shape the rest of the app consumes
 * (`title` / `date_start` / `date_end` / `time_zone` / `calendar_id`). The
 * reconciler and `fromServer` both go through this so the merged row
 * never carries both spellings of the same field.
 */
function eventFromServer(params: { server: unknown }): Record<string, unknown> {
  const raw = (params.server ?? {}) as Record<string, unknown>
  const inner = raw.event && typeof raw.event === 'object'
    ? (raw.event as Record<string, unknown>)
    : raw
  // GitLab #3 - a field the server did not send must not land in the
  // local row as `undefined`: the key is dropped instead. `null` is kept
  // (it is a value the server sent).
  return stripUndefined({
    id: typeof inner.id === 'number' || typeof inner.id === 'string' ? inner.id : undefined,
    title: (inner.name as string) ?? (inner.title as string),
    user_id: typeof inner.user_id === 'number' ? inner.user_id : undefined,
    calendar_id: resolveCalendarId({
      calendarId: inner.calendar_id as number | null | undefined,
    }),
    date_start: (inner.dateStart as string) ?? (inner.date_start as string),
    date_end: (inner.dateEnd as string) ?? (inner.date_end as string),
    time_zone: (inner.timeZone as string) ?? (inner.time_zone as string),
    availability: inner.availability as string | undefined,
    notifications: inner.notifications as string | string[] | undefined,
    repeat: inner.repeat as string | string[] | undefined,
    guests: inner.guests as string | string[] | undefined,
    description: inner.description as string | undefined,
    id_reminders: inner.id_reminders as number[] | undefined,
  })
}

let repositorySingleton: ReturnType<
  typeof createRepository<ServerEventDto, EventItem>
> | null = null

function getRepository(): ReturnType<
  typeof createRepository<ServerEventDto, EventItem>
> {
  if (!repositorySingleton) {
    repositorySingleton = createRepository<ServerEventDto, EventItem>({
      tableName: 'events',
      urlBase: '/events',
      service: {
        async list(): Promise<ServerEventDto[]> {
          // The backend answers with a Laravel resource collection
          // (`{ data: [...] }`); `extractListRows` unwraps it.
          const response = await eventService.getEvents()
          return extractListRows(response, 'events') as ServerEventDto[]
        },
      },
      fromServer: ({ server }) => eventFromServer({ server }),
      hooks: buildHooks(),
    })

    // The processor calls this after a successful POST. It swaps the
    // optimistic tempId (string) for the real server id and mirrors the
    // canonical row into Dexie + Pinia so the UI stops holding a phantom
    // entry.
    registerReconciler({
      tableName: 'events',
      reconciler: async ({ tempId, server }) => {
        // LBDS-231 - backend wraps every event response as `{ event: {...} }`
        // (see back/app/Http/Controllers/EventController::store / ::update).
        // Spreading the wrapper shape would leave every domain key (`title`,
        // `date_start`, `calendar_id`, ...) nested under `event.*` and the UI
        // would render the optimistic tempId row as a blank entry. Unwrap here.
        const response = server as
          | { event?: Record<string, unknown>; id?: number | string }
          | Record<string, unknown>
          | undefined
        const data = (response && typeof response === 'object' && 'event' in response
          ? (response as { event: Record<string, unknown> }).event
          : (response as Record<string, unknown> | undefined)) ?? {}
        const id =
          typeof data.id === 'number' || typeof data.id === 'string'
            ? (data.id as number | string)
            : typeof (response as { id?: number | string } | undefined)?.id === 'number' ||
                typeof (response as { id?: number | string } | undefined)?.id === 'string'
              ? ((response as { id: number | string }).id)
              : undefined
        if (typeof id !== 'number' && typeof id !== 'string') return

        // C-3 (pre-merge review): route the server response through
        // `eventFromServer` so the merged row uses one canonical shape
        // (snake_case EventItem). Spreading `data` directly would leave
        // both `dateStart` and `date_start` in the row.
        const fromServer = eventFromServer({ server: response })
        const local = await db.events.get(tempId as string)
        // GitLab #3 - the merged row must not carry a key whose value is
        // `undefined` (the optimistic row of an older write could).
        const merged = stripUndefined({ ...local, ...fromServer, id })
        if (local) {
          await db.events.delete(tempId as string)
          await db.events.put(merged)
        }
        const store = useEventStore()
        const temp = store.events.findIndex((e) => sameEntityId(e.id, tempId))
        if (temp !== -1) {
          store.removeEvent({ id: tempId as string })
          store.addEvent({ event: merged as EventItem })
        }
        // LBDS-231 - the reconciler runs after the processor drains a row,
        // not from `loadEvents()`. CalendarPage only refreshes its local
        // `events.value` ref from the store when `lastSyncedAt` ticks, so
        // without an explicit nudge the new row sits in the store but
        // never reaches FullCalendar. Bump the shared ref here so the
        // page reloads from the store via the same path loadEvents takes.
        store.markSynced({ at: Date.now() })

        // H-2 (pre-merge review): drain any mutations that were applied
        // against the tempId while the create was still pending, now
        // that we know the real server id. Re-enqueue each one with the
        // server id so the processor picks them up on the next drain.
        const pending = getPendingMutations<EventItem>(tempId)
        if (pending.length > 0) {
          clearPendingMutations(tempId)
          for (const m of pending) {
            if (m.kind === 'update') {
              await getRepository().update({ id, patch: m.patch })
            } else {
              await getRepository().remove({ id })
            }
          }
        }
      },
    })
  }
  return repositorySingleton
}

// --- Controller ----------------------------------------------------------

interface ScheduleDay {
  date: string
  events: {
    id: number
    title: string
    message: string
    hour: string
    start: string
    end: string
    dateStart: string
    dateEnd: string
    color: string
    availability: string
  }[]
}

export class EventController {
  private get store(): ReturnType<typeof useEventStore> {
    return useEventStore()
  }

  /** Mounts the outbox processor on the root component. */
  useSync(): void {
    useOutboxProcessor()
  }

  /** Forces a drain of the outbox right now. Safe to call from anywhere. */
  flushQueue(): Promise<void> {
    return flush()
  }

  // --- Reads ------------------------------------------------------------

  /**
   * Online → server, mirror into Dexie + Pinia.
   * Offline → Dexie, set Pinia.
   */
  async loadEvents(): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await getRepository().fetchAll()
      // LBDS-231 - bump the shared sync clock so CalendarPage reloads from
      // the store even when the page is already mounted.
      this.store.markSynced({ at: Date.now() })
    } catch (error) {
      this.store.setError({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async loadLocalEvents(params: { userId: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { userId } = params
      const localEvents = await db.events.where('user_id').equals(userId).toArray()
      this.store.setEvents({ events: localEvents as unknown as EventItem[] })
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async loadExternalEvents(): Promise<ExternalCalendarEvent[]> {
    try {
      return await externalEventService.listExternalEvents()
    } catch {
      return []
    }
  }

  // --- Writes (online + offline) ----------------------------------------

  async createEvent(params: {
    name: string
    dateStart: string
    dateEnd?: string
    calendar_id?: number
    notifications?: string[]
    repeat?: string | string[] | Record<string, unknown>
    timeZone?: string
    guests?: string[]
    description?: string
    availability?: string
    id_reminders?: number[]
  }): Promise<{ id: string | number }> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id } = await getRepository().create({
        // GitLab #3 - the optional fields the caller did not provide
        // (`calendar_id`, `dateEnd`, `notifications`, `repeat`, `guests`,
        // `description`, `id_reminders`) must not reach the repository as
        // `undefined` keys: the optimistic Dexie row would carry them and
        // break the `ServerEventDto` contract. `null` is kept (a
        // deliberate clear).
        record: stripUndefined({
          // The Laravel backend's POST /events expects this exact shape
          // (see App\Http\Controllers\EventController::store). The
          // server validates `name` / `dateStart` / `dateEnd` / `timeZone`
          // / `availability` as required (camelCase). We also send the
          // `title` / snake_case mirrors so the local mirror and the
          // `ServerEventDto` (which is snake_case) match without a
          // remap step.
          title: params.name,
          name: params.name,
          calendar_id: params.calendar_id,
          date_start: params.dateStart,
          date_end: params.dateEnd,
          dateStart: params.dateStart,
          dateEnd: params.dateEnd,
          time_zone: params.timeZone ?? 'UTC',
          timeZone: params.timeZone ?? 'UTC',
          availability: params.availability ?? 'available',
          notifications: params.notifications,
          // The Laravel backend validates `repeat` as an ARRAY on both
          // POST /events and PUT /events/{id} ("nullable|array" /
          // "sometimes|nullable|array"). The app models the rule as an
          // object or a bare type string, so the payload is translated
          // into the wire shape here. Sending the raw string makes the
          // backend answer 422 and the whole write is discarded.
          repeat:
            params.repeat === undefined
              ? undefined
              : toServerRepeat({ repeat: params.repeat }),
          guests: params.guests,
          description: params.description,
          id_reminders: params.id_reminders,
          // M-12 (pre-merge review): pull the real user id from the
          // auth store so Dexie queries on `user_id` see the right
          // value before the server-side fetchAll rewrites it.
          user_id: useAuthStore().localUser?.id ?? 0,
        }),
      })
      return { id }
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateEvent(params: {
    id: string | number
    name?: string
    dateStart?: string
    dateEnd?: string
    calendar_id?: number | null
    notifications?: string[]
    repeat?: string | string[] | Record<string, unknown>
    timeZone?: string
    guests?: string[]
    description?: string
    availability?: string
    id_reminders?: number[]
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { id, ...rest } = params
      // The Laravel backend's PUT /events/{id} validates `name`,
      // `dateStart`, `dateEnd`, `timeZone`, `availability` and accepts
      // `notifications` / `guests` as arrays (see
      // App\Http\Controllers\EventController::update). Sending the local
      // mirror keys returns 422.
      // The Laravel backend's PUT /events/{id} validates the same
      // camelCase fields (`name` / `dateStart` / `dateEnd` /
      // `timeZone` / `availability`). We also write the snake_case
      // mirrors so the local mirror and `ServerEventDto` agree.
      const patch: Record<string, unknown> = {}
      if (rest.name !== undefined) {
        patch.name = rest.name
        patch.title = rest.name
      }
      if (rest.dateStart !== undefined) {
        patch.dateStart = rest.dateStart
        patch.date_start = rest.dateStart
      }
      if (rest.dateEnd !== undefined) {
        patch.dateEnd = rest.dateEnd
        patch.date_end = rest.dateEnd
      }
      // LBDS-298 - propagate `calendar_id` so the picker changes
      // reach the server. `undefined` means the picker did not move
      // for this update (no-op); `null` is a deliberate clear; a
      // number is the new selection. The backend scopes the value to
      // `auth()->id()` and returns 404 if the calendar is not found.
      if (rest.calendar_id !== undefined) {
        patch.calendar_id = rest.calendar_id
      }
      if (rest.notifications !== undefined) patch.notifications = rest.notifications
      // The backend validates `repeat` as an ARRAY on PUT /events/{id}
      // ("sometimes|nullable|array"). Sending the app's bare type string
      // ("unique" / "daily" / ...) answers 422 ("The repeat must be an
      // array") and the update never reaches the server.
      if (rest.repeat !== undefined) {
        patch.repeat = toServerRepeat({ repeat: rest.repeat })
      }
      if (rest.timeZone !== undefined) {
        patch.timeZone = rest.timeZone
        patch.time_zone = rest.timeZone
      }
      if (rest.guests !== undefined) patch.guests = rest.guests
      if (rest.description !== undefined) patch.description = rest.description
      if (rest.availability !== undefined) patch.availability = rest.availability
      if (rest.id_reminders !== undefined) patch.id_reminders = rest.id_reminders
      await getRepository().update({ id, patch })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async removeEvent(params: { id: string | number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await getRepository().remove({ id: params.id })
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  // --- Local-only helpers (kept for callers that need them) -------------

  /** Stamps a row into Dexie + Pinia without touching the outbox. */
  async addLocalEvent(params: { event: EventItem }): Promise<void> {
    this.store.addEvent({ event: params.event })
    // IndexedDB cannot clone a reactive Proxy, so the row is unwrapped
    // to plain data first.
    await db.events.put(toPlainData(params.event))
  }

  /** Patches a row in Dexie + Pinia without touching the outbox. */
  async updateLocalEvent(params: {
    id?: string | number
    event?: Partial<EventItem>
    updates?: Partial<EventItem>
  }): Promise<void> {
    const data = params.event || params.updates
    const id = params.id ?? data?.id
    if (data && id !== undefined) {
      // The modal hands over reactive state; IndexedDB cannot clone a
      // Proxy, so the payload is unwrapped to plain data first.
      const plain = toPlainData(data)
      this.store.updateEvent({ id, updates: plain })
      await db.events.update(id, plain)
    }
  }

  // --- Derived state (no I/O) -------------------------------------------

  generateSchedule(params: { events: EventItem[]; year: number; month: number }): void {
    const { events: eventList, year, month } = params
    const schedule: ScheduleDay[] = []
    const daysInMonth = new Date(year, month, 0).getDate()

    const eventsByDate = new Map<string, EventItem[]>()
    for (const e of eventList) {
      if (!e.date_start) continue
      const dateKey = e.date_start.substring(0, 10)
      if (!eventsByDate.has(dateKey)) eventsByDate.set(dateKey, [])
      eventsByDate.get(dateKey)!.push(e)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = eventsByDate.get(dateStr) ?? []
      schedule.push({
        date: dateStr,
        events: dayEvents.map((e: EventItem) => ({
          id: e.id as number,
          title: e.title,
          message: e.description || '',
          hour: e.date_start ? e.date_start.substring(11, 16) : '',
          start: e.date_start || '',
          end: e.date_end || '',
          dateStart: e.date_start || '',
          dateEnd: e.date_end || '',
          color: '#3880ff',
          availability: e.availability || '',
        })),
      })
    }
    this.store.setSchedule({ schedule: { schedule } })
  }

  setDate(params: { date: string }): void {
    this.store.setDate({ date: params.date })
  }

  setEvents(params: { events: EventItem[] }): void {
    this.store.setEvents({ events: params.events })
  }

  addEvent(params: { event: EventItem }): void {
    this.store.addEvent({ event: params.event })
  }

  getEvents(): EventItem[] {
    return this.store.events
  }

  getEvent(params: { idEvent: string | number }): EventItem | null {
    // LBDS-231 - the id may arrive as a string (FullCalendar hands ids
    // back as strings, and offline rows carry a tempId until the
    // reconciler swaps it for the server id), so a strict comparison
    // would miss rows that are there and leave the modal empty.
    const found = this.store.events.find((e: EventItem) => sameEntityId(e.id, params.idEvent))
    return found || null
  }

  countEvents(params?: { date?: Date }): number {
    const { date } = params || {}
    if (date) {
      const dateStr = date.toISOString().substring(0, 10)
      return this.store.events.filter((e: EventItem) => {
        const start = e.date_start ? e.date_start.substring(0, 10) : ''
        return start === dateStr
      }).length
    }
    return this.store.events.length
  }
}
