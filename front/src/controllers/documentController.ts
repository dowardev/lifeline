// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { documentService } from '@/services/documentService'
import { useDocumentStore } from '@/store/documentStore'
import { db } from '@/db'
import type { DocumentItem } from '@/store/documentStore'

export interface DocumentElement {
  type: string
  data?: Record<string, unknown>
  reminders?: Record<string, unknown>
  [key: string]: unknown
}

export class DocumentController {
  private get store(): ReturnType<typeof useDocumentStore> {
    return useDocumentStore()
  }

  async loadDocuments(): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const local = await db.documents.toArray()
      this.store.setDocuments({ documents: local as unknown as DocumentItem[] })
      try {
        const response = await documentService.getDocuments()
        const serverDocs = Array.isArray(response.documents) ? response.documents : Array.isArray(response) ? response : []
        this.store.setDocuments({ documents: serverDocs })
        await db.documents.bulkPut(serverDocs)
      } catch (error) {
        console.error('[DocumentController.loadDocuments]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async createDocument(params: { title: string; type?: string; content?: string }): Promise<DocumentItem> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const response = await documentService.createDocument(params)
      const serverDoc = response.document || response
      this.store.addDocument({ document: serverDoc })
      await db.documents.put(serverDoc)
      return serverDoc
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateDocument(params: { id?: number; document?: any; title?: string; type?: string; content?: string }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const data = params.document || params
      const docId = params.id ?? data.id
      await documentService.updateDocument(data)
      this.store.updateDocument({ id: docId, updates: data })
      const updateFields: Partial<import('@/db/schema').DocumentRecord> = {}
      if (data.title !== undefined) updateFields.title = data.title
      if (data.type !== undefined) updateFields.type = data.type
      if (data.content !== undefined) updateFields.content = data.content
      if (data.order !== undefined) updateFields.order = data.order
      if (data.elements !== undefined) updateFields.elements = data.elements
      // Persist elements locally (D2) so in-memory element reminders/content survive reload.
      await db.documents.update(docId, updateFields)
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteDocument(params: { id: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      await documentService.deleteDocument({ id: params.id })
      this.store.removeDocument({ id: params.id })
      await db.documents.delete(params.id)
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  getUserDocuments(): DocumentItem[] | undefined {
    return this.store.getDocuments()
  }

  getUserDocument(params: { documentId: string }): DocumentItem | undefined {
    return this.store.getDocument({ elementSearch: params.documentId })
  }

  removeElement(params: { index: number | string; documentId: string }): void {
    const idx = Number(params.index)
    const doc = this.store.documents.find((d) => String(d.id) === params.documentId)
    if (doc && doc.elements) {
      const elements = [...doc.elements]
      elements.splice(idx, 1)
      this.store.updateDocument({ id: doc.id, updates: { elements } })
    }
  }

  insertElement(params: { documentId: string; element: DocumentElement }): void {
    const doc = this.store.documents.find((d) => String(d.id) === params.documentId)
    if (doc) {
      const elements = doc.elements ? [...doc.elements] : []
      elements.push(params.element)
      this.store.updateDocument({ id: doc.id, updates: { elements } })
    }
  }

  updateNoteValue(params: { data: { value: string }; index: number | string; documentId: string }): void {
    const idx = Number(params.index)
    const doc = this.store.getDocument({ elementSearch: params.documentId })
    if (doc && doc.elements && doc.elements[idx]) {
      const elements = [...(doc.elements as DocumentElement[])]
      elements[idx] = { ...elements[idx], data: params.data }
      this.store.updateDocument({ id: doc.id, updates: { elements } })
      this.updateDocument({ id: doc.id, document: { ...doc, elements } })
    }
  }

  updateNoteReminder(params: { data: { dateStart: string; dateEnd: string }; index: number | string; documentId: string }): void {
    const idx = Number(params.index)
    const doc = this.store.getDocument({ elementSearch: params.documentId })
    if (doc && doc.elements && doc.elements[idx]) {
      const elements = [...(doc.elements as DocumentElement[])]
      elements[idx] = { ...elements[idx], reminders: params.data }
      this.store.updateDocument({ id: doc.id, updates: { elements } })
      this.updateDocument({ id: doc.id, document: { ...doc, elements } })
    }
  }
}
