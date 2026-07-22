import { ScheduleController } from '@/controllers/scheduleController'
import { generateScheduleElement, removeElementSchedule, generateEventSchedule } from '@/utils/schedule'

export function useSchedule(): {
  generateEventSchedule: typeof generateEventSchedule
  generateScheduleElement: typeof generateScheduleElement
  removeElementSchedule: typeof removeElementSchedule
  setReminders: ScheduleController['setReminders']
} {
  const controller = new ScheduleController()
  return {
    generateEventSchedule,
    generateScheduleElement,
    removeElementSchedule,
    setReminders: controller.setReminders.bind(controller),
  }
}
