import { apiClient } from './apiClient'

export const noteService = {
  getNotes() {
    return apiClient.executeQuery({ url: '/notes' })
  },

  createNote(params: { title: string; content?: string; document_id?: number; reminder?: string }) {
    return apiClient.executeMutation({ url: '/notes', data: params })
  },

  updateNote(params: { id: number; title?: string; content?: string; document_id?: number; reminder?: string }) {
    return apiClient.executeMutation({ url: `/notes/${params.id}`, data: params, method: 'PUT' })
  },

  deleteNote(params: { id: number }) {
    return apiClient.executeDelete({ url: `/notes/${params.id}` })
  },
}
