// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { ReminderController } from '@/controllers/reminderController'

export function useReminder(): {
  scheduleEventReminders: ReminderController['scheduleEventReminders']
  cancelEventReminders: ReminderController['cancelEventReminders']
  scheduleTaskReminders: ReminderController['scheduleTaskReminders']
  cancelTaskReminders: ReminderController['cancelTaskReminders']
  scheduleNoteReminders: ReminderController['scheduleNoteReminders']
  cancelNoteReminders: ReminderController['cancelNoteReminders']
  checkNotificationsPermissions: ReminderController['checkNotificationsPermissions']
} {
  const controller = new ReminderController()
  return {
    scheduleEventReminders: controller.scheduleEventReminders.bind(controller),
    cancelEventReminders: controller.cancelEventReminders.bind(controller),
    scheduleTaskReminders: controller.scheduleTaskReminders.bind(controller),
    cancelTaskReminders: controller.cancelTaskReminders.bind(controller),
    scheduleNoteReminders: controller.scheduleNoteReminders.bind(controller),
    cancelNoteReminders: controller.cancelNoteReminders.bind(controller),
    checkNotificationsPermissions: controller.checkNotificationsPermissions.bind(controller),
  }
}