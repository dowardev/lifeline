import { apiClient } from './apiClient'

export const noteService = {
  getNotes(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/notes' })
  },

  createNote(params: { title: string; content?: string; document_id?: number; reminder?: string }): Promise<unknown> {
    return apiClient.executeMutation({ url: '/notes', data: params })
  },

  updateNote(params: { id: number; title?: string; content?: string; document_id?: number; reminder?: string }): Promise<unknown> {
    return apiClient.executeMutation({ url: `/notes/${params.id}`, data: params, method: 'PUT' })
  },

  deleteNote(params: { id: number }): Promise<unknown> {
    return apiClient.executeDelete({ url: `/notes/${params.id}` })
  },
}
