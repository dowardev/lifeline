// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { eventService } from '@/services/eventService'
import { externalEventService } from '@/services/externalEventService'
import type { ExternalCalendarEvent } from '@/services/externalEventService'
import { useEventStore } from '@/store/eventStore'
import type { EventItem } from '@/store/eventStore'
import { db } from '@/db'
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
  calendar_id: number
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
    removeItem: ({ id }): void => store().removeEvent({ id: id as number }),
  }
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
          const response = (await eventService.getEvents()) as
            | { events: ServerEventDto[] }
            | ServerEventDto[]
          return Array.isArray(response)
            ? response
            : Array.isArray(response?.events)
              ? response.events
              : []
        },
      },
      fromServer: ({ server }) => ({ ...server }),
      hooks: buildHooks(),
    })

    // The processor calls this after a successful POST. It swaps the
    // optimistic tempId (string) for the real server id and mirrors the
    // canonical row into Dexie + Pinia so the UI stops holding a phantom
    // entry.
    registerReconciler({
      tableName: 'events',
      reconciler: async ({ tempId, server }) => {
        const response = server as { id?: number | string; event?: { id?: number } } | undefined
        const id =
          typeof response?.id === 'number' || typeof response?.id === 'string'
            ? response.id
            : response?.event?.id
        if (typeof id !== 'number' && typeof id !== 'string') return

        const local = await db.events.get(tempId as string)
        const merged = { ...local, ...(server as Record<string, unknown>), id }
        if (local) {
          await db.events.delete(tempId as string)
          await db.events.put(merged)
        }
        const store = useEventStore()
        const temp = store.events.findIndex((e) => e.id === tempId)
        if (temp !== -1) {
          store.removeEvent({ id: tempId as string })
          store.addEvent({ event: merged as EventItem })
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
    repeat?: string
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
        record: {
          // The Laravel backend's POST /events expects this exact shape
          // (see App\Http\Controllers\EventController::store). Sending the
          // local camelCase/snake_case keys returns 422 "field required".
          title: params.name,
          calendar_id: params.calendar_id ?? 1,
          name: params.name,
          dateStart: params.dateStart,
          dateEnd: params.dateEnd,
          timeZone: params.timeZone ?? 'UTC',
          availability: params.availability ?? 'available',
          notifications: params.notifications,
          repeat: params.repeat,
          guests: params.guests,
          description: params.description,
          id_reminders: params.id_reminders,
          user_id: 0, // server fills from auth; mirror stays until next fetchAll
        },
      })
      return { id }
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateEvent(params: {
    id: number
    name?: string
    dateStart?: string
    dateEnd?: string
    notifications?: string[]
    repeat?: string
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
      if (rest.notifications !== undefined) patch.notifications = rest.notifications
      if (rest.repeat !== undefined) patch.repeat = rest.repeat
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

  async removeEvent(params: { id: number }): Promise<void> {
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
    await db.events.put(params.event)
  }

  /** Patches a row in Dexie + Pinia without touching the outbox. */
  async updateLocalEvent(params: {
    id?: number
    event?: Partial<EventItem>
    updates?: Partial<EventItem>
  }): Promise<void> {
    const data = params.event || params.updates
    const id = params.id ?? data?.id
    if (data && id !== undefined) {
      this.store.updateEvent({ id: id as number, updates: data })
      await db.events.update(id, data)
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

  getEvent(params: { idEvent: number }): EventItem | null {
    return this.store.events.find((e: EventItem) => e.id === params.idEvent) || null
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
