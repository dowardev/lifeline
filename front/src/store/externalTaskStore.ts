// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ExternalTask } from '@/services/externalTaskService'

/**
 * LBDS-231 — external task store. Mirror of the events/contacts stores for
 * CalDAV/Google Tasks surfaced as read-only on the Tasks page.
 */
export const useExternalTaskStore = defineStore('externalTasks', () => {
  const tasks = ref<ExternalTask[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncedAt = ref<number | null>(null)

  function setTasks(params: { tasks: ExternalTask[] }): void {
    tasks.value = params.tasks
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
    tasks,
    loading,
    error,
    lastSyncedAt,
    setTasks,
    setLoading,
    setError,
    setLastSyncedAt,
    clearError,
  }
})
