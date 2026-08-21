// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

import { EventController } from '@/controllers/eventController'

export function useEvent(): {
  getEvents: EventController['getEvents']
  loadEvents: EventController['loadEvents']
  createEvent: EventController['createEvent']
  updateEvent: EventController['updateEvent']
  removeEvent: EventController['removeEvent']
  setDate: EventController['setDate']
} {
  const controller = new EventController()
  return {
    getEvents: controller.getEvents.bind(controller),
    loadEvents: controller.loadEvents.bind(controller),
    createEvent: controller.createEvent.bind(controller),
    updateEvent: controller.updateEvent.bind(controller),
    removeEvent: controller.removeEvent.bind(controller),
    setDate: controller.setDate.bind(controller),
  }
}
