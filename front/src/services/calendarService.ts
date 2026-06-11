import { apiClient } from './apiClient'

export const calendarService = {
  getCalendars() {
    return apiClient.executeQuery({ url: '/calendars' })
  },

  createCalendar(params: { name: string }) {
    return apiClient.executeMutation({ url: '/calendars', data: params })
  },

  updateCalendar(params: { id: number; name: string }) {
    return apiClient.executeMutation({ url: `/calendars/${params.id}`, data: { name: params.name }, method: 'PUT' })
  },

  deleteCalendar(params: { id: number }) {
    return apiClient.executeDelete({ url: `/calendars/${params.id}` })
  },
}
