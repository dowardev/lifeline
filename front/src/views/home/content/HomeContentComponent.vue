<template>
  <ion-row>
    <!-- calendar -->
    <ion-col size-xs="12" size-md="6" size-lg="4">
      <ion-card
        style="margin: 0"
        v-if="calendarController.getCalendarDataStatus() == 'success'"
        class="element-selected"
      >
        <CalendarComponent />
      </ion-card>
    </ion-col>

    <!-- wakatime -->
    <ion-col size-xs="12" size-md="6" size-lg="4">
      <ion-card class="element-selected" style="margin: 0">
        <ion-card-header>
          <div style="display: flex; justify-content: space-between">
            <div class="center-vertical">
              <ion-card-title>Wakatime</ion-card-title>
            </div>

            <div>
              <ion-button
                fill="clear"
                size="small"
                @click="refreshTodayComponent()"
                ><ion-icon :icon="refreshOutline"></ion-icon
              ></ion-button>

              <ion-button fill="clear" size="small" @click="logoutWakaTime()"
                ><ion-icon :icon="logOutOutline"></ion-icon
              ></ion-button>
            </div>
          </div>
        </ion-card-header>

        <div>
          <!-- input api key -->
          <div v-if="!systemController.getWakaTimeApiKey()" class="ion-padding">
            <WakaTimeApiKeyComponent />
          </div>
          <div v-if="systemController.getWakaTimeApiKey()">
            <WakaTimeToday
              ref="todayComponentRef"
              :api-key="systemController.getWakaTimeApiKey()"
            />
          </div>
        </div>
      </ion-card>
    </ion-col>
  </ion-row>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardTitle } from "@ionic/vue";
import { onMounted, ref } from "vue";

import { logOutOutline, refreshOutline } from "ionicons/icons";
// components
import CalendarComponent from "../calendar/CalendarComponent.vue";
import WakaTimeApiKeyComponent from "@/components/wakatime/ApiKeyComponent.vue";
import WakaTimeToday from "@/components/wakatime/today/WakaTimeToday.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { CalendarController } from "@/controllers/calendarController";
const systemController = new SystemController();
const calendarController = new CalendarController();

const todayComponentRef = ref();

onMounted(() => {
  systemController.loadWakaTimeApiKey();
});

function refreshTodayComponent(): void {
  todayComponentRef.value.refresh();
}

function logoutWakaTime(): void {
  todayComponentRef.value.logout();
}
</script>

<style scoped>
.card-calendar-content {
  height: 86dvh;
}

.card-main-content {
  max-height: 82vh;
  overflow-y: auto;
}

.element-selected {
  border: 1px solid var(--ion-color-primary);
}
</style>
