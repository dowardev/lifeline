import { documentService } from '@/services/documentService'
import { useDocumentStore } from '@/store/documentStore'
import { db } from '@/db'
import type { DocumentItem } from '@/store/documentStore'

export class DocumentController {
  private get store() {
    return useDocumentStore()
  }

  async loadDocuments() {
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

  async createDocument(params: { title: string; type?: string; content?: string }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const localId = Date.now() + Math.floor(Math.random() * 100000)
      const temp = { id: localId, user_id: 0, title: params.title, type: (params.type || 'note') as 'note' | 'list' | 'richtext' | 'todo', content: params.content }
      this.store.addDocument({ document: temp as unknown as DocumentItem })
      await db.documents.put(temp)
      try {
        const response = await documentService.createDocument(params)
        const serverDoc = response.document || response
        this.store.updateDocument({ id: localId, updates: serverDoc })
        await db.documents.delete(localId)
        await db.documents.put(serverDoc)
        return serverDoc
      } catch {
        this.store.setError({ error: 'Failed to sync document with server' })
        return temp
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateDocument(params: { id?: number; document?: any; title?: string; type?: string; content?: string }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const data = params.document || params
      const docId = params.id ?? data.id
      this.store.updateDocument({ id: docId, updates: data })
      const updateFields: Partial<import('@/db/schema').DocumentRecord> = {}
      if (data.title !== undefined) updateFields.title = data.title
      if (data.type !== undefined) updateFields.type = data.type
      if (data.content !== undefined) updateFields.content = data.content
      if (data.order !== undefined) updateFields.order = data.order
      await db.documents.update(docId, updateFields)
      try { await documentService.updateDocument(data) } catch (error) {
        console.error('[DocumentController.updateDocument]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async deleteDocument(params: { id: number }) {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      this.store.removeDocument({ id: params.id })
      await db.documents.delete(params.id)
      try { await documentService.deleteDocument({ id: params.id }) } catch (error) {
        console.error('[DocumentController.deleteDocument]', error)
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      }
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
}
