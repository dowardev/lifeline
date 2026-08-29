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

      it('removes a widget from the store when removeWidget is called', () => {
        const store = useWidgetStore()
        store.initializeDefaultLayout()
        expect(store.activeWidgets.length).toBe(2)

        const target = store.activeWidgets[0]
        store.removeWidget({ instanceId: target.id })

        expect(store.activeWidgets.length).toBe(1)
        expect(store.activeWidgets.find((w) => w.id === target.id)).toBeUndefined()
      })

      it('keeps a removed widget gone after a reload (save/restore round-trip)', () => {
        const store1 = useWidgetStore()
        store1.initializeDefaultLayout()
        expect(store1.activeWidgets.length).toBe(2)

        const target = store1.activeWidgets[0]
        store1.removeWidget({ instanceId: target.id })
        expect(store1.activeWidgets.length).toBe(1)

        // new pinia + loadFromStorage = page reload
        setActivePinia(createPinia())
        const store2 = useWidgetStore()
        expect(store2.activeWidgets.length).toBe(0)
        store2.loadFromStorage()

        expect(store2.activeWidgets.length).toBe(1)
        expect(store2.activeWidgets.find((w) => w.id === target.id)).toBeUndefined()
      })

      it('does not resurrect defaults when the saved layout is empty (delete-all persists)', () => {
        const store1 = useWidgetStore()
        store1.initializeDefaultLayout()
        expect(store1.activeWidgets.length).toBe(2)

        // user removes every widget
        store1.activeWidgets.slice().forEach((w) => store1.removeWidget({ instanceId: w.id }))
        expect(store1.activeWidgets.length).toBe(0)

        // new pinia + loadFromStorage = page reload
        setActivePinia(createPinia())
        const store2 = useWidgetStore()
        expect(store2.activeWidgets.length).toBe(0)

        // loadFromStorage must report "a layout was loaded" (even if empty) so the
        // page does NOT re-seed the default widgets on top of the explicit deletions.
        const hadSavedLayout = store2.loadFromStorage()
        expect(hadSavedLayout).toBe(true)
        expect(store2.activeWidgets.length).toBe(0)
      })

      it('produces valid md breakpoint coordinates for tablet widths', () => {
        const store = useWidgetStore()
        store.setBreakpoint({ breakpoint: 'md' })
        store.initializeDefaultLayout()
        expect(store.activeWidgets.length).toBe(2)

        const md = store.getActiveWidgetsForBreakpoint({ breakpoint: 'md' })
        expect(md.length).toBe(2)
        for (const w of md) {
          expect(typeof w.x).toBe('number')
          expect(typeof w.y).toBe('number')
          expect(w.w).toBe(6)
          expect(w.h).toBe(8)
        }
      })
    })
