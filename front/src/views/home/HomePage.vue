<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button fill="clear" @click="openWidgetPicker()">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12">
                <div class="widget-grid-section">
                  <ScreensPager @layout-change="onLayoutChange" />
                </div>
              </ion-col>
        </ion-row>
      </ion-grid>

      <!-- popovers -->
      <!-- end popovers -->

      <!-- alerts -->
      <!-- end alerts -->

    </ion-content>

    <!-- modals -->
      <!-- widget picker modal -->
      <ion-modal
        :is-open="showWidgetPicker"
        @did-dismiss="showWidgetPicker = false"
      >
        <ion-page>
          <ion-header mode="ios" class="ion-no-border">
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button fill="clear" @click="showWidgetPicker = false">
                  <ion-icon :icon="closeOutline"></ion-icon>
                </ion-button>
              </ion-buttons>

              <ion-title>Añadir widget</ion-title>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding">
            <ion-list>
              <ion-list-header>
                <ion-label>Widgets disponibles</ion-label>
              </ion-list-header>

              <ion-item
                v-for="widget in availableWidgets"
                :key="widget.id"
                button
                lines="full"
                :disabled="isWidgetAdded({ widgetId: widget.id })"
                @click="addWidget({ widgetId: widget.id })"
              >
                <ion-icon slot="start" :icon="getWidgetIcon({ id: widget.id })"></ion-icon>
                <ion-label>
                  <h3>{{ widget.name }}</h3>
                  <p>{{ widget.description }}</p>
                </ion-label>
                <ion-icon
                  v-if="isWidgetAdded({ widgetId: widget.id })"
                  slot="end"
                  :icon="checkmarkOutline"
                  color="medium"
                ></ion-icon>
              </ion-item>
            </ion-list>
          </ion-content>
        </ion-page>
      </ion-modal>
      <!-- end widget picker modal -->
      <!-- end modals -->
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonModal,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  addOutline,
  checkmarkOutline,
  calendarOutline,
  closeOutline,
  gridOutline,
  timerOutline,
} from 'ionicons/icons'

// 2. Controllers / Composables
import { useWidgets } from '@/composables/useWidgets'
const {
  availableWidgets,
  activeWidgets,
  addWidget: addWidgetToLayout,
  setBreakpoint,
  loadFromStorage,
  initializeDefaultLayout,
} = useWidgets()

// 3. Components
import ScreensPager from '@/components/widgets/ScreensPager.vue'

// 4. Interface and types imports

// 5. Main (props, emits, etc.)

// 6. Vars and const
const pageTitle = 'Inicio'
const showWidgetPicker = ref(false)

// 7. Watch

// 8. Computed
// availableWidgets and activeWidgets come from the composable
const addedWidgetIds = computed<Set<string>>(() => new Set(activeWidgets.value.map((w) => w.widgetId)))

// 9. OnMounted
onMounted(() => {
  // Seed default widgets ONLY when there is no previously saved layout.
  // A saved layout may legitimately be empty (the user removed every widget);
  // re-seeding it on reload would resurrect the default widgets and undo the
  // deletions (LBDS-201 regression: removed widgets came back after reload).
  const hadSavedLayout = loadFromStorage()
  if (!hadSavedLayout) {
    initializeDefaultLayout()
  }

  updateBreakpoint()

  window.addEventListener('resize', updateBreakpoint)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateBreakpoint)
})

// 10. Functions (named parameters pattern)
function updateBreakpoint(): void {
  const width = window.innerWidth
  const bp = width < 992 ? 'md' : 'lg'
  setBreakpoint({ breakpoint: bp })
}

function getWidgetIcon(params: { id: string }): string {
  switch (params.id) {
    case 'calendar':
      return calendarOutline
    case 'wakatime':
      return timerOutline
    default:
      return gridOutline
  }
}

function addWidget(params: { widgetId: string }): void {
  addWidgetToLayout({ widgetId: params.widgetId })
  showWidgetPicker.value = false
}

function isWidgetAdded(params: { widgetId: string }): boolean {
  return addedWidgetIds.value.has(params.widgetId)
}

function openWidgetPicker(): void {
  showWidgetPicker.value = true
}

function onLayoutChange(): void {
  // Layout changed, store already saved by WidgetGrid
}

</script>

<style scoped>
.widget-grid-section {
  height: calc(100vh - 140px);
  min-height: 600px;
  /* Desktop/tablet: the widget grid must fit the screen with NO vertical scroll.
     Clip any overflow instead of letting the page scroll (like the mobile WidgetStack). */
  overflow: hidden;
}

</style>