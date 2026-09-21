// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { CalendarSourceController } from '@/controllers/calendarSourceController';
import { ReminderController } from '@/controllers/reminderController';
import type { CalendarSourceDto } from '@/services/calendarSourceService';
import { externalEventService } from '@/services/externalEventService';

/**
 * External sources (Google / CalDAV / ICS) live outside the app, so what is on
 * screen is only as fresh as the last sync. Instead of polling, the app syncs
 * whenever a data surface becomes visible — app launch, return to the
 * foreground, entering a page that shows external data — gated by a minimum
 * interval so navigating between pages cannot hammer the provider. That keeps
 * every client fresh, which matters on the web where a tab can stay open for
 * days, and when the same account is used from several devices.
 *
 * External reminders are now scheduled as local notifications after each
 * successful sync, so they fire on every device (including degoogled ones)
 * without push infrastructure. There is still no server-side scheduler and no
 * push delivery, so a change made in Google Calendar while the app is closed
 * stays invisible — and un-notified — until the app runs again.
 */

/** Minimum time between two sync attempts. */
export const EXTERNAL_SYNC_TTL_MS = 10 * 60 * 1000;

// Module scope: the whole app shares one attempt, one timestamp and one run.
const lastAttemptAt = ref<number | null>(null);
const lastSyncedAt = ref<number | null>(null);
let inFlight: Promise<void> | null = null;

function attemptedRecently(now: number): boolean {
  return lastAttemptAt.value !== null && now - lastAttemptAt.value < EXTERNAL_SYNC_TTL_MS;
}

async function syncSources(params: { controller: CalendarSourceController }): Promise<boolean> {
  const { controller } = params;
  const sources: CalendarSourceDto[] = await controller.listSources();
  let succeeded = 0;
  for (const source of sources) {
    if (source.is_active === false) continue;
    // No collectionHref: one request per source syncs every subscribed
    // collection of that source, which stays well under the API throttle.
    const outcome = await controller.syncSource({ serverId: source.id });
    if (outcome.ok) succeeded++;
  }

  return sources.length === 0 || succeeded > 0;
}

/**
 * Turns freshly synced external events into local notifications. Best-effort:
 * the controller owns all `LocalNotifications` access, so this only maps DTOs
 * and never lets a notification problem change the sync outcome.
 */
async function scheduleExternalReminders(): Promise<void> {
  try {
    const events = await externalEventService.listExternalEvents();
    const controller = new ReminderController();
    await controller.syncExternalReminders({
      items: events.map((event) => ({
        key: event.key,
        title: event.title,
        // Empty body falls back to the title inside the controller.
        message: event.description ?? '',
        start: new Date(event.date_start as string),
        offsetsSeconds: event.reminderOffsetsSeconds ?? [],
      })),
    });
  } catch (error) {
    console.warn(
      '[externalSync] no se pudieron programar los recordatorios externos',
      error,
    );
  }
}

/**
 * Syncs every active source unless an attempt already happened within the TTL.
 * Concurrent calls collapse into the single in-flight run.
 *
 * The attempt is stamped before the work starts, so a failure does not retry on
 * every page change while offline; `lastSyncedAt` only moves on success, so
 * observers reload only when fresh data actually arrived.
 */
export async function runExternalSync(): Promise<void> {
  // Concurrent callers await the same in-flight run instead of resolving early.
  if (inFlight !== null) return inFlight as Promise<void>;
  const now = Date.now();
  if (attemptedRecently(now)) return;

  lastAttemptAt.value = now;
  inFlight = (async (): Promise<void> => {
    const controller = new CalendarSourceController();
    try {
      const finished = await syncSources({ controller });
      if (finished) {
        lastSyncedAt.value = Date.now();
        // Scheduling follows a successful sync only, and is fully best-effort.
        await scheduleExternalReminders();
      }
    } catch (error) {
      // Offline, no session, expired token… The next attempt is TTL-gated.
      console.warn('[externalSync] no se pudo sincronizar', error);
    } finally {
      inFlight = null;
    }
  })();

  await inFlight;
}

/**
 * App-level hook: sync on launch and on every return to the foreground. Call it
 * once, from the root component. It runs in guest mode too, so it is not behind
 * the SSO check.
 */
export function useExternalSync(): void {
  let removeListener: (() => void) | null = null;
  let disposed = false;

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') void runExternalSync();
  }

  onMounted(() => {
    void runExternalSync();

    // `appStateChange` is the Capacitor-native signal; `visibilitychange` is
    // the web/WebView fallback. Both funnel into the guarded run, so a double
    // signal is harmless.
    void CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) void runExternalSync();
    })
      .then((handle: PluginListenerHandle): void => {
        if (disposed) {
          // The component unmounted before the promise resolved.
          void handle.remove();
          return;
        }
        removeListener = (): void => {
          void handle.remove();
        };
      })
      .catch((error: unknown): void => {
        console.warn('[externalSync] no se pudo registrar appStateChange', error);
      });

    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onUnmounted(() => {
    disposed = true;
    removeListener?.();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });
}

/**
 * Page-level hook for a surface that renders external data: syncs when the page
 * opens (TTL-gated) and exposes the last successful sync so the page can re-read
 * its data once a background sync finishes.
 */
export function useExternalSyncOnEnter(): { lastSyncedAt: Ref<number | null> } {
  onMounted(() => {
    void runExternalSync();
  });

  return { lastSyncedAt };
}
