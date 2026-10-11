// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ExternalContact } from '@/services/externalContactService'

/**
 * LBDS-231 — external contact store. Same single-source-of-truth contract
 * as the external events store: every surface (ContactsPage, the Contacts
 * widget, etc.) reads from this store, which is mirrored to Dexie so
 * offline navigation still shows the last synced roster.
 */
export const useExternalContactStore = defineStore('externalContacts', () => {
  const contacts = ref<ExternalContact[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncedAt = ref<number | null>(null)

  function setContacts(params: { contacts: ExternalContact[] }): void {
    contacts.value = params.contacts
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
    contacts,
    loading,
    error,
    lastSyncedAt,
    setContacts,
    setLoading,
    setError,
    setLastSyncedAt,
    clearError,
  }
})
