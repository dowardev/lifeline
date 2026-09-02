// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient'

export const noteService = {
  getNotes(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/notes' })
  },

  createNote(params: { title: string; content?: string; document_id?: number; reminder?: string; notifications?: string[]; id_reminders?: number[] }): Promise<unknown> {
    return apiClient.executeMutation({ url: '/notes', data: params })
  },

  updateNote(params: { id: number; title?: string; content?: string; document_id?: number; reminder?: string; notifications?: string[]; id_reminders?: number[] }): Promise<unknown> {
    return apiClient.executeMutation({ url: `/notes/${params.id}`, data: params, method: 'PUT' })
  },

  deleteNote(params: { id: number }): Promise<unknown> {
    return apiClient.executeDelete({ url: `/notes/${params.id}` })
  },
}
