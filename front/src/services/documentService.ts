import { apiClient } from './apiClient'

export const documentService = {
  getDocuments(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/documents' })
  },

  createDocument(params: { title: string; type?: string; content?: string; order?: number }): Promise<unknown> {
    return apiClient.executeMutation({ url: '/documents', data: params })
  },

  updateDocument(params: { id: number; title?: string; type?: string; content?: string; order?: number }): Promise<unknown> {
    return apiClient.executeMutation({ url: `/documents/${params.id}`, data: params, method: 'PUT' })
  },

  deleteDocument(params: { id: number }): Promise<unknown> {
    return apiClient.executeDelete({ url: `/documents/${params.id}` })
  },
}
