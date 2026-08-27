<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div class="widget-stack">
    <div
      ref="trackRef"
      class="widget-stack-track"
      @scroll="onTrackScroll({ event: $event })"
    >
      <section
        v-for="(widget, index) in widgets"
        :key="widget.id"
        class="widget-stack-page"
        :data-page-index="index"
        :aria-label="`Página ${index + 1} de ${widgets.length}: ${getWidgetName({ widgetId: widget.widgetId })}`"
      >
        <ion-card class="widget-stack-card">
          <ion-card-header class="widget-stack-header">
            <ion-card-title class="widget-stack-title">
              {{ getWidgetName({ widgetId: widget.widgetId }) }}
            </ion-card-title>

            <ion-button
              fill="clear"
              size="small"
              @click="toggleVisibility({ instanceId: widget.id })"
            >
              <ion-icon
                slot="icon-only"
                :icon="widget.isVisible ? eyeOutline : eyeOffOutline"
                :color="widget.isVisible ? 'primary' : 'medium'"
              ></ion-icon>
            </ion-button>
          </ion-card-header>

          <ion-card-content class="widget-stack-content">
            <component :is="getWidgetComponent({ widgetId: widget.widgetId })" />
          </ion-card-content>
        </ion-card>
      </section>

      <div v-if="widgets.length === 0" class="empty-state">
        <ion-icon :icon="gridOutline" class="empty-icon"></ion-icon>
        <p>No hay widgets añadidos</p>
        <ion-button fill="outline" size="small" @click="emptyStateAction()">
          Añadir widgets por defecto
        </ion-button>
      </div>
    </div>

    <div
      v-if="widgets.length > 1"
      class="widget-stack-dots"
      role="tablist"
      aria-label="Indicador de página"
    >
      <button
        v-for="(widget, index) in widgets"
        :key="`dot-${widget.id}`"
        type="button"
        class="widget-stack-dot"
        :class="{ 'is-active': index === currentPage }"
        :aria-label="`Ir a la página ${index + 1}`"
        :aria-selected="index === currentPage"
        role="tab"
        @click="goToPage({ index })"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { eyeOutline, eyeOffOutline, gridOutline } from 'ionicons/icons'

// 2. Controllers / Composables
import { useWidgets } from '@/composables/useWidgets'
const {
  activeWidgets,
  getWidgetName,
  toggleVisibility,
  initializeDefaultLayout,
  showAllWidgets,
} = useWidgets()

// 3. Components
import CalendarWidget from './CalendarWidget.vue'
import WakaTimeWidget from './WakaTimeWidget.vue'

// 4. Interface and types imports

// 5. Main (props, emits, etc.)

// 6. Vars and const
const trackRef = ref<HTMLElement | null>(null)
const currentPage = ref(0)

// 7. Watch
watch(activeWidgets, () => {
  const visibleCount = activeWidgets.value.filter((w) => w.isVisible).length
  const maxIndex = Math.max(0, visibleCount - 1)
  if (currentPage.value > maxIndex) {
    currentPage.value = maxIndex
    const track = trackRef.value
    if (track) {
      track.scrollLeft = currentPage.value * track.clientWidth
    }
  }
})

// 8. Computed
const widgets = computed(() =>
  [...activeWidgets.value]
    .filter((w) => w.isVisible)
    .sort((a, b) => a.order - b.order),
)

// 9. OnMounted
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

// 10. Functions (named parameters pattern)
function getWidgetComponent(params: { widgetId: string }) {
  switch (params.widgetId) {
    case 'calendar':
      return CalendarWidget
    case 'wakatime':
      return WakaTimeWidget
    default:
      return { template: '<div class="widget-not-found">Widget no encontrado</div>' }
  }
}

function emptyStateAction(): void {
  if (activeWidgets.value.length === 0) {
    initializeDefaultLayout()
  } else {
    showAllWidgets({})
  }
}

function onTrackScroll(params: { event: Event }): void {
  const event = params.event
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const page = Math.round(target.scrollLeft / target.clientWidth)
  if (page !== currentPage.value) {
    currentPage.value = page
  }
}

function goToPage(params: { index: number }): void {
  const index = params.index
  const track = trackRef.value
  if (!track) return
  track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
}

function handleResize(): void {
  const track = trackRef.value
  if (!track) return
  // Snap to the nearest page on resize so the current widget stays in view
  const page = currentPage.value
  track.scrollLeft = page * track.clientWidth
}
</script>

<style scoped>
.widget-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.widget-stack-track {
  display: flex;
  flex-direction: row;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  /* Prevent vertical bounce interfering with horizontal snap */
  overscroll-behavior-x: contain;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
}

.widget-stack-track::-webkit-scrollbar {
  display: none;
}

.widget-stack-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  min-height: 0;
  scroll-snap-align: start;
  box-sizing: border-box;
}

.widget-stack-card {
  margin: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-stack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  flex-shrink: 0;
}

.widget-stack-title {
  font-size: 16px;
  font-weight: 600;
}

.widget-stack-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.widget-stack-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 0 4px;
}

.widget-stack-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  padding: 0;
  flex: 0 0 auto;
  background: var(--ion-color-medium);
  opacity: 0.4;
  cursor: pointer;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, opacity 0.3s ease;
  /* Larger tap target */
  position: relative;
}

.widget-stack-dot::before {
  content: '';
  position: absolute;
  inset: -8px;
}

.widget-stack-dot.is-active {
  width: 24px;
  opacity: 1;
  background: var(--ion-color-primary);
}

.empty-state {
  flex: 0 0 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 48px;
}
</style>
