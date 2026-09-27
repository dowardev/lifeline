<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-list class="transparent">
    <ion-list-header>
      <ion-label>🔗 Externo · {{ contact.sourceName }}</ion-label>
    </ion-list-header>

    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ contact.displayName || $t('message.noTitle') }}</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <ion-item v-if="contact.email" lines="full">
          <ion-icon slot="start" :icon="mailOutline"></ion-icon>
          <ion-label class="ion-text-wrap">
            <h3>{{ $t('message.email') }}</h3>
            <p>{{ contact.email }}</p>
          </ion-label>
        </ion-item>

        <ion-item v-if="contact.phone" lines="full">
          <ion-icon slot="start" :icon="callOutline"></ion-icon>
          <ion-label class="ion-text-wrap">
            <h3>{{ contact.phone }}</h3>
          </ion-label>
        </ion-item>

        <ion-item v-if="!contact.email" lines="none">
          <ion-icon slot="start" :icon="mailOutline"></ion-icon>
          <ion-label>{{ $t('message.contacts.noEmail') }}</ion-label>
        </ion-item>

        <ion-item v-if="!contact.phone" lines="none">
          <ion-icon slot="start" :icon="callOutline"></ion-icon>
          <ion-label>{{ $t('message.contacts.noPhone') }}</ion-label>
        </ion-item>
      </ion-card-content>
    </ion-card>

    <ion-item lines="none" class="transparent">
      <ion-icon slot="start" :icon="lockClosedOutline"></ion-icon>
      <ion-label class="ion-text-wrap">{{ $t('message.contacts.readOnly') }}</ion-label>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
} from '@ionic/vue';
import { callOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
import type { ExternalContact } from '@/services/externalContactService';

// 5. Main (props, emits, etc.)
defineProps<{ contact: ExternalContact }>();

// 6. Vars and const
// (none)

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
// (none)
</script>
