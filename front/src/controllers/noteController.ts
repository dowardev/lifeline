// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { noteService } from '@/services/noteService'
import { useNoteStore } from '@/store/noteStore'
import { db } from '@/db'
import type { NoteItem } from '@/store/noteStore'

export class NoteController {
  private get store(): ReturnType<typeof useNoteStore> {
    return useNoteStore()
  }

  async loadNotes(): Promise<void> {
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

  async createNote(params: { title: string; content?: string; document_id?: number; reminder?: string }): Promise<NoteItem> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const response = await noteService.createNote(params)
      const serverNote = response.note || response
      this.store.addNote({ note: serverNote })
      await db.notes.put(serverNote)
      return serverNote
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateNote(params: { id: number; title?: string; content?: string; reminder?: string }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await noteService.updateNote(params)
      this.store.updateNote({ id: params.id, updates: params })
      await db.notes.update(params.id, params)
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteNote(params: { id: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await noteService.deleteNote(params)
      this.store.removeNote({ id: params.id })
      await db.notes.delete(params.id)
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }
}
