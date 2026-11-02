        import { describe, it, expect, vi, beforeEach } from 'vitest'
        import { setActivePinia, createPinia } from 'pinia'
        import { mount, flushPromises } from '@vue/test-utils'
        import { nextTick } from 'vue'

        const { gridstackMock } = vi.hoisted(() => ({
          gridstackMock: {
            addWidget: vi.fn((cfg: any): any => {
              // Mimic gridstack: track nodes so re-syncs see them as already present.
              if (!gridstackMock.engine.nodes.some((n: any): boolean => n.id === cfg.id)) {
                gridstackMock.engine.nodes.push(cfg)
              }
              return cfg
            }),
            update: vi.fn(),
            removeWidget: vi.fn(),
            refreshDragHandles: vi.fn(),
            onResize: vi.fn(),
            engine: { nodes: [] as any[] },
          },
        }))

        vi.mock('gridstack/dist/vue', () => ({
          GridStack: {
            name: 'GridStack',
            props: ['options', 'components'],
            template: '<div class="grid-stack"></div>',
            mounted(this: any): void {
              this.$el.gridstack = gridstackMock
            },
          },
          useGridStack: (): { grid: typeof gridstackMock } => ({ grid: gridstackMock }),
          useGridStackItem: (): { node: undefined } => ({ node: undefined }),
        }))

        import WidgetGrid from '@/components/widgets/WidgetGrid.vue'
        import { useWidgetStore } from '@/store/widgetStore'

        // jsdom reports clientWidth 0; the component defers widget commits until the
        // container has real width, so report a non-zero width for the test.
        beforeAll(() => {
          Object.defineProperty(Element.prototype, 'clientWidth', {
            configurable: true,
            get() { return 800 },
          })
        })

        describe('WidgetGrid tablet (md breakpoint) adds widgets', () => {
          beforeEach(() => {
            setActivePinia(createPinia())
            localStorage.clear()
            gridstackMock.addWidget.mockClear()
            gridstackMock.update.mockClear()
            gridstackMock.engine.nodes = []
          })

          async function mountWithBreakpoint(bp: 'lg' | 'md'): Promise<{ store: ReturnType<typeof useWidgetStore>; wrapper: ReturnType<typeof mount> }> {
            const store = useWidgetStore()
            store.setBreakpoint({ breakpoint: bp })
            store.initializeDefaultLayout()
            const wrapper = mount(WidgetGrid)
            await flushPromises()
            await nextTick()
            await nextTick()
            await nextTick()
            return { store, wrapper }
          }

          // Unique widgets actually committed to the grid (deduped by widget type
          // across the initial sync and the rAF/ResizeObserver re-syncs).
          function addedWidgets(): Array<{ props: { widgetId: string } }> {
            const calls = gridstackMock.addWidget.mock.calls.map((c) => c[0])
            return Array.from(new Map(calls.map((c) => [c.props.widgetId, c])).values())
          }

          it('commits every active widget on tablet (md)', async () => {
            await mountWithBreakpoint('md')
            const widgets = addedWidgets()
            expect(widgets.map((w) => w.props.widgetId).sort()).toEqual(['calendar', 'wakatime'])
          })

          it('adds widgets with valid md coordinates', async () => {
            await mountWithBreakpoint('md')
            const widgets = addedWidgets()
            expect(widgets.length).toBe(2)
            for (const cfg of widgets) {
              expect(typeof cfg.x).toBe('number')
              expect(typeof cfg.y).toBe('number')
              expect(typeof cfg.w).toBe('number')
              expect(typeof cfg.h).toBe('number')
              expect(cfg.w).toBe(6)
              expect(cfg.h).toBe(8)
            }
          })

          it('commits every active widget on desktop (lg)', async () => {
            await mountWithBreakpoint('lg')
            const widgets = addedWidgets()
            expect(widgets.map((w) => w.props.widgetId).sort()).toEqual(['calendar', 'wakatime'])
          })
        })

