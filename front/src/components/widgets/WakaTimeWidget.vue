<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div class="wakatime-widget">
    <div v-if="!apiKey" class="wakatime-setup">
      <ion-icon :icon="timerOutline" class="wakatime-icon"></ion-icon>
      <p class="wakatime-text">Conecta WakaTime</p>
      <ion-button fill="outline" size="small" @click="openApiKeyModal">
        Configurar API Key
      </ion-button>
    </div>

    <div v-else class="wakatime-content">
      <WakaTimeToday ref="todayRef" :api-key="apiKey" />

      <div class="wakatime-stats">
        <div class="stat-item">
          <span class="stat-label">Esta semana</span>
          <span class="stat-value">{{ weekTime }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Este mes</span>
          <span class="stat-value">{{ monthTime }}</span>
        </div>
      </div>

      <div class="wakatime-actions">
        <ion-button fill="clear" size="small" @click="refreshToday">
          <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
          Actualizar
        </ion-button>
        <ion-button fill="clear" size="small" color="danger" @click="logoutWakaTime">
          <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
          Desconectar
        </ion-button>
      </div>
    </div>

    <!-- modal api key -->
    <ion-modal
      class="wakatime-modal"
      :is-open="isOpenApiKeyModal"
      @did-dismiss="onApiKeyModalDismiss()"
    >
      <ApiKeyComponent />
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonButton, IonIcon, IonModal } from '@ionic/vue'
import { onMounted, ref } from 'vue'
import { timerOutline, refreshOutline, logOutOutline } from 'ionicons/icons'

// 2. Controllers / Composables
import { WakaTimeController } from '@/controllers/wakaTimeController'
const wakaTimeController = new WakaTimeController()

// 3. Components
import WakaTimeToday from '@/components/wakatime/today/WakaTimeToday.vue'
import ApiKeyComponent from '@/components/wakatime/ApiKeyComponent.vue'

// 4. Interface and types imports

// 5. Main (props, emits, etc.)

// 6. Vars and const
const apiKey = ref<string>('')
const weekTime = ref('0 hrs 0 mins')
const monthTime = ref('0 hrs 0 mins')
const todayRef = ref<InstanceType<typeof WakaTimeToday> | null>(null)
const isOpenApiKeyModal = ref(false)

// 7. Watch

// 8. Computed

// 9. OnMounted
onMounted(async () => {
  await wakaTimeController.loadApiKey()
  loadApiKey()
  fetchStats()
})

// 10. Functions
function loadApiKey(): void {
  apiKey.value = wakaTimeController.getApiKey() || ''
}

async function fetchStats(): Promise<void> {
  if (!apiKey.value) return

  try {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [weekRes, monthRes] = await Promise.all([
      wakaTimeController.fetchDurations({
        date: weekStart.toISOString().split('T')[0],
        apiKey: apiKey.value,
      }) as Promise<number>,
      wakaTimeController.fetchDurations({
        date: monthStart.toISOString().split('T')[0],
        apiKey: apiKey.value,
      }) as Promise<number>,
    ])

    weekTime.value = formatDuration({ seconds: weekRes as number })
    monthTime.value = formatDuration({ seconds: monthRes as number })
  } catch (error) {
    console.error('Error fetching WakaTime stats:', error)
  }
}

function formatDuration(params: { seconds: number }): string {
  const seconds = params.seconds
  const horas = Math.floor(seconds / 3600)
  const minutos = Math.floor((seconds % 3600) / 60)
  return `${horas} hrs ${minutos} mins`
}

function openApiKeyModal(): void {
  isOpenApiKeyModal.value = true
}

async function onApiKeyModalDismiss(): Promise<void> {
  isOpenApiKeyModal.value = false
  await wakaTimeController.loadApiKey()
  loadApiKey()
  fetchStats()
}

function refreshToday(): void {
  todayRef.value?.refresh()
  fetchStats()
}

async function logoutWakaTime(): Promise<void> {
  await wakaTimeController.clearApiKey()
  apiKey.value = ''
  weekTime.value = '0 hrs 0 mins'
  monthTime.value = '0 hrs 0 mins'
}
</script>

<style scoped>
.wakatime-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
}

.wakatime-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  padding: 24px;
  color: var(--ion-color-medium, #999);
}

.wakatime-icon {
  font-size: 48px;
  color: var(--ion-color-primary, #3880ff);
}

.wakatime-text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.wakatime-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wakatime-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: var(--ion-background-color, #fafafa);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--ion-color-medium, #999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color, #333);
}

.wakatime-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid var(--ion-border-color, #e0e0e0);
}
</style>