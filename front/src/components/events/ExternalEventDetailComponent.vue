<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-list class="transparent">
    <ion-list-header>
      <ion-label>🔗 Externo · {{ event.sourceName }}</ion-label>
    </ion-list-header>

    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ event.title }}</ion-card-title>

        <ion-card-subtitle v-if="dateLabel">{{ dateLabel }}</ion-card-subtitle>
      </ion-card-header>

      <ion-card-content v-if="event.description">
        {{ event.description }}
      </ion-card-content>
    </ion-card>

    <ion-item lines="none" class="transparent">
      <ion-icon slot="start" :icon="lockClosedOutline"></ion-icon>

      <ion-label class="ion-text-wrap"
        >Solo lectura — se gestiona en su calendario de origen</ion-label
      >
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
} from '@ionic/vue';
import { computed } from 'vue';
import { lockClosedOutline } from 'ionicons/icons';

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
import type { ExternalCalendarEvent } from '@/services/externalEventService';

// 5. Main (props, emits, etc.)
const props = defineProps<{ event: ExternalCalendarEvent }>();

// 6. Vars and const
// (none)

// 7. Watch
// (none)

// 8. Computed
const dateLabel = computed(() => {
  if (!props.event.date_start) return '';
  const start = new Date(props.event.date_start);
  const startLabel = start.toLocaleString();
  if (!props.event.date_end) return startLabel;
  const end = new Date(props.event.date_end);
  return `${startLabel} → ${end.toLocaleString()}`;
});

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
// (none)
</script>
