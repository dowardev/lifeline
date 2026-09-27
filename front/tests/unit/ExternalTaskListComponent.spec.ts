// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import es from '@/plugins/i18n/languages/es'
import en from '@/plugins/i18n/languages/en'
import type { ExternalTask } from '@/services/externalTaskService'

const state = vi.hoisted(() => ({
  tasks: [] as ExternalTask[],
  fail: false,
}))

vi.mock('@/composables/useExternalSync', () => ({
  useExternalSyncOnEnter: (): { lastSyncedAt: { value: null } } => ({
    lastSyncedAt: { value: null },
  }),
}))

vi.mock('@/controllers/externalTasksController', () => ({
  ExternalTasksController: class {
    async loadTasks(): Promise<ExternalTask[]> {
      if (state.fail) throw new Error('boom')
      return state.tasks
    }
  },
}))

import ExternalTaskListComponent from '@/components/tasks/list/ExternalTaskListComponent.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'en',
  messages: { es, en },
})

function mountList(): ReturnType<typeof mount> {
  return mount(ExternalTaskListComponent, {
    global: { plugins: [i18n] },
  })
}

const sampleTasks: ExternalTask[] = [
  {
    key: 'ext-task-1',
    title: 'Entregar informe',
    status: 'NEEDS-ACTION',
    due_at: '2026-12-01T10:00:00.000Z',
    description: 'Informe mensual',
    sourceName: 'Google Tasks',
    reminderOffsetsSeconds: [3600],
  },
  {
    key: 'ext-task-2',
    title: 'Comprar pan',
    status: 'COMPLETED',
    due_at: undefined,
    description: undefined,
    sourceName: 'CalDAV',
  },
]

beforeEach(() => {
  state.tasks = []
  state.fail = false
})

describe('ExternalTaskListComponent (LBDS-271)', () => {
  test('mounts without errors', () => {
    const wrapper = mountList()
    expect(wrapper.exists()).toBe(true)
  })

  test('shows the empty state when no tasks are returned', async () => {
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.find('[data-testid="ext-tasks-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ext-tasks-list"]').exists()).toBe(false)
  })

  test('renders each task title and source', async () => {
    state.tasks = sampleTasks
    const wrapper = mountList()
    await flushPromises()
    const list = wrapper.find('[data-testid="ext-tasks-list"]')
    expect(list.exists()).toBe(true)
    const text = wrapper.text()
    expect(text).toContain('Entregar informe')
    expect(text).toContain('Comprar pan')
    expect(text).toContain('Google Tasks')
    expect(text).toContain('CalDAV')
  })

  test('shows the read-only banner', async () => {
    state.tasks = sampleTasks
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.text()).toContain('Solo lectura')
  })

  test('does not expose editable affordances (no checkbox, no edit/delete buttons)', async () => {
    state.tasks = sampleTasks
    const wrapper = mountList()
    await flushPromises()
    // No interactive controls beyond the read-only items themselves.
    expect(wrapper.find('ion-checkbox').exists()).toBe(false)
    expect(wrapper.find('button[aria-label*="edit" i]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label*="delete" i]').exists()).toBe(false)
  })

  test('shows the load-error state when the controller throws', async () => {
    state.fail = true
    const wrapper = mountList()
    await flushPromises()
    expect(wrapper.text()).toContain('No se pudieron cargar las tareas externas')
    expect(wrapper.find('[data-testid="ext-tasks-list"]').exists()).toBe(false)
  })
})