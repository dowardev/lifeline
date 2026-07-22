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
// 1. Imports (ionic/vue/ionicons)
import { IonButton, IonIcon, IonInput, IonSpinner } from "@ionic/vue";
import { reactive, ref } from "vue";
import { saveOutline } from "ionicons/icons";

// 2. Controllers / Composables
import { WakaTimeController } from "@/controllers/wakaTimeController";
const wakaTimeController = new WakaTimeController();

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const inputApiKeyValue = ref("");
const spinners = reactive({ testApiKey: false });

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
async function testWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
  const { apiKey } = params;
  spinners.testApiKey = true;

  try {
    const date = getTodayDate();
    const response = await wakaTimeController.testWakaTimeApiKey({
      apiKey,
      date,
    });
    if (response) {
      await storeWakaTimeApiKey({ apiKey });
      wakaTimeController.loadApiKey();
    }
  } catch (error) {
    console.error(error);
  } finally {
    spinners.testApiKey = false;
  }
}

async function storeWakaTimeApiKey(params: { apiKey: string }): Promise<void> {
  const { apiKey } = params;
  await wakaTimeController.saveApiKey({ key: apiKey });
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
