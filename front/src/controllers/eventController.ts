// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { eventService } from '@/services/eventService'
import { useEventStore } from '@/store/eventStore'
import type { EventItem } from '@/store/eventStore'
import { db } from '@/db'
interface ScheduleDay {
  date: string
  events: {
    id: number
    title: string
    message: string
    hour: string
    start: string
    end: string
    dateStart: string
    dateEnd: string
    color: string
    availability: string
  }[]
}

export class EventController {
  private get store(): ReturnType<typeof useEventStore> {
    return useEventStore()
  }

  async loadEvents(): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const response = await eventService.getEvents()
      const eventsList = Array.isArray(response.events) ? response.events : Array.isArray(response) ? response : []
      this.store.setEvents({ events: eventsList })
      await db.events.bulkPut(eventsList)
    } catch (error) {
      try {
        const localEvents = await db.events.toArray()
        this.store.setEvents({ events: localEvents as unknown as EventItem[] })
      } catch {
        this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
        throw error
      }
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async loadLocalEvents(params: { userId: number }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const { userId } = params
      const localEvents = await db.events.where('user_id').equals(userId).toArray()
      this.store.setEvents({ events: localEvents as unknown as EventItem[] })
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  setEvents(params: { events: EventItem[] }): void {
    this.store.setEvents({ events: params.events })
  }

  addEvent(params: { event: EventItem }): void {
    this.store.addEvent({ event: params.event })
  }

  async addLocalEvent(params: { event: EventItem }): Promise<void> {
    this.store.addEvent({ event: params.event })
    await db.events.put(params.event)
  }

  async createEvent(params: {
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
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const response = await eventService.createEvent(params)
      const newEvent = response.event || response
      this.store.addEvent({ event: newEvent })
      await db.events.put(newEvent)
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateEvent(params: {
    id: number
    name?: string
    dateStart?: string
    dateEnd?: string
    notifications?: string
    repeat?: string
  }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const response = await eventService.updateEvent(params)
      this.store.updateEvent({ id: params.id, updates: response.event || response })
      await db.events.update(params.id, response.event || response)
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async updateLocalEvent(params: { id?: number; event?: Partial<EventItem>; updates?: Partial<EventItem> }): Promise<void> {
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      const data = params.event || params.updates
      const id = params.id ?? data?.id
      if (data && id) {
        this.store.updateEvent({ id, updates: data })
        await db.events.update(id, data)
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  async removeEvent(params: { id: number }): Promise<void> {
    const { id } = params
    this.store.setLoading({ loading: true })
    this.store.clearError()
    try {
      if (id < 0) {
        this.store.removeEvent({ id })
        await db.events.delete(id)
      } else {
        await eventService.removeEvent({ id })
        this.store.removeEvent({ id })
        await db.events.delete(id)
      }
    } catch (error) {
      this.store.setError({ error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      this.store.setLoading({ loading: false })
    }
  }

  generateSchedule(params: { events: EventItem[]; year: number; month: number }): void {
    const { events: eventList, year, month } = params
    const schedule: ScheduleDay[] = []
    const daysInMonth = new Date(year, month, 0).getDate()

    const eventsByDate = new Map<string, EventItem[]>()
    for (const e of eventList) {
      if (!e.date_start) continue
      const dateKey = e.date_start.substring(0, 10)
      if (!eventsByDate.has(dateKey)) eventsByDate.set(dateKey, [])
      eventsByDate.get(dateKey)!.push(e)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = eventsByDate.get(dateStr) ?? []
      schedule.push({
        date: dateStr,
        events: dayEvents.map((e: EventItem) => ({
          id: e.id,
          title: e.title,
          message: e.description || '',
          hour: e.date_start ? e.date_start.substring(11, 16) : '',
          start: e.date_start || '',
          end: e.date_end || '',
          dateStart: e.date_start || '',
          dateEnd: e.date_end || '',
          color: '#3880ff',
          availability: e.availability || '',
        })),
      })
    }
    this.store.setSchedule({ schedule: { schedule } })
  }

  setDate(params: { date: string }): void {
    this.store.setDate({ date: params.date })
  }

  getEvents(): EventItem[] {
    return this.store.events
  }

  getEvent(params: { idEvent: number }): EventItem | null {
    return this.store.events.find((e: EventItem) => e.id === params.idEvent) || null
  }

  countEvents(params?: { date?: Date }): number {
    const { date } = params || {}
    if (date) {
      const dateStr = date.toISOString().substring(0, 10)
      return this.store.events.filter((e: EventItem) => {
        const start = e.date_start ? e.date_start.substring(0, 10) : ''
        return start === dateStr
      }).length
    }
    return this.store.events.length
  }

}
