import { apiClient } from './apiClient'

export const eventService = {
  getEvents() {
    return apiClient.executeQuery({ url: '/events' })
  },

  createEvent(params: {
    name: string
    dateStart: string
    dateEnd?: string
    calendar_id?: number
    notifications?: string
    repeat?: string
    timeZone?: string
    guests?: string
    description?: string
    availability?: string
  }) {
    return apiClient.executeMutation({ url: '/events', data: params })
  },

  updateEvent(params: {
    id: number
    name?: string
    dateStart?: string
    dateEnd?: string
    notifications?: string
    repeat?: string
    timeZone?: string
    guests?: string
    description?: string
    availability?: string
  }) {
    const { id, ...data } = params
    return apiClient.executeMutation({ url: `/events/${id}`, data, method: 'PUT' })
  },

  removeEvent(params: { id: number }) {
    return apiClient.executeDelete({ url: `/events/${params.id}` })
  },
}
