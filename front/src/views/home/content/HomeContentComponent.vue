<template>
  <div ref="mainDiv" style="overflow: auto; height: 95dvh">
    <!-- calendar -->
    <section>
      <ion-row class="center">
        <ion-col sieze-xs="12" size-lg="8">
          <ion-card>
            <div class="ion-padding-start ion-padding-end">
              <ion-row class="scroll-horizontal">
                <ion-col size-xs="12" size-md="6" size-lg="6">
                  <ion-card class="scroll-card-calendar element-selected">
                    <div
                      class="card-calendar-content ion-padding-start ion-padding-end"
                    >
                      <CalendarComponent />
                    </div>
                  </ion-card>
                </ion-col>

                <ion-col size-xs="12" size-md="6" size-lg="6">
                  <ion-card class="element-selected">
                    <ion-card-header>
                      <div
                        style="display: flex; justify-content: space-between"
                      >
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

                          <ion-button
                            fill="clear"
                            size="small"
                            @click="logoutWakaTime()"
                            ><ion-icon :icon="logOutOutline"></ion-icon
                          ></ion-button>
                        </div>
                      </div>
                    </ion-card-header>

                    <div>
                      <!-- input api key -->
                      <div
                        v-if="!useSystem().getWakaTimeApiKey()"
                        class="ion-padding"
                      >
                        <WakaTimeApiKeyComponent />
                      </div>
                      <div v-if="useSystem().getWakaTimeApiKey()">
                        <WakaTimeToday
                          ref="todayComponentRef"
                          :api-key="useSystem().getWakaTimeApiKey()"
                        />
                      </div>
                    </div>
                  </ion-card>
                </ion-col>
              </ion-row>
            </div>
          </ion-card>
        </ion-col>
      </ion-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardTitle } from "@ionic/vue";
import { useSystem } from "@/composables/useSystem";
import { onMounted, ref } from "vue";

import { logOutOutline, refreshOutline } from "ionicons/icons";
// components
import CalendarComponent from "../calendar/CalendarComponent.vue";
import WakaTimeApiKeyComponent from "@/components/wakatime/ApiKeyComponent.vue";
import WakaTimeToday from "@/components/wakatime/today/WakaTimeToday.vue";

const todayComponentRef = ref();

onMounted(() => {
  useSystem().loadWakaTimeApiKey();
});

function refreshTodayComponent(): void {
  todayComponentRef.value.refresh();
}

function logoutWakaTime(): void {
  todayComponentRef.value.logout();
}
</script>

<style scoped>
.scroll-horizontal {
  flex-wrap: nowrap;
  overflow-x: scroll !important;
  overflow-y: hidden;
  overflow-x: hidden;
  width: 100%;
}

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
