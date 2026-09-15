<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-list v-if="serverId !== null" class="transparent">
    <ion-list-header>
      <ion-label>Calendarios</ion-label>

      <ion-button fill="clear" size="small" :disabled="discovering" @click="emit('refresh')">
        Refrescar
      </ion-button>
    </ion-list-header>

    <ion-item
      v-for="collection in collections"
      :key="collection.href"
      lines="full"
      button
      :detail="false"
      :disabled="discovering"
      @click="emit('toggle-subscription', { href: collection.href, subscribed: !collection.subscribed })"
    >
      <ion-checkbox
        slot="start"
        :checked="collection.subscribed"
        :disabled="discovering"
      ></ion-checkbox>

      <ion-label slot="start"
        >{{ collectionIcon({ type: collection.type }) }} {{ collection.name }}</ion-label
      >

      <ion-button
        slot="end"
        fill="clear"
        size="small"
        :disabled="!collection.subscribed"
        @click.stop="emit('toggle-hidden', { href: collection.href })"
      >
        <ion-icon
          slot="icon-only"
          :icon="collection.hidden ? eyeOffOutline : eyeOutline"
        ></ion-icon>
      </ion-button>

      <ion-button
        slot="end"
        fill="clear"
        size="small"
        :disabled="!collection.subscribed || collection.syncing"
        @click.stop="emit('sync-collection', { href: collection.href })"
      >
        <ion-icon slot="icon-only" :icon="syncOutline"></ion-icon>
      </ion-button>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonCheckbox,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
} from '@ionic/vue';
import { eyeOffOutline, eyeOutline, syncOutline } from 'ionicons/icons';

// 2. Controllers / Composables
// (none — presentational)

// 3. Components
// (none)

// 4. Interface and types imports
import type { ConnectionCollection } from '@/components/settings/connectionModels';

// 5. Main (props, emits, etc.)
defineProps<{
  serverId: number | null;
  discovering: boolean;
  collections: ConnectionCollection[];
}>();

const emit = defineEmits<{
  refresh: [];
  'toggle-subscription': [value: { href: string; subscribed: boolean }];
  'toggle-hidden': [value: { href: string }];
  'sync-collection': [value: { href: string }];
}>();

// 6. Vars and const
// (none)

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function collectionIcon(params: { type: string }): string {
  return params.type === 'tasks' ? '☑️' : '📅';
}
</script>
