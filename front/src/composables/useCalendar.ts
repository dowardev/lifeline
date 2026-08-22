// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { CalendarController } from '@/controllers/calendarController'

export function useCalendar(): {
  setCurrentDates: CalendarController['setCurrentDates']
  setCalendarModeView: CalendarController['setCalendarModeView']
  getCurrentDate: CalendarController['getCurrentDate']
  setCurrentDate: CalendarController['setCurrentDate']
  setCurrentDateStored: CalendarController['setCurrentDateStored']
  setStoredCalendarModeView: CalendarController['setStoredCalendarModeView']
  getStoredCalendarModeView: CalendarController['getStoredCalendarModeView']
  getCalendarModeView: CalendarController['getCalendarModeView']
  getViewDates: CalendarController['getViewDates']
  getCalendarDataStatus: CalendarController['getCalendarDataStatus']
  setCalendarDataStatus: CalendarController['setCalendarDataStatus']
} {
  const controller = new CalendarController()
  return {
    setCurrentDates: controller.setCurrentDates.bind(controller),
    setCalendarModeView: controller.setCalendarModeView.bind(controller),
    getCurrentDate: controller.getCurrentDate.bind(controller),
    setCurrentDate: controller.setCurrentDate.bind(controller),
    setCurrentDateStored: controller.setCurrentDateStored.bind(controller),
    setStoredCalendarModeView: controller.setStoredCalendarModeView.bind(controller),
    getStoredCalendarModeView: controller.getStoredCalendarModeView.bind(controller),
    getCalendarModeView: controller.getCalendarModeView.bind(controller),
    getViewDates: controller.getViewDates.bind(controller),
    getCalendarDataStatus: controller.getCalendarDataStatus.bind(controller),
    setCalendarDataStatus: controller.setCalendarDataStatus.bind(controller),
  }
}
