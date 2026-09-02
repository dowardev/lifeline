// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import systemService from '@/services/system'
import { storage } from '@/main'
import { ViewMode } from '@/utils/types'
import { Days, EventReminderRepeat, Months } from '@/utils/interfaces'
import { toastController } from '@ionic/vue'
import type { TimeZoneGroup, TimeZoneOption } from '@/utils/interfaces'

export class SystemController {
  async openToast(params: { message: string; color?: string; duration?: number }): Promise<void> {
    const { message, color = 'dark', duration = 2000 } = params
    const toast = await toastController.create({ message, duration, color, position: 'bottom' })
    await toast.present()
  }

  translateDay(params: { dayName: keyof Days }): string {
    const days: Days = { monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles', thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo' }
    return days[params.dayName]
  }

  translateMonth(params: { monthName: keyof Months }): string {
    const months: Months = { january: 'enero', february: 'febrero', march: 'marzo', april: 'abril', may: 'mayo', june: 'junio', july: 'julio', august: 'agosto', september: 'septiembre', october: 'octubre', november: 'noviembre', december: 'diciembre' }
    return months[params.monthName]
  }

  translateEventReminderRepeat(params: { typeRepeat: keyof EventReminderRepeat }): string {
    const types: EventReminderRepeat = { unique: 'unico', daily: 'diario', weekly: 'semanal', monthly: 'mensual', annually: 'anual' }
    return types[params.typeRepeat]
  }

  async setTasksViewMode(params: { viewMode: ViewMode }): Promise<void> {
    await storage.set('tasksViewMode', params.viewMode)
  }

  async getTasksViewMode(): Promise<ViewMode> {
    const mode = await storage.get('tasksViewMode')
    return (mode as ViewMode) || 'list'
  }

  getAllTimeZonesNames(): { names: string[] } {
    return systemService.getAllTimeZonesNames()
  }

  getAllTimeZones(): TimeZoneOption[] {
    return systemService.getAllTimeZones()
  }

  getTimeZoneNames(): string[] {
    return systemService.getTimeZoneNames()
  }

  getTimeZoneLabel(name: string): string {
    return systemService.getTimeZoneLabel(name)
  }

  groupTimeZones(zones: string[]): TimeZoneGroup[] {
    return systemService.groupTimeZones(zones)
  }

  async copyToClipboard(params: { text: string }): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(params.text)
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = params.text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    }
  }
}
