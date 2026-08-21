// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

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
