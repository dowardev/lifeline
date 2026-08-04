import { storage } from '@/main'
import { ViewMode } from '@/utils/types'
import { Days, EventReminderNotification, EventReminderRepeat, Months } from '@/utils/interfaces'
import { toastController } from '@ionic/vue'

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

  translateEventReminderNotification(params: { notificationName: keyof EventReminderNotification }): string {
    const names: EventReminderNotification = { just: 'A tiempo', '5mb': '5 minutos antes', '10mb': '10 minutos antes', '15mb': '15 minutos antes', '30mb': '30 minutos antes', '1hb': '1 hora antes', '2hb': '2 hora antes', '1db': '1 dia antes', '2db': '2 dia antes', '1wb': '1 semana antes', '1mtb': '1 mes antes' }
    return names[params.notificationName]
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
    try {
      return { names: (Intl as any).supportedValuesOf('timeZone') || [] }
    } catch {
      return { names: [] }
    }
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
