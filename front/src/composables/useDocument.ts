import { useDocumentStore } from '@/store/documentStore'
import { DocumentController } from '@/controllers/documentController'

export interface DocumentElement {
  type: string
  data?: Record<string, unknown>
  reminders?: Record<string, unknown>
  [key: string]: unknown
}

export function useDocument() {
  const controller = new DocumentController()
  const store = useDocumentStore()

  return {
    loadDocuments: controller.loadDocuments.bind(controller),
    getUserDocuments: controller.getUserDocuments.bind(controller),
    getUserDocument: controller.getUserDocument.bind(controller),
    createDocument: controller.createDocument.bind(controller),
    updateDocument: controller.updateDocument.bind(controller),
    deleteDocument: controller.deleteDocument.bind(controller),
    getDocuments: store.getDocuments.bind(store),
    getDocument: store.getDocument.bind(store),
    removeElement(params: { index: number | string; documentId: string }) {
      const idx = Number(params.index)
      const doc = store.documents.find((d) => String(d.id) === params.documentId)
      if (doc && doc.elements) {
        const elements = [...doc.elements]
        elements.splice(idx, 1)
        store.updateDocument({ id: doc.id, updates: { elements } })
      }
    },
    insertElement(params: { documentId: string; element: DocumentElement }) {
      const doc = store.documents.find((d) => String(d.id) === params.documentId)
      if (doc) {
        const elements = doc.elements ? [...doc.elements] : []
        elements.push(params.element)
        store.updateDocument({ id: doc.id, updates: { elements } })
      }
    },
    updateNoteValue(params: { data: { value: string }; index: number | string; documentId: string }) {
      const idx = Number(params.index)
      const doc = store.getDocument({ elementSearch: params.documentId })
      if (doc && doc.elements && doc.elements[idx]) {
        const elements = [...(doc.elements as DocumentElement[])]
        elements[idx] = { ...elements[idx], data: params.data }
        store.updateDocument({ id: doc.id, updates: { elements } })
        controller.updateDocument({ id: doc.id, document: { ...doc, elements } })
      }
    },
    updateNoteReminder(params: { data: { dateStart: string; dateEnd: string }; index: number | string; documentId: string }) {
      const idx = Number(params.index)
      const doc = store.getDocument({ elementSearch: params.documentId })
      if (doc && doc.elements && doc.elements[idx]) {
        const elements = [...(doc.elements as DocumentElement[])]
        elements[idx] = { ...elements[idx], reminders: params.data }
        store.updateDocument({ id: doc.id, updates: { elements } })
        controller.updateDocument({ id: doc.id, document: { ...doc, elements } })
      }
    },
  }
}
