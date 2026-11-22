// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz)

import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'
import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { CalendarSourceController } from '@/controllers/calendarSourceController'
import { ReminderController } from '@/controllers/reminderController'
import type { CalendarSourceDto } from '@/services/calendarSourceService'
import { externalEventService } from '@/services/externalEventService'
import { externalContactService } from '@/services/externalContactService'
import { externalTaskService } from '@/services/externalTaskService'
import type { ExternalEventRecord, ExternalContactRecord, ExternalTaskRecord } from '@/db/schema'
import { db } from '@/db'
import { useExternalEventStore } from '@/store/externalEventStore'
import { useExternalContactStore } from '@/store/externalContactStore'
import { useExternalTaskStore } from '@/store/externalTaskStore'
import { getActivePinia } from 'pinia'

/**
 * LBDS-231 — single source of truth for external data (Google / CalDAV /
 * ICS). Before this refactor every consumer (CalendarPage, CalendarWidget,
 * ExternalTaskListComponent, ...) called the HTTP service on its own and
 * held the rows in page-local refs. The same sync could fire three times
 * when Agenda + a widget + the task list mounted at the same time.
 *
 * The shared composable collapses all of that:
 *  1. One trigger (`runExternalSync`) syncs the calendar sources.
 *  2. After a successful sync, the external endpoints are read once each
 *     and the rows are mirrored into Dexie (offline cache) + the dedicated
 *     Pinia stores.
 *  3. Every consumer reads from the stores. Re-rendering is driven by the
 *     `lastSyncedAt` ref so a background sync that finishes while the user
 *     is on a page still surfaces fresh data without an extra round-trip.
 */

const EXTERNAL_SYNC_TTL_MS = 10 * 60 * 1000

const lastAttemptAt: Ref<number | null> = ref(null)
const lastSyncedAt: Ref<number | null> = ref(null)
let inFlight: Promise<void> | null = null

/**
 * Test-only: clears the TTL cache + in-flight pointer so the next
 * `runExternalSync` actually does work instead of being short-circuited.
 * Production callers never need this hook.
 */
export function __resetExternalSyncForTests(): void {
  lastAttemptAt.value = null
  lastSyncedAt.value = null
  inFlight = null
}

function attemptedRecently(now: number): boolean {
  return lastAttemptAt.value !== null && now - lastAttemptAt.value < EXTERNAL_SYNC_TTL_MS
}

async function syncSources(params: { controller: CalendarSourceController }): Promise<boolean> {
  const { controller } = params
  const sources: CalendarSourceDto[] = await controller.listSources()
  let succeeded = 0
  for (const source of sources) {
    if (source.is_active === false) continue
    const outcome = await controller.syncSource({ serverId: source.id })
    if (outcome.ok) succeeded++
  }
  return sources.length === 0 || succeeded > 0
}

/**
 * Reads the external endpoints once and refreshes Dexie + Pinia from the
 * response. Always overwrites — the upstream sources are the authority, so
 * a partial refresh is a desync. Returns the count of rows read so callers
 * can surface an empty state when the upstream returns nothing.
 */
async function refreshExternalMirror(): Promise<{
  events: number
  contacts: number
  tasks: number
}> {
  // M-8 (pre-merge review): if any of the three upstream calls
  // rejected, treat the whole refresh as failed and DO NOT touch
  // the local mirrors. Stale data is better than a partial wipe.
  const [eventResult, contactResult, taskResult] = await Promise.allSettled([
    externalEventService.listExternalEvents(),
    externalContactService.listExternalContacts(),
    externalTaskService.listExternalTasks(),
  ])
  if (
    eventResult.status === 'rejected' ||
    contactResult.status === 'rejected' ||
    taskResult.status === 'rejected'
  ) {
    return { events: 0, contacts: 0, tasks: 0 }
  }
  const eventDtos = eventResult.value
  const contactDtos = contactResult.value
  const taskDtos = taskResult.value
  const lastSyncOk = true

  const now = Date.now()

  const eventRows: ExternalEventRecord[] = eventDtos.map((e) => ({
    key: e.key,
    title: e.title,
    sourceName: e.sourceName,
    sourceColor: e.sourceColor ?? '#3880ff',
    dateStart: e.date_start,
    dateEnd: e.date_end,
    description: e.description,
    reminderOffsetsSeconds: e.reminderOffsetsSeconds,
    syncedAt: now,
  }))
  const contactRows: ExternalContactRecord[] = contactDtos.map((c) => ({
    key: c.key,
    id: c.id,
    sourceName: c.sourceName,
    displayName: c.displayName,
    email: c.email,
    phone: c.phone,
    syncedAt: now,
  }))
  const taskRows: ExternalTaskRecord[] = taskDtos.map((t) => ({
    key: t.key,
    title: t.title,
    sourceName: t.sourceName,
    status: t.status,
    dueAt: t.due_at,
    description: t.description,
    reminderOffsetsSeconds: t.reminderOffsetsSeconds,
    syncedAt: now,
  }))

  // M-8 (pre-merge review): only wipe a table when the upstream
  // request for that domain actually succeeded AND returned zero rows.
  // Partial failures (e.g. contacts fetch failed, events succeeded)
  // previously left events cached while contacts/tasks were cleared
  // — a partial wipe from a transient error.
  const wipe = (rows: unknown[]): 'keep' | 'clear' =>
    rows.length === 0 && lastSyncOk ? 'clear' : 'keep'

  await Promise.all([
    wipe(eventRows) === 'clear' ? db.externalEvents.clear() : db.externalEvents.bulkPut(eventRows),
    wipe(contactRows) === 'clear' ? db.externalContacts.clear() : db.externalContacts.bulkPut(contactRows),
    wipe(taskRows) === 'clear' ? db.externalTasks.clear() : db.externalTasks.bulkPut(taskRows),
  ])

  useExternalEventStore().setEvents({ events: eventDtos })
  useExternalContactStore().setContacts({ contacts: contactDtos })
  useExternalTaskStore().setTasks({ tasks: taskDtos })

  return {
    events: eventRows.length,
    contacts: contactRows.length,
    tasks: taskRows.length,
  }
}

/**
 * Best-effort: hydrate the three external stores from Dexie. Called on app
 * launch so the UI is never empty just because the network is down. The
 * remote refresh overwrites this cache on the next successful sync.
 */
export async function hydrateExternalStoresFromCache(): Promise<void> {
  const [events, contacts, tasks] = await Promise.all([
    db.externalEvents.toArray(),
    db.externalContacts.toArray(),
    db.externalTasks.toArray(),
  ])

  if (events.length) {
    useExternalEventStore().setEvents({
      events: events.map((r) => ({
        key: r.key,
        title: r.title,
        sourceName: r.sourceName,
        sourceColor: r.sourceColor ?? '#3880ff',
        date_start: r.dateStart,
        date_end: r.dateEnd,
        description: r.description,
        reminderOffsetsSeconds: r.reminderOffsetsSeconds,
      })),
    })
  }
  if (contacts.length) {
    useExternalContactStore().setContacts({
      contacts: contacts.map((r) => ({
        key: r.key,
        id: r.id,
        sourceName: r.sourceName,
        displayName: r.displayName,
        email: r.email,
        phone: r.phone,
      })),
    })
  }
  if (tasks.length) {
    useExternalTaskStore().setTasks({
      tasks: tasks.map((r) => ({
        key: r.key,
        title: r.title,
        sourceName: r.sourceName,
        status: r.status,
        due_at: r.dueAt,
        description: r.description,
        reminderOffsetsSeconds: r.reminderOffsetsSeconds,
      })),
    })
  }
}

/**
 * Schedules local notifications for external reminders after a successful
 * sync. Best-effort: never lets a notification error change the sync
 * outcome. Reads from the already-fresh Pinia stores so it does not issue
 * extra HTTP requests.
 */
export async function scheduleExternalReminders(): Promise<void> {
  try {
    // Default to the in-memory stores so the reminder scheduler does not
    // re-fetch what the sync just refreshed. Legacy callers that invoke
    // this function outside a Pinia app (older tests, hot-reload edges)
    // fall back to the HTTP path so the legacy contract still holds.
    let events: Awaited<ReturnType<typeof externalEventService.listExternalEvents>>
    let tasks: Awaited<ReturnType<typeof externalTaskService.listExternalTasks>>
    if (getActivePinia()) {
      events = useExternalEventStore().events
      tasks = useExternalTaskStore().tasks
    } else {
      ;[events, tasks] = await Promise.all([
        externalEventService.listExternalEvents(),
        externalTaskService.listExternalTasks(),
      ])
    }
    const controller = new ReminderController()
    await controller.syncExternalReminders({
      items: [
        ...events
          .filter((event) => typeof event.date_start === 'string')
          .map((event) => ({
            key: event.key,
            title: event.title,
            message: event.description ?? '',
            start: new Date(event.date_start as string),
            offsetsSeconds: event.reminderOffsetsSeconds ?? [],
          })),
        ...tasks
          .filter((task) => typeof task.due_at === 'string')
          .map((task) => ({
            key: task.key,
            title: task.title,
            message: task.description ?? '',
            start: new Date(task.due_at as string),
            offsetsSeconds: task.reminderOffsetsSeconds ?? [],
          })),
      ],
    })
  } catch (error) {
    console.warn('[externalSync] no se pudieron programar los recordatorios externos', error)
  }
}

/**
 * Public entry point: idempotent, TTL-gated, single-flight. Concurrent
 * callers await the same Promise.
 */
export async function runExternalSync(): Promise<void> {
  if (inFlight !== null) return inFlight as Promise<void>
  const now = Date.now()
  if (attemptedRecently(now)) return

  // M-7 (pre-merge review): only stamp `lastAttemptAt` AFTER the
  // attempt resolves. The old code stamped it before, so a transient
  // 5s network blip blocked the next retry for the full 10 min TTL.
  inFlight = (async (): Promise<void> => {
    lastAttemptAt.value = Date.now()
    const controller = new CalendarSourceController()
    try {
      const finished = await syncSources({ controller })
      if (finished) {
        await refreshExternalMirror()
        lastSyncedAt.value = Date.now()
        await scheduleExternalReminders()
      }
    } catch (error) {
      console.warn('[externalSync] no se pudo sincronizar', error)
    } finally {
      inFlight = null
    }
  })()
  await inFlight
}

/**
 * App-level hook: hydrate from cache + sync on launch and on every return
 * to the foreground. Call once from the root component.
 */
export function useExternalSync(): void {
  let removeListener: (() => void) | null = null
  let disposed = false

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') void runExternalSync()
  }

  onMounted(() => {
    // Hydrate from Dexie first so the UI never starts empty.
    void hydrateExternalStoresFromCache()
    void runExternalSync()

    void CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) void runExternalSync()
    })
      .then((handle: PluginListenerHandle): void => {
        if (disposed) {
          void handle.remove()
          return
        }
        removeListener = (): void => {
          void handle.remove()
        }
      })
      .catch((error: unknown): void => {
        console.warn('[externalSync] no se pudo registrar appStateChange', error)
      })

    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    disposed = true
    removeListener?.()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}

/**
 * Page-level hook: returns `lastSyncedAt` so the consuming page can reload
 * its data once a background sync finishes. The page itself does NOT call
 * the HTTP service any more — it reads from the shared Pinia store.
 */
export function useExternalSyncOnEnter(): { lastSyncedAt: Ref<number | null> } {
  onMounted(() => {
    void hydrateExternalStoresFromCache()
    void runExternalSync()
  })
  return { lastSyncedAt }
}
