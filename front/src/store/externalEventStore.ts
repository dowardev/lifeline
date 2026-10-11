// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ExternalCalendarEvent } from '@/services/externalEventService'

/**
 * LBDS-231 — external event store. Single source of truth shared by
 * CalendarPage, the CalendarWidget, and every other surface that renders
 * Google/CalDAV/ICS events. Backed by Dexie so the last successful sync
 * stays visible while offline.
 */
export const useExternalEventStore = defineStore('externalEvents', () => {
  const events = ref<ExternalCalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncedAt = ref<number | null>(null)

  function setEvents(params: { events: ExternalCalendarEvent[] }): void {
    events.value = params.events
  }

  function setLoading(params: { loading: boolean }): void {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }): void {
    error.value = params.error
  }

  function setLastSyncedAt(params: { at: number | null }): void {
    lastSyncedAt.value = params.at
  }

  function clearError(): void {
    error.value = null
  }

  return {
    events,
    loading,
    error,
    lastSyncedAt,
    setEvents,
    setLoading,
    setError,
    setLastSyncedAt,
    clearError,
  }
})
