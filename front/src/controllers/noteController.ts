import { noteService } from '@/services/noteService'
import { useNoteStore } from '@/store/noteStore'
import { db } from '@/db'
import type { NoteItem } from '@/store/noteStore'

export class NoteController {
  private get store() {
    return useNoteStore()
  }

  async loadNotes() {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const local = await db.notes.toArray()
      this.store.setNotes({ notes: local as unknown as NoteItem[] })
      try {
        const response = await noteService.getNotes()
        const serverNotes = Array.isArray(response.notes) ? response.notes : Array.isArray(response) ? response : []
        this.store.setNotes({ notes: serverNotes })
        await db.notes.bulkPut(serverNotes)
      } catch (error) {
        console.error('[NoteController.loadNotes]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async createNote(params: { title: string; content?: string; document_id?: number; reminder?: string }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const localId = Date.now()
      const temp = { id: localId, user_id: 0, title: params.title, content: params.content, document_id: params.document_id, reminder: params.reminder }
      this.store.addNote({ note: temp as unknown as NoteItem })
      await db.notes.put(temp as unknown as NoteItem)
      try {
        const response = await noteService.createNote(params)
        const serverNote = response.note || response
        this.store.updateNote({ id: localId, updates: serverNote })
        await db.notes.delete(localId)
        await db.notes.put(serverNote)
      } catch (error) {
        console.error('[NoteController.createNote]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateNote(params: { id: number; title?: string; content?: string; reminder?: string }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      this.store.updateNote({ id: params.id, updates: params })
      await db.notes.update(params.id, params)
      try { await noteService.updateNote(params) } catch (error) {
        console.error('[NoteController.updateNote]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteNote(params: { id: number }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      this.store.removeNote({ id: params.id })
      await db.notes.delete(params.id)
      try { await noteService.deleteNote(params) } catch (error) {
        console.error('[NoteController.deleteNote]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }
}
