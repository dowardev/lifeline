// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NoteItem {
  id: number
  user_id: number
  document_id?: number
  title: string
  content?: string
  reminder?: string
  notifications?: string[]
  id_reminders?: number[]
}

export const useNoteStore = defineStore('note', () => {
  const notes = ref<NoteItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // H-4 (pre-merge review): shared sync clock.
  const lastSyncedAt = ref<number | null>(null)

  function setNotes(params: { notes: NoteItem[] }): void {
    notes.value = params.notes
  }

  function addNote(params: { note: NoteItem }): void {
    notes.value.push(params.note)
  }

  function updateNote(params: { id: number; updates: Partial<NoteItem> }): void {
    const { id, updates } = params
    const index = notes.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notes.value[index] = { ...notes.value[index], ...updates }
    }
  }

  function removeNote(params: { id: string | number }): void {
    // LBDS-231 - the reconciler passes the optimistic tempId (a string)
    // here. Compare stringified so tempIds and server ids both work.
    const target = String(params.id)
    notes.value = notes.value.filter((n) => String(n.id) !== target)
  }

  function setLoading(params: { loading: boolean }): void {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }): void {
    error.value = params.error
  }

  function clearError(): void {
    error.value = null
  }

  function markSynced(params: { at: number }): void {
    lastSyncedAt.value = params.at
  }

  return { notes, loading, error, lastSyncedAt, setNotes, addNote, updateNote, removeNote, setLoading, setError, clearError, markSynced }
})
