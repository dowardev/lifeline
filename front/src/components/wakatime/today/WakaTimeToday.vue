<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-item lines="none" class="transparent">
    <ion-label class="ion-text-wrap">Tiempo invertido hoy</ion-label>

    <ion-label slot="end">{{
      convertSeconds({ seconds: todayTime })
    }}</ion-label>
  </ion-item>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonItem, IonLabel } from "@ionic/vue";
import { onMounted, ref } from "vue";

// 2. Controllers / Composables
import { WakaTimeController } from "@/controllers/wakaTimeController";
const wakaTimeController = new WakaTimeController();

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
const props = defineProps({
  apiKey: { default: "", type: String, required: true },
});

// 6. Vars and const
const todayTime = ref(0);

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
onMounted(() => {
  getWakaTimeToday({ apiKey: props.apiKey });
});

// 10. Functions (named parameters pattern)
async function getWakaTimeToday(params: { apiKey: string }): Promise<void> {
  const { apiKey } = params;
  const date = getTodayDate();
  const response = await wakaTimeController.fetchDurations({ date, apiKey });
  todayTime.value = response;
}

function getTodayDate(): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

function convertSeconds(params: { seconds: number }): string {
  const { seconds } = params;
  const horas = Math.floor(seconds / 3600);
  const minutos = Math.floor((seconds % 3600) / 60);

  const formato = `${horas} hrs ${minutos} mins`;
  return formato;
}

function refresh(): void {
  getWakaTimeToday({ apiKey: props.apiKey });
}

async function logout(): Promise<void> {
  await wakaTimeController.clearApiKey();
}

defineExpose({
  refresh,
  logout,
});
</script>
