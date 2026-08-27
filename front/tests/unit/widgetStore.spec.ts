import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWidgetStore } from '@/store/widgetStore'

describe('widgetStore persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('saves and restores layout across store instances', () => {
    const store1 = useWidgetStore()
    store1.initializeDefaultLayout()
    expect(store1.activeWidgets.length).toBe(2)

    // simulate a move
    const widget = store1.activeWidgets[0]
    store1.updateWidgetPosition({
      instanceId: widget.id,
      x: 3,
      y: 5,
      w: 6,
      h: 8,
      breakpoint: 'lg',
    })

    // new pinia = fresh store, like a page reload
    setActivePinia(createPinia())
    const store2 = useWidgetStore()
    expect(store2.activeWidgets.length).toBe(0)

    store2.loadFromStorage()

    expect(store2.activeWidgets.length).toBe(2)
    const restored = store2.activeWidgets.find((w) => w.widgetId === widget.widgetId)
    expect(restored?.x.lg).toBe(3)
    expect(restored?.y.lg).toBe(5)
  })
})
