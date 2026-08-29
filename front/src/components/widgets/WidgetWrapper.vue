<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div class="widget-wrapper">
    <div class="widget-header" v-if="showHeader">
      <div class="widget-title">{{ widgetName }}</div>

      <div class="widget-actions">
        <button
          class="widget-drag-handle"
          title="Arrastrar"
          aria-label="Arrastrar widget"
        >
          <ion-icon :icon="reorderTwoOutline"></ion-icon>
        </button>

        <ion-button
          v-if="(props.escritorioCount ?? 1) > 1"
          class="widget-action-btn"
          fill="clear"
          size="small"
          title="Mover de escritorio"
          aria-label="Mover widget de escritorio"
          @click="onMove()"
        >
          <ion-icon slot="icon-only" :icon="swapHorizontalOutline"></ion-icon>
        </ion-button>

        <ion-button
          class="widget-action-btn"
          fill="clear"
          size="small"
          title="Eliminar"
          aria-label="Eliminar widget"
          @click="onRemove()"
        >
          <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
        </ion-button>
      </div>
    </div>

    <div class="widget-content">
      <component :is="widgetComponent" />
    </div>

    <ion-popover :is-open="popoverOpen" @did-dismiss="popoverOpen = false">
      <ion-content>
        <ion-list>
          <ion-item
            button
            :detail="false"
            v-for="n in (props.escritorioCount ?? 1)"
            :key="n"
            @click="moveTo(n - 1)"
          >
            <ion-label>
              Escritorio {{ n }}<span v-if="(n - 1) === props.escritorioIndex"> (actual)</span>
            </ion-label>
          </ion-item>
          <ion-item button :detail="false" @click="moveTo(props.escritorioCount ?? 1)">
            <ion-label>Nuevo escritorio</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonButton, IonIcon, IonPopover, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue'
import { computed, onMounted, ref, inject } from 'vue'
import { reorderTwoOutline, trashOutline, swapHorizontalOutline } from 'ionicons/icons'

// 2. Controllers / Composables
import { useWidgets } from '@/composables/useWidgets'
import { useGridStack, useGridStackItem } from 'gridstack/dist/vue'
const { availableWidgets, removeWidget } = useWidgets()
const { grid } = useGridStack()
const { node } = useGridStackItem()

// 3. Components
import CalendarWidget from './CalendarWidget.vue'
import WakaTimeWidget from './WakaTimeWidget.vue'

// 4. Interface and types imports

// 5. Main (props, emits, etc.)
const props = defineProps<{
  widgetId: string
  instanceId: string
  escritorioIndex?: number
  escritorioCount?: number
}>()

// 6. Vars and const
const showHeader = true
const popoverOpen = ref(false)
const requestMove = inject<(instanceId: string, targetIndex: number) => void>('requestMove')

// 7. Watch

// 8. Computed
const widgetName = computed(() => {
  const def = availableWidgets.value.find((w) => w.id === props.widgetId)
  return def?.name ?? 'Widget'
})

const widgetComponent = computed(() => {
  switch (props.widgetId) {
    case 'calendar':
      return CalendarWidget
    case 'wakatime':
      return WakaTimeWidget
    default:
      return { template: '<div>Widget no encontrado</div>' }
  }
})

// 9. OnMounted
onMounted(() => {
  if (node) {
    ;(node as any)._widgetWrapper = { instanceId: props.instanceId }
  }

  // The Vue wrapper teleports our content into .grid-stack-item-content
  // after the widget is added. By the time this onMounted fires, the
  // .widget-drag-handle button exists in the DOM, so rescan the node now.
  if (grid && node?.el) {
    grid.refreshDragHandles(node.el)
  }
})

// 10. Functions (named parameters pattern)
function onRemove(): void {
  removeWidget({ instanceId: props.instanceId })
}

function onMove(): void {
  popoverOpen.value = true
}

function moveTo(targetIndex: number): void {
  popoverOpen.value = false
  requestMove?.(props.instanceId, targetIndex)
}
</script>

<style scoped>
.widget-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--ion-background-color, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--ion-border-color, #e0e0e0);
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--ion-background-color, #fafafa);
  border-bottom: 1px solid var(--ion-border-color, #e0e0e0);
  flex-shrink: 0;
  cursor: grab;
}

.widget-header:active {
  cursor: grabbing;
}

.widget-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--ion-text-color, #333);
}

.widget-actions {
  display: flex;
  gap: 4px;
}

.widget-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--ion-color-medium, #999);
  cursor: grab;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.widget-drag-handle:hover {
  background: var(--ion-hover-background, #f0f0f0);
  color: var(--ion-text-color, #333);
}

.widget-drag-handle:active {
  cursor: grabbing;
}

.widget-action-btn {
      color: var(--ion-color-medium, #999);
      cursor: pointer;
    }

    .widget-action-btn:hover {
      color: var(--ion-color-danger, #eb445a);
    }

.widget-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
</style>