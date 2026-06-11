import { ReminderController } from '@/controllers/reminderController'

export function useReminder() {
  const controller = new ReminderController()
  return {
    getEventReminders: controller.getEventReminders.bind(controller),
    generatorReminder: controller.generatorReminder.bind(controller),
    setReminder: controller.setReminder.bind(controller),
    cancelReminder: controller.cancelReminder.bind(controller),
  }
}
