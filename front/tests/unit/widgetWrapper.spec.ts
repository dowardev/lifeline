import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import WidgetWrapper from '@/components/widgets/WidgetWrapper.vue'

const { removeWidgetMock } = vi.hoisted((): { removeWidgetMock: ReturnType<typeof vi.fn> } => ({ removeWidgetMock: vi.fn() }))

vi.mock('gridstack/dist/vue', (): {
  GridStack: { template: string }
  useGridStack: () => { grid: undefined }
  useGridStackItem: () => { node: undefined }
} => ({
  GridStack: { template: '<div><slot /></div>' },
  useGridStack: (): { grid: undefined } => ({ grid: undefined }),
  useGridStackItem: (): { node: undefined } => ({ node: undefined }),
}))

vi.mock('@/composables/useWidgets', (): {
  useWidgets: () => {
    availableWidgets: { value: unknown[] }
    removeWidget: typeof removeWidgetMock
  }
} => ({
  useWidgets: (): {
    availableWidgets: { value: unknown[] }
    removeWidget: typeof removeWidgetMock
  } => ({
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
