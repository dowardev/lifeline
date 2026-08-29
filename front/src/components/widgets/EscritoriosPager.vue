<template>
  <div class="escritorios-pager">
    <template v-if="activeWidgets.length > 0">
      <div class="escritorios-header" v-if="escritorios.length > 1">
        <ion-button fill="clear" class="nav-arrow" @click="prev" :disabled="activeIndex === 0">
          <ion-icon :icon="chevronBackOutline" />
        </ion-button>
        <ion-button fill="clear" class="escritorio-trigger" @click="popoverOpen = true">
          {{ activeIndex + 1 }} / {{ escritorios.length }}
        </ion-button>
        <ion-button
          fill="clear"
          class="nav-arrow"
          @click="next"
          :disabled="activeIndex === escritorios.length - 1"
        >
          <ion-icon :icon="chevronForwardOutline" />
        </ion-button>
      </div>

      <div
        class="escritorios-track"
        ref="trackRef"
        @scroll.passive="onScroll"
      >
        <section
          v-for="(esc, i) in escritorios"
          :key="i"
          class="escritorio-page"
        >
          <WidgetGrid :widgets="esc" :escritorio-index="i" :escritorio-count="escritorios.length" :mobile="isMobile" @layout-change="onLayoutChange" />
        </section>
      </div>

      <div class="escritorios-dots" v-if="escritorios.length > 1">
        <span
          v-for="(esc, i) in escritorios"
          :key="'dot-' + i"
          class="dot"
          :class="{ active: i === activeIndex }"
          @click="goTo(i)"
        ></span>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>No hay widgets todavía. Agregá uno desde el botón +.</p>
    </div>

    <ion-popover
      :is-open="popoverOpen"
      @did-dismiss="popoverOpen = false"
    >
      <ion-content>
        <ion-list>
          <ion-item
            button
            :detail="false"
            v-for="(esc, i) in escritorios"
            :key="'pop-' + i"
            @click="selectEscritorio(i)"
          >
            <ion-label>Escritorio {{ i + 1 }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>
  </div>
</template>

<script lang="ts" setup>
// 1. Imports
import { ref, computed, onMounted, onUnmounted, provide, watch } from 'vue'
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
} from '@ionic/vue'
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons'
import WidgetGrid from '@/components/widgets/WidgetGrid.vue'
import { showToast } from '@/utils/toast'
import { packIntoEscritorios, canFitInEscritorio } from '@/store/widgetStore'
import { useWidgets } from '@/composables/useWidgets'

// 2. Controllers / Composables
const { activeWidgets, currentBreakpoint, assignWidgetEscritorio } = useWidgets()
provide('requestMove', requestMove)

// 3. Components
// (WidgetGrid imported in section 1)

// 4. Interface and types imports
import type { WidgetInstance } from '@/store/widgetStore'

// 5. Main (props, emits, etc.)
const emit = defineEmits<{ 'layout-change': [] }>()

// 6. Vars and const
const trackRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const popoverOpen = ref(false)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const CELL_HEIGHT = 70
const HEADER_OFFSET = 180
const MOBILE_BREAKPOINT = 768

// 7. Watch
// Keep the active page in range when the number of escritorios shrinks
// (delete / move can reduce the page count and leave activeIndex out of bounds).
watch(
  () => escritorios.value.length,
  (len) => {
    if (activeIndex.value > len - 1) {
      activeIndex.value = Math.max(0, len - 1)
    }
  },
)

// 8. Computed
const rowsPerEscritorio = computed(() =>
  Math.max(1, Math.floor((viewportHeight.value - HEADER_OFFSET) / CELL_HEIGHT)),
)

// Mobile breakpoint: each escritorio holds a single widget (matches the mobile WidgetStack).
const isMobile = computed(() => viewportWidth.value < MOBILE_BREAKPOINT)

// Capacity-aware packing: widgets are grouped into "escritorios" (screens).
// Desktop/tablet packs by actual size; when a widget does not fit the remaining
// space of the current escritorio it is sent to the next one. Mobile = 1 widget
// per escritorio (matches the mobile WidgetStack behaviour).
const escritorios = computed<WidgetInstance[][]>(() => {
  const widgets = [...activeWidgets.value].sort((a, b) => a.order - b.order)
  return packIntoEscritorios({
    widgets,
    breakpoint: currentBreakpoint.value,
    rowsPerEscritorio: rowsPerEscritorio.value,
    mobileOnePerPage: isMobile.value,
  })
})

// 9. OnMounted
onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

// 10. Functions
function onResize() {
  viewportHeight.value = window.innerHeight
  viewportWidth.value = window.innerWidth
}

function onScroll() {
  const el = trackRef.value
  if (!el) return
  const pageWidth = el.clientWidth
  if (pageWidth <= 0) return
  const idx = Math.round(el.scrollLeft / pageWidth)
  activeIndex.value = Math.min(Math.max(idx, 0), escritorios.value.length - 1)
}

function goTo(index: number) {
  const el = trackRef.value
  if (!el) return
  el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  activeIndex.value = index
}

function prev() {
  goTo(Math.max(0, activeIndex.value - 1))
}

function next() {
  goTo(Math.min(escritorios.value.length - 1, activeIndex.value + 1))
}

function selectEscritorio(index: number) {
  goTo(index)
  popoverOpen.value = false
}

function onLayoutChange() {
  emit('layout-change')
}

// Move a widget to another escritorio, verifying capacity first.
function requestMove(instanceId: string, targetIndex: number): void {
  const widget = activeWidgets.value.find((w) => w.id === instanceId)
  if (!widget) return
  const current = escritorios.value.findIndex((e) => e.some((w) => w.id === instanceId))
  if (current === targetIndex) return
  const fits = canFitInEscritorio({
    widget,
    targetIndex,
    escritorios: escritorios.value,
    breakpoint: currentBreakpoint.value,
    rowsPerEscritorio: rowsPerEscritorio.value,
    mobileOnePerPage: isMobile.value,
  })
  if (!fits) {
    void showToast({
      message: `No hay espacio suficiente en el escritorio ${targetIndex + 1}`,
      duration: 2000,
    })
    return
  }
  assignWidgetEscritorio({ instanceId, targetIndex })
}
</script>

<style scoped>
.escritorios-pager {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.escritorios-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 0;
  flex: 0 0 auto;
}

.escritorio-trigger {
  --padding-start: 12px;
  --padding-end: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.nav-arrow {
  --padding-start: 8px;
  --padding-end: 8px;
}

.escritorios-track {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.escritorios-track::-webkit-scrollbar {
  display: none;
}

.escritorio-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.escritorios-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  flex: 0 0 auto;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ion-color-medium, #92949c);
  opacity: 0.5;
  cursor: pointer;
}

.dot.active {
  background: var(--ion-color-primary, #3880ff);
  opacity: 1;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 0 24px;
  color: var(--ion-color-medium, #92949c);
}
</style>
