import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface NoteItem {
  id: number
  user_id: number
  document_id?: number
  title: string
  content?: string
  reminder?: string
}

export const useNoteStore = defineStore('note', () => {
  const notes = ref<NoteItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setNotes(params: { notes: NoteItem[] }) {
    notes.value = params.notes
  }

  function addNote(params: { note: NoteItem }) {
    notes.value.push(params.note)
  }

  function updateNote(params: { id: number; updates: Partial<NoteItem> }) {
    const { id, updates } = params
    const index = notes.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notes.value[index] = { ...notes.value[index], ...updates }
    }
  }

  function removeNote(params: { id: number }) {
    notes.value = notes.value.filter((n) => n.id !== params.id)
  }

  function setLoading(params: { loading: boolean }) {
    loading.value = params.loading
  }

  function setError(params: { error: string | null }) {
    error.value = params.error
  }

  function clearError() {
    error.value = null
  }

  return { notes, loading, error, setNotes, addNote, updateNote, removeNote, setLoading, setError, clearError }
})
