import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const { wakatimeInstance } = vi.hoisted(() => ({
  wakatimeInstance: {
    id: 'waka-1',
    widgetId: 'wakatime',
    x: { lg: 0, md: 0 },
    y: { lg: 0, md: 0 },
    w: { lg: 6, md: 6 },
    h: { lg: 8, md: 8 },
    isVisible: true,
    order: 1,
  },
}))

vi.mock('@/composables/useWidgets', () => ({
  useWidgets: () => ({
    activeWidgets: { value: [wakatimeInstance] },
    getWidgetName: () => 'WakaTime',
    removeWidget: vi.fn(),
    initializeDefaultLayout: vi.fn(),
    showAllWidgets: vi.fn(),
  }),
}))

vi.mock('@/components/widgets/CalendarWidget.vue', () => ({
  default: { template: '<div class="cal" />' },
}))
vi.mock('@/components/widgets/WakaTimeWidget.vue', () => ({
  default: { template: '<div class="waka" />' },
}))

import WidgetStack from '@/components/widgets/WidgetStack.vue'

describe('WidgetStack renders active widgets', () => {
  it('renders the wakatime widget when it is the only active widget (mobile should not be empty)', () => {
    const wrapper = shallowMount(WidgetStack)

    // The empty state must NOT show
    expect(wrapper.text()).not.toContain('No hay widgets añadidos')
    // The widget section must be present
    expect(wrapper.find('[aria-label*="WakaTime"]').exists()).toBe(true)
  })
})
