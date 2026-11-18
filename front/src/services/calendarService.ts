// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

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

  /**
   * LBDS-292 - deleting a calendar the user created has exactly two
   * outcomes, and both end with the calendar gone:
   *
   *   - `delete_events`: the calendar and its events are destroyed
   *     together;
   *   - `move`: the events are moved to `destinationCalendarId` (a
   *     LOCAL calendar of the same account) and the source calendar is
   *     deleted.
   *
   * The strategy is REQUIRED: the server rejects a request without one
   * instead of defaulting to the destructive option. It travels in the
   * query string AND in the body, because a proxy or a CDN may strip a
   * DELETE body and a missing strategy must fail loudly rather than
   * destroy the events.
   *
   * The protected default calendar is never deletable, so the server
   * rejects the request with 403.
   */
  deleteCalendar(params: {
    id: number
    strategy: 'delete_events' | 'move'
    destinationCalendarId?: number
  }): Promise<unknown> {
    const data: Record<string, unknown> = { strategy: params.strategy }
    if (params.destinationCalendarId !== undefined) {
      data.destination_calendar_id = params.destinationCalendarId
    }

    const query = new URLSearchParams()
    query.set('strategy', params.strategy)
    if (params.destinationCalendarId !== undefined) {
      query.set('destination_calendar_id', String(params.destinationCalendarId))
    }

    return apiClient.executeDelete({
      url: `/calendars/${params.id}?${query.toString()}`,
      data,
    })
  },
}
