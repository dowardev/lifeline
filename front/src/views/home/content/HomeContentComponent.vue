<template>
  <ion-row style="max-height: 100%">
    <!-- calendar -->
    <ion-col size-xs="12" size-md="6" size-lg="3">
      <ion-card
        v-if="calendarController.getCalendarDataStatus() == 'success'"
        style="margin: 0"
        class="element-selected"
      >
        <ion-card-header>
          <div style="display: flex; justify-content: space-between">
            <div class="center-vertical">
              <ion-card-title>Calendario</ion-card-title>
            </div>

            <div>
              <ion-button
                fill="clear"
                size="small"
                @click="$router.push('/calendar')"
              >
                <ion-icon :icon="openOutline"></ion-icon>
              </ion-button>
            </div>
          </div>
        </ion-card-header>

        <ion-card-content>
          <div
            style="display: flex; align-items: center"
            class="ion-padding-start"
          >
            <ion-icon
              :icon="informationCircleOutline"
              class="ion-padding-end"
            ></ion-icon>

            <ion-label>
              {{ totalEventsToday }}
            </ion-label>
          </div>

          <ion-accordion-group>
            <ion-accordion value="first">
              <ion-item slot="header">
                <ion-label>Mostrar mas</ion-label>
              </ion-item>

              <div slot="content">
                <!-- calendar component -->
                <CalendarComponent />
              </div>
            </ion-accordion>
          </ion-accordion-group>
        </ion-card-content>
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

              <ion-button fill="clear" size="small">
                <ion-icon :icon="openOutline"></ion-icon>
              </ion-button>
            </div>
          </div>
        </ion-card-header>

        <WakaTimeToday
          v-if="systemController.getWakaTimeApiKey()"
          ref="todayComponentRef"
          :api-key="systemController.getWakaTimeApiKey()"
        />

        <div>
          <!-- input api key -->
          <div v-if="!systemController.getWakaTimeApiKey()" class="ion-padding">
            <WakaTimeApiKeyComponent />
          </div>
        </div>
      </ion-card>
    </ion-col>
  </ion-row>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardTitle } from "@ionic/vue";
import { onMounted, ref, computed } from "vue";

import {
  logOutOutline,
  refreshOutline,
  openOutline,
  informationCircleOutline,
} from "ionicons/icons";
// components
import CalendarComponent from "../calendar/CalendarComponent.vue";
import WakaTimeApiKeyComponent from "@/components/wakatime/ApiKeyComponent.vue";
import WakaTimeToday from "@/components/wakatime/today/WakaTimeToday.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { CalendarController } from "@/controllers/calendarController";
import { EventController } from "@/controllers/eventController";

const systemController = new SystemController();
const calendarController = new CalendarController();
const eventsController = new EventController();

const todayComponentRef = ref();

const totalEventsToday = computed(() => {
  const count = eventsController.countEvents({ date: new Date() });
  if (count === 0) {
    return "No hay eventos para el día de hoy";
  } else if (count === 1) {
    return `${count} evento para el día de hoy`;
  } else {
    return `${count} eventos para el día de hoy`;
  }
});

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
