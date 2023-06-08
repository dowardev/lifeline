<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-row>
        <ion-col size="12">
          <div style="width: 100%">
            <ion-button fill="clear" style="float: right">
              Integraciones
            </ion-button>
          </div>
        </ion-col>
      </ion-row>

      <ion-row class="scroll">
        <ion-col size-xs="12" size-md="6" size-lg="4">
          <ion-card style="height: 100vh">
            <ion-card-content>
              <CalendarComponent />
            </ion-card-content>
          </ion-card>
        </ion-col>

        <ion-col size-xs="12" size-md="6" size-lg="6">
          <ion-row>
            <ion-col size-lg="8">
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

                      <ion-button
                        fill="clear"
                        size="small"
                        @click="logoutWakaTime()"
                        ><ion-icon :icon="logOutOutline"></ion-icon
                      ></ion-button>
                    </div>
                  </div>
                </ion-card-header>

                <ion-card-content>
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
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-col>
      </ion-row>
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
  IonCardContent,
} from "@ionic/vue";
import { useSystem } from "@/composables/useSystem";
import { onMounted, ref } from "vue";

import { logOutOutline, refreshOutline } from "ionicons/icons";
// components
import CalendarComponent from "./calendar/CalendarComponent.vue";
import WakaTimeApiKeyComponent from "@/components/wakatime/ApiKeyComponent.vue";
import WakaTimeToday from "@/components/wakatime/today/WakaTimeToday.vue";

const pageTitle = "Inicio";
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
.scroll {
  flex-wrap: nowrap;
  overflow-x: scroll !important;
  overflow-y: hidden;
  overflow-x: hidden;
}
::-webkit-scrollbar {
  display: none;
}
</style>
