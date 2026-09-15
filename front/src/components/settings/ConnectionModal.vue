<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="emit('close')">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ title }}</ion-title>

        <ion-buttons slot="end">
          <ion-button v-if="!isNew" @click="emit('remove')">
            <ion-icon :icon="trashOutline" color="danger"></ion-icon>
          </ion-button>

          <ion-button
            v-else-if="isNew"
            fill="clear"
            :disabled="connection.saving || connection.testing"
            @click="emit('save')"
          >
            <ion-spinner v-if="connection.saving || connection.testing" name="crescent"></ion-spinner>

            <ion-icon v-else :icon="saveOutline"></ion-icon>

            {{ connection.testing ? 'Verificando' : connection.saving ? 'Guardando' : '' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-segment v-if="!isNew" :value="activeSegment" @ion-change="onSegmentChange($event)">
        <ion-segment-button value="config">
          <ion-label>Config</ion-label>
        </ion-segment-button>

        <ion-segment-button value="calendarios">
          <ion-label>Calendarios</ion-label>
        </ion-segment-button>

        <ion-segment-button value="tareas" :disabled="true">
          <ion-label>Tareas</ion-label>
        </ion-segment-button>

        <ion-segment-button value="contactos" :disabled="true">
          <ion-label>Contactos</ion-label>
        </ion-segment-button>
      </ion-segment>

      <ion-list v-if="isNew || activeSegment === 'config'" class="transparent">
        <ion-list-header>
          <ion-label>Datos</ion-label>

          <ion-button
            v-if="!isNew"
            fill="clear"
            size="small"
            :disabled="connection.saving || connection.testing"
            @click="emit('save')"
          >
            <ion-spinner
              v-if="connection.saving || connection.testing"
              name="crescent"
            ></ion-spinner>

            {{ connection.testing ? 'Verificando…' : connection.saving ? 'Guardando…' : 'Guardar' }}
          </ion-button>
        </ion-list-header>

        <component
          :is="formComponent"
          :connection="connection as GoogleConnection & CaldavConnection"
          :disabled="formDisabled"
        />
      </ion-list>

      <ion-accordion-group v-if="connection.errorDetail && (isNew || activeSegment === 'config')">
        <ion-accordion value="error-detail">
          <ion-item slot="header">
            <ion-label>Ver detalles del error</ion-label>
          </ion-item>

          <div slot="content" class="ion-padding">{{ connection.errorDetail }}</div>
        </ion-accordion>
      </ion-accordion-group>

      <ion-alert
        :is-open="connection.discovering"
        header="Obteniendo calendarios"
        message="Descubriendo calendarios disponibles…"
        :backdrop-dismiss="false"
      ></ion-alert>

      <CollectionList
        v-if="activeSegment === 'calendarios'"
        :server-id="connection.serverId"
        :discovering="connection.discovering"
        :collections="connection.collections"
        @refresh="emit('refresh')"
        @toggle-subscription="emit('toggle-subscription', $event)"
        @toggle-hidden="emit('toggle-hidden', $event)"
        @sync-collection="emit('sync-collection', $event)"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonAccordion,
  IonAccordionGroup,
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, ref, watch } from 'vue';
import { closeOutline, saveOutline, trashOutline } from 'ionicons/icons';

// 2. Controllers / Composables
// (none — presentational, the page owns the logic)

// 3. Components
import CollectionList from '@/components/settings/CollectionList.vue';
import CaldavForm from '@/components/settings/forms/CaldavForm.vue';
import GoogleIcsForm from '@/components/settings/forms/GoogleIcsForm.vue';
import GoogleOAuthForm from '@/components/settings/forms/GoogleOAuthForm.vue';

// 4. Interface and types imports
import type { CaldavConnection, GoogleConnection } from '@/components/settings/connectionModels';

// 5. Main (props, emits, etc.)
const props = defineProps<{
  title: string;
  connection: GoogleConnection | CaldavConnection;
  connectionType: 'google' | 'caldav';
  formDisabled: boolean;
  isNew: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [];
  refresh: [];
  remove: [];
  'toggle-subscription': [value: { href: string; subscribed: boolean }];
  'toggle-hidden': [value: { href: string }];
  'sync-collection': [value: { href: string }];
}>();

// 6. Vars and const
const activeSegment = ref<'config' | 'calendarios'>('config');

// 7. Watch
watch(
  () => props.isNew,
  (isNew, wasNew) => {
    // A freshly created connection switches to its discovered calendars.
    if (wasNew && !isNew) activeSegment.value = 'calendarios';
  },
);

// 8. Computed
const formComponent = computed(() => {
  if (props.connectionType === 'caldav') return CaldavForm;
  const google = props.connection as GoogleConnection;
  return google.isOAuth ? GoogleOAuthForm : GoogleIcsForm;
});

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function onSegmentChange(params: { detail: { value?: string | number | null } }): void {
  const value = params.detail.value;
  if (value === 'config' || value === 'calendarios') {
    activeSegment.value = value;
  }
}
</script>
