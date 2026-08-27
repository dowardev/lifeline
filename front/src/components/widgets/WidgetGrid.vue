<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div ref="gridContainer" class="widget-grid-container">
    <GridStack
      :options="gridOptions"
      :components="widgetComponents"
      @change="(e, nodes) => onGridChange({ nodes })"
      @added="(e, nodes) => onWidgetAdded({ nodes })"
      @removed="(e, nodes) => onWidgetRemoved({ nodes })"
      @resizestop="(el) => onResizeStop({ el })"
      @dragstop="(el) => onDragStop({ el })"
    />
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import 'gridstack/dist/gridstack.css'

// 2. Controllers / Composables
import { useWidgets } from '@/composables/useWidgets'
const {
  availableWidgets,
  activeWidgets,
  currentBreakpoint,
  saveToStorage,
  removeWidget,
  updateWidgetLayout,
  setOrderForLayout,
} = useWidgets()

// 3. Components
import { GridStack } from 'gridstack/dist/vue'
import WidgetWrapper from './WidgetWrapper.vue'

// 4. Interface and types imports
import type { GridStackOptions, GridStackNode } from 'gridstack'
import type { Breakpoint } from '@/store/widgetStore'

// 5. Main (props, emits, etc.)
const emit = defineEmits<{
  'layout-change': []
}>()

// 6. Vars and const
const gridContainer = ref<HTMLElement | null>(null)
const gridOptions = ref<GridStackOptions>({
  column: 12,
  cellHeight: 70,
  margin: 8,
  draggable: {
    handle: '.widget-drag-handle',
    scroll: true,
    appendTo: 'body',
  },
  resizable: {
    handles: 'e, se, s, sw',
  },
  float: true,
  animate: true,
  children: [],
  removable: false,
})

const widgetComponents = { WidgetWrapper }

// 7. Watch
// Only rebuild the grid when widgets are added/removed/shown/hidden.
// Position mutations must NOT trigger a full rebuild (feedback loop).
watch(
  () => activeWidgets.value.map((w) => `${w.id}:${w.isVisible}`).join('|'),
  () => {
    if (!gridContainer.value) return
    syncGridWithStore({ widgets: activeWidgets.value })
  },
)

watch(() => currentBreakpoint.value, (bp) => {
  if (gridContainer.value) {
    updateGridForBreakpoint({ breakpoint: bp })
  }
})

// 8. Computed
const breakpoint = computed<Breakpoint>(() => currentBreakpoint.value)

// 9. OnMounted
// Layout init is owned by HomePage (single source of truth). WidgetGrid only
// reconciles the grid against whatever the store already has; the watch on
// `activeWidgets` keeps the grid in sync after HomePage loads.
onMounted(() => {
  nextTick(() => {
    syncGridWithStore({ widgets: activeWidgets.value })
    // Vue wrapper teleports child content into item DOM asynchronously;
    // do a final rescan after the next tick to be sure drag handles
    // inside dynamic content are picked up.
    nextTick(() => {
      const grid = getGrid()
      if (!grid) return
      const els = gridContainer.value?.querySelectorAll('.grid-stack-item') ?? []
      els.forEach((el) => grid.refreshDragHandles(el))
    })
  })
})

onUnmounted(() => {
  saveToStorage()
})

// 10. Functions (named parameters pattern)
function getGrid(): any {
  const el = gridContainer.value?.querySelector('.grid-stack')
  return (el as any)?.gridstack
}

function getGridNode(params: { grid: any; id: string }): GridStackNode | undefined {
  const nodes: GridStackNode[] = params.grid?.engine?.nodes ?? []
  return nodes.find((n) => n.id === params.id)
}

function getWidgetLimit(params: {
  widgetId: string
  prop: 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight'
  fallback: number
}): number {
  const def = availableWidgets.value.find((w) => w.id === params.widgetId)
  return def?.[params.prop]?.[breakpoint.value] ?? params.fallback
}

function syncGridWithStore(params: { widgets: typeof activeWidgets.value }): void {
  const grid = getGrid()
  if (!grid) return

  const bp = breakpoint.value
  const visible = params.widgets.filter((w) => w.isVisible)

  const gridNodes: GridStackNode[] = grid.engine?.nodes ?? []
  const byId = new Map<string, GridStackNode>()
  gridNodes.forEach((n) => {
    if (n.id != null) byId.set(String(n.id), n)
  })
  const wantedIds = new Set(visible.map((w) => w.id))

  function buildAddConfig(params: { widget: (typeof activeWidgets.value)[number] }) {
    const w = params.widget
    return {
      id: w.id,
      x: w.x[bp],
      y: w.y[bp],
      w: w.w[bp],
      h: w.h[bp],
      component: 'WidgetWrapper',
      props: {
        widgetId: w.widgetId,
        instanceId: w.id,
      },
      minW: getWidgetLimit({ widgetId: w.widgetId, prop: 'minWidth', fallback: 1 }),
      minH: getWidgetLimit({ widgetId: w.widgetId, prop: 'minHeight', fallback: 1 }),
      maxW: getWidgetLimit({ widgetId: w.widgetId, prop: 'maxWidth', fallback: 12 }),
      maxH: getWidgetLimit({ widgetId: w.widgetId, prop: 'maxHeight', fallback: 12 }),
    }
  }

  // 1. Add widgets present in the store but missing in the grid.
  visible.forEach((w) => {
    if (byId.has(w.id)) return
    grid.addWidget(buildAddConfig({ widget: w }))
  })

  // 2. Remove grid nodes that are no longer visible/present in the store.
  //    `triggerEvent: false` avoids re-firing `removed` (no store mutation
  //    loop during reconciliation) and protects already-added siblings.
  gridNodes.forEach((n) => {
    if (n.id == null) return
    const id = String(n.id)
    if (wantedIds.has(id)) return
    grid.removeWidget(n, true, false)
  })

  // 3. Align geometry of existing nodes with the store (idempotent no-op
  //    when coordinates didn't change, so idle re-syncs don't move widgets).
  visible.forEach((w) => {
    const node = byId.get(w.id)
    if (!node) return
    grid.update(node, {
      x: w.x[bp] ?? 0,
      y: w.y[bp] ?? 0,
      w: w.w[bp] ?? 4,
      h: w.h[bp] ?? 4,
    })
  })
}

function updateGridForBreakpoint(params: { breakpoint: Breakpoint }): void {
  const grid = getGrid()
  if (!grid) return

  const bp = params.breakpoint

  activeWidgets.value
    .filter((w) => w.isVisible)
    .forEach((w) => {
      const node = getGridNode({ grid, id: w.id })
      if (!node) return

      grid.update(node, {
        x: w.x[bp] ?? 0,
        y: w.y[bp] ?? 0,
        w: w.w[bp] ?? 4,
        h: w.h[bp] ?? 4,
      })
    })
}

function persistLiveLayout(): void {
  const bp = breakpoint.value
  const grid = getGrid()
  const nodes: GridStackNode[] = grid?.engine?.nodes ?? []
  const items: Array<{ instanceId: string; x: number; y: number; w: number; h: number }> = []

  nodes.forEach((n) => {
    const instanceId = (n.el as HTMLElement | undefined)?.getAttribute('gs-id')
    if (!instanceId) return
    items.push({
      instanceId,
      x: n.x ?? 0,
      y: n.y ?? 0,
      w: n.w ?? 4,
      h: n.h ?? 4,
    })
  })

  updateWidgetLayout({ items, breakpoint: bp })

  const instanceIds = [...nodes]
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))
    .map((n) => (n.el as HTMLElement | undefined)?.getAttribute('gs-id'))
    .filter((id): id is string => !!id)
  setOrderForLayout({ instanceIds })

  emit('layout-change')
}

function onGridChange(params: { nodes: GridStackNode | GridStackNode[] }): void {
  // change fires on every move; persist immediately.
  persistLiveLayout()
}
function onWidgetAdded(params: { nodes: GridStackNode | GridStackNode[] }): void {
  const array = Array.isArray(params.nodes) ? params.nodes : [params.nodes]
  const grid = getGrid()

  array.forEach((node) => {
    // GridStack can't discover drag handles inside dynamically-rendered Vue
    // content; rescan after each widget is added.
    const el = (node as any).el
    if (grid && el) {
      grid.refreshDragHandles(el)
    }
  })

  persistLiveLayout()
}

function onWidgetRemoved(params: { nodes: GridStackNode | GridStackNode[] }): void {
  const array = Array.isArray(params.nodes) ? params.nodes : [params.nodes]
  array.forEach((node) => {
    if (node.id) removeWidget({ instanceId: node.id })
  })
  emit('layout-change')
}

function onResizeStop(params: { el: unknown }): void {
  persistLiveLayout()
}

function onDragStop(params: { el: unknown }): void {
  persistLiveLayout()
}
</script>

<style scoped>
.widget-grid-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.widget-grid-container :deep(.grid-stack) {
  height: 100%;
}

.widget-grid-container :deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>