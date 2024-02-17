<template>
  <ion-item lines="none">
    <ion-label class="ion-text-wrap">Tiempo invertido hoy</ion-label>

    <ion-label slot="end">{{
      convertSeconds({ seconds: todayTime })
    }}</ion-label>
  </ion-item>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

// controllers
import { SystemController } from "@/controllers/systemController";
const systemController = new SystemController();

const props = defineProps({
  apiKey: { default: "", type: String, required: true },
});

const todayTime = ref(0);

onMounted(() => {
  getWakaTimeToday({ apiKey: props.apiKey });
});

//  functions
async function getWakaTimeToday(params: { apiKey: string }): Promise<void> {
  const { apiKey } = params;
  const date = getTodayDate();
  const response = await systemController.getWakaTimeDayTotal({ apiKey, date });
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
  await systemController.clearWakaTimeApiKey();
}

defineExpose({
  refresh,
  logout,
});
</script>
