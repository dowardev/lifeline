import { LocalNotifications } from '@capacitor/local-notifications'

export class ScheduleController {
  async setReminders(params: { reminder: Date; id: number; title: string; message: string }): Promise<void> {
    const { id, reminder, title, message } = params
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return
    await LocalNotifications.schedule({
      notifications: [{
        title, body: message, id,
        schedule: { at: reminder },
        actionTypeId: '', extra: '',
      }],
    }).catch((e) => console.error(e))
  }
}
