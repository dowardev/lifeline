<template>
  <div style="display: flex">
    <div style="padding-right: 16px">
      <ion-input
        label="Api key"
        fill="outline"
        label-placement="floating"
        :value="inputApiKeyValue"
        @ion-input="inputApiKeyValue = $event.detail.value as string"
      ></ion-input>
    </div>

    <div class="center-vertical">
      <ion-button
        :disabled="inputApiKeyValue == ''"
        @click="testWakaTimeApiKey({ apiKey: inputApiKeyValue })"
        ><ion-icon
          v-if="spinners.testApiKey == false"
          :icon="saveOutline"
        ></ion-icon
        ><ion-spinner v-if="spinners.testApiKey" name="crescent"></ion-spinner
      ></ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonInput, IonButton } from "@ionic/vue";
import { reactive, ref } from "vue";
import { saveOutline } from "ionicons/icons";

// controllers
import { SystemController } from "@/controllers/systemController";
const systemController = new SystemController();

const inputApiKeyValue = ref("");
const spinners = reactive({ testApiKey: false });

// functions
async function testWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
  const { apiKey } = params;
  spinners.testApiKey = true;

  try {
    const date = getTodayDate();
    const response = await systemController.testWakaTimeApiKey({
      apiKey,
      date,
    });
    if (response) {
      await storeWakaTimeApiKey({ apiKey });
      systemController.loadWakaTimeApiKey();
    }
  } catch (error) {
    console.error(error);
  } finally {
    spinners.testApiKey = false;
  }
}

async function storeWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
  const { apiKey } = params;
  await systemController.storeWakaTimeApiKey({ apiKey });
}

function getTodayDate(): string {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}
</script>
