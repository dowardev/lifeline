<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <ion-button
          fill="clear"
          @click="
            eventPopOverMainOptions = $event;
            isOpenPopOverMainOptions = true;
          "
        >
          <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

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
  </div>
</template>

<script setup lang="ts">
import { IonContent, IonTitle, IonToolbar, IonButton } from "@ionic/vue";
import { onMounted, ref } from "vue";

import { brushOutline, ellipsisVerticalOutline } from "ionicons/icons";
// components

const pageTitle = "Inicio";
const isOpenPopOverMainOptions = ref(false);
const eventPopOverMainOptions = ref(null as CustomEvent | null);

// controllers
import { SystemController } from "@/js/systemController";
const systemController = new SystemController();

onMounted(() => {
  systemController.loadWakaTimeApiKey();
});
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
