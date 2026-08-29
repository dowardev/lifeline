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
      order: number
      escritorio?: number
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
      return [...activeWidgets.value]
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
    // Arrange widgets in a 2-column grid so the desktop/tablet default layout fits the
    // viewport with no vertical scroll: column 0 -> x:0, column 1 -> x:6, same row per pair.
    const index = activeWidgets.value.length
    const col = index % 2
    const row = Math.floor(index / 2)
    return {
      id: generateId(),
      widgetId: widgetDef.id,
      x: { lg: col * 6, md: col * 6 },
      y: { lg: row * 8, md: row * 8 },
      w: { ...widgetDef.defaultWidth },
      h: { ...widgetDef.defaultHeight },
      props: { ...widgetDef.props },
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

  function assignWidgetEscritorio(params: { instanceId: string; targetIndex: number | null }): void {
    const widget = activeWidgets.value.find((w) => w.id === params.instanceId)
    if (!widget) return
    widget.escritorio = params.targetIndex ?? undefined
    saveToStorage()
  }

  function loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return false
      }

      const layout: SavedLayout = JSON.parse(stored)
      if (layout.version !== LAYOUT_VERSION) {
        return false
      }

      activeWidgets.value = layout.widgets
      currentBreakpoint.value = layout.breakpoint
      isInitialized.value = true
      return true
    } catch (error) {
      console.warn('widget layout load failed', error)
      return false
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
    if (activeWidgets.value.length > 0) {
      return
    }

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
    assignWidgetEscritorio,
    getActiveWidgetsForBreakpoint,
    addWidget,
    removeWidget,
    updateWidgetPosition,
    updateWidgetLayout,
    updateWidgetProps,    reorderWidgets,
    setOrderForLayout,    setBreakpoint,
    loadFromStorage,
    saveToStorage,
    initializeDefaultLayout,
    resetToDefault,
  }
})

/**
 * Capacity-aware greedy packing of widgets into "escritorios" (screens/pages).
 * Each escritorio is a grid of `cols` columns and `rowsPerEscritorio` rows. Widgets are
 * placed in order; when one does not fit the remaining space of the current escritorio, a
 * new escritorio is opened. Mobile packs one widget per page (`mobileOnePerPage`).
 */
export function packIntoEscritorios(params: {
  widgets: WidgetInstance[]
  breakpoint: Breakpoint
  rowsPerEscritorio: number
  cols?: number
  mobileOnePerPage?: boolean
}): WidgetInstance[][] {
  if (params.mobileOnePerPage) {
    return params.widgets.map((w) => [w])
  }
  const cols = params.cols ?? 12
  const rows = Math.max(1, params.rowsPerEscritorio)
  const bp = params.breakpoint
  const newGrid = () => Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false))
  const fits = (grid: boolean[][], r: number, c: number, w: number, h: number): boolean => {
    if (r + h > rows || c + w > cols) return false
    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) {
        if (grid[rr][cc]) return false
      }
    }
    return true
  }
  const mark = (grid: boolean[][], r: number, c: number, w: number, h: number): void => {
    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) {
        grid[rr][cc] = true
      }
    }
  }
  const place = (w: WidgetInstance, r: number, c: number): WidgetInstance => ({
    ...w,
    x: { ...w.x, [bp]: c },
    y: { ...w.y, [bp]: r },
  })

  // Pinned widgets keep their assigned escritorio; unpinned ones are auto-packed.
  const pinned = params.widgets
    .filter((w) => w.escritorio != null)
    .sort((a, b) => (a.escritorio as number) - (b.escritorio as number))
  const unpinned = params.widgets.filter((w) => w.escritorio == null)

  const maxPinned = pinned.reduce((m, w) => Math.max(m, w.escritorio as number), -1)
  const escritorios: WidgetInstance[][] = Array.from(
    { length: Math.max(maxPinned + 1, 1) },
    () => [],
  )
  const grids = escritorios.map(() => newGrid())

  const tryPlace = (w: WidgetInstance, e: number): boolean => {
    if (e < 0 || e >= escritorios.length) return false
    const ww = w.w[bp] ?? 4
    const hh = w.h[bp] ?? 4
    const curX = w.x[bp] ?? 0
    const curY = w.y[bp] ?? 0
    if (fits(grids[e], curY, curX, ww, hh)) {
      mark(grids[e], curY, curX, ww, hh)
      escritorios[e].push(place(w, curY, curX))
      return true
    }
    for (let r = 0; r <= rows - hh; r++) {
      for (let c = 0; c <= cols - ww; c++) {
        if (fits(grids[e], r, c, ww, hh)) {
          mark(grids[e], r, c, ww, hh)
          escritorios[e].push(place(w, r, c))
          return true
        }
      }
    }
    return false
  }

  // 1) Pinned widgets go to their assigned escritorio (best effort).
  for (const w of pinned) {
    const e = w.escritorio as number
    if (!tryPlace(w, e)) {
      escritorios[e].push(place(w, 0, 0))
      mark(grids[e], 0, 0, w.w[bp] ?? 4, w.h[bp] ?? 4)
    }
  }

  // 2) Auto-pack unpinned widgets, filling existing escritorios then new ones.
  for (const w of unpinned) {
    let placed = false
    for (let e = 0; e < escritorios.length; e++) {
      if (tryPlace(w, e)) {
        placed = true
        break
      }
    }
    if (!placed) {
      escritorios.push([])
      grids.push(newGrid())
      tryPlace(w, escritorios.length - 1)
    }
  }

  return escritorios
}

/**
 * Returns true when `widget` fits inside `targetIndex` given the current packing.
 * Used to verify a manual "move to escritorio" before committing the pin.
 */
export function canFitInEscritorio(params: {
  widget: WidgetInstance
  targetIndex: number
  escritorios: WidgetInstance[][]
  breakpoint: Breakpoint
  rowsPerEscritorio: number
  mobileOnePerPage?: boolean
  cols?: number
}): boolean {
  const bp = params.breakpoint
  const rows = Math.max(1, params.rowsPerEscritorio)
  const cols = params.cols ?? 12
  if (params.mobileOnePerPage) {
    return (params.escritorios[params.targetIndex]?.length ?? 0) === 0
  }
  const grid = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false))
  const fits = (r: number, c: number, w: number, h: number): boolean => {
    if (r + h > rows || c + w > cols) return false
    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) {
        if (grid[rr][cc]) return false
      }
    }
    return true
  }
  const mark = (r: number, c: number, w: number, h: number): void => {
    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) {
        grid[rr][cc] = true
      }
    }
  }

  // Place the widgets already in the target escritorio at their current positions.
  for (const w of params.escritorios[params.targetIndex] ?? []) {
    mark(w.y[bp] ?? 0, w.x[bp] ?? 0, w.w[bp] ?? 4, w.h[bp] ?? 4)
  }

  // Try the moved widget at its current position, then scan for any free slot.
  const mw = params.widget.w[bp] ?? 4
  const mh = params.widget.h[bp] ?? 4
  if (fits(params.widget.y[bp] ?? 0, params.widget.x[bp] ?? 0, mw, mh)) return true
  for (let r = 0; r <= rows - mh; r++) {
    for (let c = 0; c <= cols - mw; c++) {
      if (fits(r, c, mw, mh)) return true
    }
  }
  return false
}
