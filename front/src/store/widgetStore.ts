// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Breakpoint = 'lg' | 'md'

export interface WidgetDefinition {
  id: string
  name: string
  component: string
  description?: string
  defaultWidth: { lg: number; md: number }
  defaultHeight: { lg: number; md: number }
  minWidth: { lg: number; md: number }
  minHeight: { lg: number; md: number }
  maxWidth?: { lg: number; md: number }
  maxHeight?: { lg: number; md: number }
  props?: Record<string, unknown>
}

export interface WidgetInstance {
  id: string
  widgetId: string
  x: { lg: number; md: number }
  y: { lg: number; md: number }
  w: { lg: number; md: number }
  h: { lg: number; md: number }
  props?: Record<string, unknown>
  isVisible: boolean
  order: number
}

export interface SavedLayout {
  version: number
  widgets: WidgetInstance[]
  breakpoint: Breakpoint
  updatedAt: string
}

const STORAGE_KEY = 'lifeline_widget_layout'
const LAYOUT_VERSION = 2

const DEFAULT_WIDGETS: WidgetDefinition[] = [
  {
    id: 'calendar',
    name: 'Calendario',
    component: 'CalendarWidget',
    description: 'Vista de calendario del día actual',
    defaultWidth: { lg: 6, md: 6 },
    defaultHeight: { lg: 8, md: 8 },
    minWidth: { lg: 4, md: 6 },
    minHeight: { lg: 6, md: 6 },
    maxWidth: { lg: 12, md: 12 },
    maxHeight: { lg: 12, md: 12 },
  },
  {
    id: 'wakatime',
    name: 'WakaTime',
    component: 'WakaTimeWidget',
    description: 'Estadísticas de tiempo de codificación',
    defaultWidth: { lg: 6, md: 6 },
    defaultHeight: { lg: 8, md: 8 },
    minWidth: { lg: 4, md: 6 },
    minHeight: { lg: 6, md: 6 },
    maxWidth: { lg: 12, md: 12 },
    maxHeight: { lg: 12, md: 12 },
  },
]

export const useWidgetStore = defineStore('widget', () => {
  const availableWidgets = ref<WidgetDefinition[]>(DEFAULT_WIDGETS)
  const activeWidgets = ref<WidgetInstance[]>([])
  const currentBreakpoint = ref<Breakpoint>('lg')
  const isInitialized = ref(false)

  const getWidgetDefinition = computed(() => {
    return (params: { widgetId: string }) =>
      availableWidgets.value.find(w => w.id === params.widgetId)
  })

  const getActiveWidgetsForBreakpoint = computed(() => {
    return (params: { breakpoint: Breakpoint }) => {
      const breakpoint = params.breakpoint
      return activeWidgets.value
        .filter(w => w.isVisible)
        .sort((a, b) => a.order - b.order)
        .map(w => ({
          ...w,
          x: w.x[breakpoint],
          y: w.y[breakpoint],
          w: w.w[breakpoint],
          h: w.h[breakpoint],
        }))
    }
  })

  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  function getNextOrder(): number {
    return activeWidgets.value.length > 0
      ? Math.max(...activeWidgets.value.map(w => w.order)) + 1
      : 0
  }

  function createDefaultInstance(params: { widgetDef: WidgetDefinition }): WidgetInstance {
    const widgetDef = params.widgetDef
    const bp = currentBreakpoint.value
    let y = 0
    if (activeWidgets.value.length > 0) {
      y = Math.max(...activeWidgets.value.map(w => w.y[bp] + w.h[bp]))
    }
    return {
      id: generateId(),
      widgetId: widgetDef.id,
      x: { lg: 0, md: 0 },
      y: { lg: y, md: y },
      w: { ...widgetDef.defaultWidth },
      h: { ...widgetDef.defaultHeight },
      props: { ...widgetDef.props },
      isVisible: true,
      order: getNextOrder(),
    }
  }

  function addWidget(params: { widgetId: string }): WidgetInstance | null {
    const def = availableWidgets.value.find(w => w.id === params.widgetId)
    if (!def) return null

    const instance = createDefaultInstance({ widgetDef: def })
    activeWidgets.value.push(instance)
    saveToStorage()
    return instance
  }

  function removeWidget(params: { instanceId: string }): void {
    const idx = activeWidgets.value.findIndex(w => w.id === params.instanceId)
    if (idx >= 0) {
      activeWidgets.value.splice(idx, 1)
      saveToStorage()
    }
  }

  function updateWidgetPosition(params: {
    instanceId: string
    x: number
    y: number
    w: number
    h: number
    breakpoint: Breakpoint
  }): void {
    const widget = activeWidgets.value.find(w => w.id === params.instanceId)
    if (!widget) return

    widget.x[params.breakpoint] = params.x
    widget.y[params.breakpoint] = params.y
    widget.w[params.breakpoint] = params.w
    widget.h[params.breakpoint] = params.h
    saveToStorage()
  }

  function updateWidgetProps(params: { instanceId: string; props: Record<string, unknown> }): void {
    const widget = activeWidgets.value.find(w => w.id === params.instanceId)
    if (!widget) return
    widget.props = { ...widget.props, ...params.props }
    saveToStorage()
  }

  function toggleWidgetVisibility(params: { instanceId: string; visible: boolean }): void {
    const widget = activeWidgets.value.find(w => w.id === params.instanceId)
    if (!widget) return
    widget.isVisible = params.visible
    saveToStorage()
  }

  function reorderWidgets(params: { instanceId: string; newOrder: number }): void {
    const widget = activeWidgets.value.find(w => w.id === params.instanceId)
    if (!widget) return
    widget.order = params.newOrder
    activeWidgets.value.sort((a, b) => a.order - b.order)
    activeWidgets.value.forEach((w, i) => { w.order = i })
    saveToStorage()
  }

  function setOrderForLayout(params: { instanceIds: string[] }): void {
    params.instanceIds.forEach((id, i) => {
      const widget = activeWidgets.value.find(w => w.id === id)
      if (widget) widget.order = i
    })
    saveToStorage()
  }

  function showAllWidgets(params: {}): void {
    activeWidgets.value.forEach(w => { w.isVisible = true })
    saveToStorage()
  }

  function updateWidgetLayout(params: {
    items: Array<{ instanceId: string; x: number; y: number; w: number; h: number }>
    breakpoint: Breakpoint
  }): void {
    const byId = new Map(activeWidgets.value.map((w) => [w.id, w]))
    params.items.forEach((item) => {
      const widget = byId.get(item.instanceId)
      if (!widget) return
      widget.x[params.breakpoint] = item.x
      widget.y[params.breakpoint] = item.y
      widget.w[params.breakpoint] = item.w
      widget.h[params.breakpoint] = item.h
    })
    saveToStorage()
  }

  function setBreakpoint(params: { breakpoint: Breakpoint }): void {
    currentBreakpoint.value = params.breakpoint
  }

  function loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const layout: SavedLayout = JSON.parse(stored)
      if (layout.version !== LAYOUT_VERSION) return

      activeWidgets.value = layout.widgets
      currentBreakpoint.value = layout.breakpoint
      isInitialized.value = true
    } catch (error) {
      console.warn('widget layout load failed', error)
      isInitialized.value = true
    }
  }

  function saveToStorage(): void {
    try {
      const layout: SavedLayout = {
        version: LAYOUT_VERSION,
        widgets: activeWidgets.value,
        breakpoint: currentBreakpoint.value,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch (error) {
      console.warn('widget layout save failed', error)
    }
  }

  function initializeDefaultLayout(): void {
    if (activeWidgets.value.length > 0) return

    DEFAULT_WIDGETS.forEach(def => {
      const instance = createDefaultInstance({ widgetDef: def })
      activeWidgets.value.push(instance)
    })
    saveToStorage()
  }

  function resetToDefault(): void {
    activeWidgets.value = []
    initializeDefaultLayout()
  }

  return {
    availableWidgets,
    activeWidgets,
    currentBreakpoint,
    isInitialized,
    getWidgetDefinition,
    getActiveWidgetsForBreakpoint,
    addWidget,
    removeWidget,
    updateWidgetPosition,
    updateWidgetLayout,
    updateWidgetProps,
    toggleWidgetVisibility,
    reorderWidgets,
    setOrderForLayout,
    showAllWidgets,
    setBreakpoint,
    loadFromStorage,
    saveToStorage,
    initializeDefaultLayout,
    resetToDefault,
  }
})
