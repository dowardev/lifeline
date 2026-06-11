<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- main options -->
      <section>
        <ion-row>
          <ion-col size="12">
            <!-- button popover  main options -->
            <div style="float: right">
              <ion-item lines="none">
                <ion-button
                  fill="clear"
                  @click="
                    eventPopOverMainOptions = $event;
                    isOpenPopOverMainOptions = true;
                  "
                >
                  <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </div>
          </ion-col>
        </ion-row>
      </section>

      <!-- calendar -->
      <section>
        <ion-row class="center">
          <ion-col sieze-xs="12" size-lg="8">
            <ion-card class="card-main-content">
              <div class="ion-padding-start ion-padding-end">
                <ion-row class="scroll-horizontal">
                  <ion-col size-xs="12" size-md="6" size-lg="6">
                    <ion-card class="scroll-card-calendar">
                      <div
                        class="card-calendar-content ion-padding-start ion-padding-end"
                      >
                        <CalendarComponent />
                      </div>
                    </ion-card>
                  </ion-col>

                  <ion-col size-xs="12" size-md="6" size-lg="6">
                    <ion-card>
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
                          v-if="!wakaTimeController.getApiKey()"
                          class="ion-padding"
                        >
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
              </div>
            </ion-card>
          </ion-col>
        </ion-row>
      </section>

      <!-- popovers -->
      <!-- popover main options -->
      <ion-popover
        :is-open="isOpenPopOverMainOptions"
        :event="eventPopOverMainOptions"
        @did-dismiss="isOpenPopOverMainOptions = false"
      >
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
} from "@ionic/vue";
import { onMounted, ref } from "vue";

import {
  brushOutline,
  ellipsisVerticalOutline,
  logOutOutline,
  refreshOutline,
} from "ionicons/icons";

// components
import CalendarComponent from "./calendar/CalendarComponent.vue";
import WakaTimeApiKeyComponent from "@/components/wakatime/ApiKeyComponent.vue";
import WakaTimeToday from "@/components/wakatime/today/WakaTimeToday.vue";

// controllers
import { WakaTimeController } from "@/controllers/wakaTimeController";
const wakaTimeController = new WakaTimeController();

const pageTitle = "Inicio";
const todayComponentRef = ref();
const isOpenPopOverMainOptions = ref(false);
const eventPopOverMainOptions = ref(null as CustomEvent | null);

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
.scroll-horizontal {
  flex-wrap: nowrap;
  overflow-x: scroll !important;
  overflow-y: hidden;
  overflow-x: hidden;
  width: 100%;
}

.card-calendar-content {
  height: 76vh;
}

.card-main-content {
  max-height: 82vh;
  overflow-y: auto;
}
</style>
