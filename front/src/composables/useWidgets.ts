// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { computed } from 'vue'
import { useWidgetStore } from '@/store/widgetStore'
import type { Breakpoint, WidgetDefinition, WidgetInstance } from '@/store/widgetStore'

/**
 * Composable bridge between Vue components and the widget Pinia store.
 * Components must not access the store directly.
 */
export function useWidgets() {
  const store = useWidgetStore()

  const availableWidgets = computed<WidgetDefinition[]>(() => store.availableWidgets)
  const activeWidgets = computed<WidgetInstance[]>(() => store.activeWidgets)
  const currentBreakpoint = computed<Breakpoint>(() => store.currentBreakpoint)

  function getWidgetName(params: { widgetId: string }): string {
    return store.availableWidgets.find((w) => w.id === params.widgetId)?.name ?? 'Widget'
  }

  function addWidget(params: { widgetId: string }): WidgetInstance | null {
    return store.addWidget({ widgetId: params.widgetId })
  }

  function removeWidget(params: { instanceId: string }): void {
    store.removeWidget({ instanceId: params.instanceId })
  }

    function setBreakpoint(params: { breakpoint: Breakpoint }): void {
    store.setBreakpoint({ breakpoint: params.breakpoint })
  }

  return {
    availableWidgets,
    activeWidgets,
    currentBreakpoint,
    getWidgetName,
    addWidget,
    removeWidget,    setBreakpoint,
    loadFromStorage: store.loadFromStorage,
    saveToStorage: store.saveToStorage,
    initializeDefaultLayout: store.initializeDefaultLayout,
    resetToDefault: store.resetToDefault,
    updateWidgetPosition: store.updateWidgetPosition,
    updateWidgetLayout: store.updateWidgetLayout,
    updateWidgetProps: store.updateWidgetProps,
    setOrderForLayout: store.setOrderForLayout,  }
}