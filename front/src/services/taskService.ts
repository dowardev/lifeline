import { apiClient } from './apiClient'

export const taskService = {
  getTasks(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/tasks' })
  },

  createTask(params: {
    title: string
    description?: string
    status?: string
    priority?: number
    due_date?: string
    subtasks?: string
    order?: number
  }): Promise<unknown> {
    return apiClient.executeMutation({ url: '/tasks', data: params })
  },

  updateTask(params: {
    id: number
    title?: string
    description?: string
    status?: string
    priority?: number
    due_date?: string
    subtasks?: string
    order?: number
  }): Promise<unknown> {
    return apiClient.executeMutation({ url: `/tasks/${params.id}`, data: params, method: 'PUT' })
  },

  deleteTask(params: { id: number }): Promise<unknown> {
    return apiClient.executeDelete({ url: `/tasks/${params.id}` })
  },
}
