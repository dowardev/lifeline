import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import WidgetWrapper from '@/components/widgets/WidgetWrapper.vue'

const { removeWidgetMock } = vi.hoisted(() => ({ removeWidgetMock: vi.fn() }))

vi.mock('gridstack/dist/vue', () => ({
  GridStack: { template: '<div><slot /></div>' },
  useGridStack: () => ({ grid: undefined }),
  useGridStackItem: () => ({ node: undefined }),
}))

vi.mock('@/composables/useWidgets', () => ({
  useWidgets: () => ({
    availableWidgets: { value: [] },
    removeWidget: removeWidgetMock,
  }),
}))

describe('WidgetWrapper delete button', () => {
  it('invokes removeWidget with the instance id when the trash button is clicked', () => {
    const wrapper = shallowMount(WidgetWrapper, {
      props: { widgetId: 'calendar', instanceId: 'inst-abc' },
    })

    wrapper.find('[aria-label="Eliminar widget"]').trigger('click')

    expect(removeWidgetMock).toHaveBeenCalledTimes(1)
    expect(removeWidgetMock).toHaveBeenCalledWith({ instanceId: 'inst-abc' })
  })
})
