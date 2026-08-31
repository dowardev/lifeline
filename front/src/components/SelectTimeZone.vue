<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="save()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Zona horaria</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          :debounce="500"
          @ion-change="search({ word: $event.detail.value! })"
        >
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="searchResult.length > 0">
        <ion-item
          v-for="zone in searchResult"
          :key="zone"
          button
          @click="save({ timeZone: zone })"
        >
          <ion-label>{{ getTimeZoneLabel(zone) }}</ion-label>
        </ion-item>
      </div>
      <div v-if="searchResult.length == 0">
        <ion-accordion-group>
          <ion-accordion
            v-for="group in timeZoneGroups"
            :key="group.header"
            :value="group.header"
          >
            <ion-item slot="header">
              <ion-label>{{ group.header }}</ion-label>
            </ion-item>
            <div slot="content">
              <ion-item
                v-for="zone in group.zones"
                :key="zone"
                button
                @click="save({ timeZone: zone })"
              >
                <ion-label>{{ getTimeZoneLabel(zone) }}</ion-label>
              </ion-item>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonAccordion,
  IonAccordionGroup,
  IonLabel,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  modalController,
} from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import { ref } from "vue";

// 2. Controllers / Composables
import { SystemController } from "@/controllers/systemController";
const systemController = new SystemController();

// 3. Components
// (none)

// 4. Interface and types imports

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const timeZoneNames = systemController.getTimeZoneNames();
const timeZoneGroups = systemController.groupTimeZones(timeZoneNames);
const getTimeZoneLabel = systemController.getTimeZoneLabel;
const searchResult = ref([] as Array<string>);

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function search(params: { word: string }): void {
  const { word } = params;
  searchResult.value = [];
  timeZoneNames.forEach((element: string) => {
    if (element.toLowerCase().indexOf(word.toLowerCase()) >= 0) {
      searchResult.value.push(element);
    }
  });
}

function save(params?: { timeZone: string }): void {
  const timeZone = params?.timeZone ?? "";
  closeModal({ timeZone });
}

function closeModal(params: { timeZone: string }): void {
  modalController.dismiss({ timeZone: params.timeZone });
}
</script>
