// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { apiClient } from './apiClient'

export const calendarService = {
  getCalendars(): Promise<unknown> {
    return apiClient.executeQuery({ url: '/calendars' })
  },

  createCalendar(params: { name: string }): Promise<unknown> {
    return apiClient.executeMutation({ url: '/calendars', data: params })
  },

  updateCalendar(params: { id: number; name: string }): Promise<unknown> {
    return apiClient.executeMutation({ url: `/calendars/${params.id}`, data: { name: params.name }, method: 'PUT' })
  },

  deleteCalendar(params: { id: number }): Promise<unknown> {
    return apiClient.executeDelete({ url: `/calendars/${params.id}` })
  },
}
