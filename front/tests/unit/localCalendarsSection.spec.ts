// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * LBDS-292 - the "Calendarios locales" section of Settings → Cuentas.
 *
 * The section owns the three rules the ticket fixes on the client:
 *   - the protected default calendar offers no rename and no delete;
 *   - a mirrored row (an external source) is not managed here;
 *   - deleting a calendar the user created offers exactly two ways out:
 *     destroy it with its events, or move its events to another local
 *     calendar.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, test, vi, beforeEach } from 'vitest'

const calendarList = {
  value: [] as Array<Record<string, unknown>>,
}

const deleteCalls: Array<{
  id: number
  strategy: 'delete_events' | 'move'
  destinationCalendarId?: number
}> = []

const renameCalls: Array<{ id: number; name: string }> = []

/** Minimal stubs for Ionic components used by LocalCalendarsSection. */
const ionicStubs = {
  'ion-button': { props: ['disabled', 'color', 'fill', 'expand', 'slot'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
  'ion-buttons': { props: ['slot'], template: '<div><slot /></div>' },
  'ion-content': { props: ['class'], template: '<div class="ion-content"><slot /></div>' },
  'ion-header': { template: '<header><slot /></header>' },
  'ion-input': { props: ['value', 'label', 'labelPlacement'], emits: ['ionInput'], template: '<input :value="value" @input="$emit(\'ionInput\', { detail: { value: $event.target.value } })" />' },
  'ion-item': { props: ['lines'], template: '<div class="ion-item"><slot /></div>' },
  'ion-label': { template: '<label><slot /></label>' },
  'ion-list': { props: ['class'], template: '<div class="ion-list"><slot /></div>' },
  'ion-list-header': { template: '<div class="ion-list-header"><slot /></div>' },
  'ion-modal': { props: ['isOpen'], emits: ['didDismiss', 'update:isOpen'], template: '<div v-if="isOpen"><slot /></div>' },
  'ion-note': { template: '<small><slot /></small>' },
  'ion-radio': { props: ['value', 'labelPlacement'], template: '<label><input type="radio" :value="value" @change="$emit(\'change\')" /><slot /></label>' },
  'ion-radio-group': { props: ['value'], emits: ['update:value'], template: '<div><slot /></div>' },
  'ion-select': { props: ['value', 'label', 'labelPlacement'], emits: ['ionChange'], template: '<select :value="value" @change="$emit(\'ionChange\', { detail: { value: $event.target.value } })"><slot /></select>' },
  'ion-select-option': { props: ['value'], template: '<option :value="value"><slot /></option>' },
  'ion-title': { template: '<h1><slot /></h1>' },
  'ion-toolbar': { template: '<div class="ion-toolbar"><slot /></div>' },
} as const

vi.mock('@/controllers/calendarController', () => ({
  CalendarController: class {
    async getCalendars(): Promise<unknown[]> {
      return calendarList.value
    }
    getCalendarList(): Array<Record<string, unknown>> {
      return calendarList.value
    }
    async renameCalendar(params: { id: number; name: string }): Promise<unknown[]> {
      renameCalls.push(params)
      return calendarList.value
    }
    async deleteCalendar(params: {
      id: number
      strategy: 'delete_events' | 'move'
      destinationCalendarId?: number
    }): Promise<unknown[]> {
      deleteCalls.push(params)
      return calendarList.value
    }
  },
}))

vi.mock('@/controllers/systemController', () => ({
  SystemController: class {
    async openToast(): Promise<void> {}
  },
}))

const LocalCalendarsSection = (
  await import('@/views/settings/components/LocalCalendarsSection.vue')
).default

const localCalendar = {
  id: 2,
  name: 'Trabajo',
  default: 0,
  source_id: null,
  source: null,
  archived_at: null,
  selectable: true,
  protected: false,
  local: true,
}

const defaultCalendar = {
  id: 1,
  name: 'Personal',
  default: 1,
  source_id: null,
  source: null,
  archived_at: null,
  selectable: true,
  protected: true,
  local: true,
}

const mirroredCalendar = {
  id: 3,
  name: 'Google',
  default: 0,
  source_id: 7,
  source: { id: 7, type: 'ics', name: 'Google', color: '#fff', username: null },
  archived_at: null,
  selectable: true,
  protected: false,
  local: false,
}

function mountSection(): ReturnType<typeof mount> {
  return mount(LocalCalendarsSection, {
    global: {
      stubs: ionicStubs,
    },
  })
}

beforeEach(() => {
  calendarList.value = [defaultCalendar, localCalendar, mirroredCalendar]
  deleteCalls.length = 0
  renameCalls.length = 0
})

describe('LocalCalendarsSection (LBDS-292)', () => {
  test('lists the local calendars and not the mirrored ones', () => {
    const wrapper = mountSection()
    const text = wrapper.text()
    expect(text).toContain('Trabajo')
    expect(text).toContain('Personal')
    expect(text).not.toContain('Google')
  })

  test('offers no rename and no delete for the protected default calendar', async () => {
    const wrapper = mountSection()
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')
    const labels = buttons.map((button) => button.text())
    // Two actions, both for "Trabajo": the default has none.
    expect(labels.filter((label) => label.includes('Renombrar'))).toHaveLength(1)
    expect(labels.filter((label) => label.includes('Eliminar'))).toHaveLength(1)
  })

  test('says the default calendar is protected', () => {
    const wrapper = mountSection()
    expect(wrapper.text()).toContain('no se puede renombrar ni eliminar')
  })

  test('deletes the calendar together with its events by default', async () => {
    const wrapper = mountSection()
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')
    const deleteButton = buttons.find((button) => button.text().includes('Eliminar'))
    expect(deleteButton).toBeDefined()
    await deleteButton!.trigger('click')
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Eliminar calendario'))
    expect(confirmButton).toBeDefined()
    await confirmButton!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(deleteCalls).toHaveLength(1)
    expect(deleteCalls[0]).toEqual({ id: 2, strategy: 'delete_events', destinationCalendarId: undefined })
  })
})