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

        <ion-title>Configuración</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <ion-list class="transparent">
              <ion-item button lines="full" class="transparent" @click="goToCalendarSettings()">
                <ion-icon slot="start" :icon="calendarOutline"></ion-icon>

                <ion-label>Calendario</ion-label>

                <ion-icon slot="end" :icon="chevronForwardOutline"></ion-icon>
              </ion-item>
            </ion-list>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { calendarOutline, chevronForwardOutline } from 'ionicons/icons';

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits, etc.)
// (none)

// 6. Vars and const
const router = useRouter();

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function goToCalendarSettings(): void {
  router.push('/settings/calendar');
}
</script>
