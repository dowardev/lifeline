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
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row >
          <ion-col size="12" >
            <ion-list>
              <ion-list-header>
                <ion-label>Widgets</ion-label>

                <ion-button id="main-options-trigger" fill="clear">
                  <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
                </ion-button>
              </ion-list-header>

              <ion-row class="ion-justify-content-center">
                <ion-col size=12 size-lg="6">
                  <ion-row class="ion-justify-content-center">
                    <ion-col size-xs="12" size-md="6" size-lg="5">
                      <ion-card class="scroll-card-calendar">
                          <CalendarComponent />
                      </ion-card>
                    </ion-col>

                    <ion-col size-xs="12" size-md="6" size-lg="5">
                      <ion-card>
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
                          <div v-if="!wakaTimeController.getApiKey()" class="ion-padding">
                            <WakaTimeApiKeyComponent />
                          </div>
                          <div v-if="wakaTimeController.getApiKey()">
                            <WakaTimeToday
                              ref="todayComponentRef"
                              :api-key="wakaTimeController.getApiKey()"
                            />
                          </div>
                        </div>
                      </ion-card>
                    </ion-col>
                  </ion-row>
                </ion-col>
              </ion-row>
            </ion-list>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- popovers -->
      <!-- popover main options -->
      <ion-popover trigger="main-options-trigger" trigger-action="click">
        <ion-content>
          <ion-list>
            <ion-list-header>
              <ion-label>General</ion-label>
            </ion-list-header>

            <ion-row>
              <ion-col>
                <!-- button modal reschedule tasks -->
                <ion-item button lines="none">
                  <ion-icon slot="start" :icon="brushOutline"></ion-icon>
                  <ion-label class="ion-text-wrap">Personalizar</ion-label>
                </ion-item>
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardTitle,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';

import {
  brushOutline,
  ellipsisVerticalOutline,
  logOutOutline,
  refreshOutline,
} from 'ionicons/icons';

// components
import CalendarComponent from './calendar/CalendarComponent.vue';
import WakaTimeApiKeyComponent from '@/components/wakatime/ApiKeyComponent.vue';
import WakaTimeToday from '@/components/wakatime/today/WakaTimeToday.vue';

// controllers
import { WakaTimeController } from '@/controllers/wakaTimeController';
const wakaTimeController = new WakaTimeController();

const pageTitle = 'Inicio';
const todayComponentRef = ref();

onMounted(() => {
  wakaTimeController.loadApiKey();
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
  height: 76vh;
}
</style>
