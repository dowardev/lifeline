import { ReminderController } from '@/controllers/reminderController'

export function useReminder(): {
  getEventReminders: ReminderController['getEventReminders']
  generatorReminder: ReminderController['generatorReminder']
  setReminder: ReminderController['setReminder']
  cancelReminder: ReminderController['cancelReminder']
} {
  const controller = new ReminderController()
  return {
    getEventReminders: controller.getEventReminders.bind(controller),
    generatorReminder: controller.generatorReminder.bind(controller),
    setReminder: controller.setReminder.bind(controller),
    cancelReminder: controller.cancelReminder.bind(controller),
  }
}
