import { ScheduleController } from '@/controllers/scheduleController'
import { generateScheduleElement, removeElementSchedule, generateEventSchedule } from '@/utils/schedule'

export function useSchedule() {
  const controller = new ScheduleController()
  return {
    generateEventSchedule,
    generateScheduleElement,
    removeElementSchedule,
    setReminders: controller.setReminders.bind(controller),
  }
}
