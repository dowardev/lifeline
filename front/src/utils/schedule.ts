// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { Schedule, ScheduleElement } from '@/utils/interfaces'

export function generateScheduleElement(params: {
  id: string | number
  idElement: string
  title: string
  message: string
  startDate: Date
  endDate: Date
  type: string
  reminder: boolean
  repeat?: { frecuency?: number; type?: string; daysWeek?: string[] }
}): Schedule {
  const { id, idElement, title, message, startDate, endDate, type, reminder, repeat } = params
  const frecuency = Math.max(1, repeat?.frecuency ?? 1)
  const repeatType = repeat?.type ?? 'daily'
  const daysWeek = (repeat?.daysWeek ?? []).map((d) => d.toLowerCase())
  const result: Schedule = {} as Schedule
  const current = new Date(startDate)
  let iterations = 0
  while (current <= endDate && iterations < 2000) {
    iterations++
    if (repeatType === 'weekly') {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      if (!daysWeek.includes(dayNames[current.getDay()])) {
        current.setDate(current.getDate() + 1)
        continue
      }
    } else if (repeatType === 'monthly' && current.getDate() !== startDate.getDate()) {
      current.setDate(current.getDate() + 1)
      continue
    } else if (repeatType === 'annually') {
      if (current.getMonth() !== startDate.getMonth() || current.getDate() !== startDate.getDate()) {
        current.setDate(current.getDate() + 1)
        continue
      }
    }
    const y = current.getFullYear()
    const m = current.getMonth()
    const d = current.getDate()
    if (!result[y]) result[y] = {} as any
    if (!result[y][m]) result[y][m] = {} as any
    if (!result[y][m][d]) result[y][m][d] = []
    result[y][m][d].push({ id: Number(id), idElement, title, message, date: current.toISOString(), type, reminder } as ScheduleElement)
    if (repeatType === 'annually') current.setFullYear(current.getFullYear() + frecuency)
    else if (repeatType === 'monthly') current.setMonth(current.getMonth() + frecuency)
    else current.setDate(current.getDate() + 1)
  }
  return result
}

export function removeElementSchedule(params: { id: string; schedule: Schedule }): Schedule {
  const { id, schedule } = params
  for (const year in schedule) {
    const y = Number(year)
    for (const month in schedule[y]) {
      const m = Number(month)
      for (const day in schedule[y][m]) {
        const d = Number(day)
        const elements = schedule[y][m][d]
        schedule[y][m][d] = elements.filter((e: any) => String(e.idElement) !== id)
        if (schedule[y][m][d].length === 0) {
          delete schedule[y][m][d]
          if (Object.keys(schedule[y][m]).length === 0) {
            delete schedule[y][m]
            if (Object.keys(schedule[y]).length === 0) delete schedule[y]
          }
        }
      }
    }
  }
  return schedule
}

export function generateEventSchedule(params: { scheduleElement: Schedule; schedule: Schedule }): Schedule {
  const { scheduleElement, schedule } = params
  const merged: Schedule = JSON.parse(JSON.stringify(schedule))
  for (const year in scheduleElement) {
    const y = Number(year)
    if (!merged[y]) merged[y] = {} as any
    for (const month in scheduleElement[y]) {
      const m = Number(month)
      if (!merged[y][m]) merged[y][m] = {} as any
      for (const day in scheduleElement[y][m]) {
        const d = Number(day)
        if (!merged[y][m][d]) merged[y][m][d] = []
        for (const el of scheduleElement[y][m][d]) {
          const existing = merged[y][m][d].find((e: any) => e.idElement === (el as any).idElement)
          if (existing) Object.assign(existing, el)
          else merged[y][m][d].push(el as ScheduleElement)
        }
      }
    }
  }
  return merged
}
