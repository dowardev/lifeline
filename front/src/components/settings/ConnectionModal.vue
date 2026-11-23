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

        <ion-segment-button value="tareas">
          <ion-label>Tareas</ion-label>
        </ion-segment-button>

        <ion-segment-button value="contactos">
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
          @update:connection="onFormUpdate({ connection: $event })"
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
        :is-open="progressAlert.isOpen"
        :header="progressAlert.header"
        :message="progressAlert.message"
        :backdrop-dismiss="false"
      ></ion-alert>

      <CollectionList
        v-if="activeSegment === 'calendarios'"
        :server-id="connection.serverId"
        :discovering="connection.discovering"
        :collections="connection.collections"
        title="Calendarios"
        kind="calendar"
        @refresh="onRefresh({ kind: 'calendar' })"
        @toggle-subscription="emit('toggle-subscription', $event)"
        @toggle-hidden="emit('toggle-hidden', $event)"
        @sync-collection="emit('sync-collection', $event)"
      />

      <CollectionList
        v-if="activeSegment === 'tareas'"
        :server-id="connection.serverId"
        :discovering="connection.discovering"
        :collections="connection.collections"
        title="Listas de tareas"
        kind="tasks"
        @refresh="onRefresh({ kind: 'tasks' })"
        @toggle-subscription="emit('toggle-subscription', $event)"
        @toggle-hidden="emit('toggle-hidden', $event)"
        @sync-collection="emit('sync-collection', $event)"
      />

      <CollectionList
        v-if="activeSegment === 'contactos'"
        :server-id="connection.serverId"
        :discovering="connection.discovering"
        :collections="connection.collections"
        title="Libretas de contactos"
        kind="contacts"
        @refresh="onRefresh({ kind: 'contacts' })"
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
import { collectionKindOf } from '@/components/settings/connectionModels';

// 2. Controllers / Composables
// (none — presentational, the page owns the logic)

// 3. Components
import CollectionList from '@/components/settings/CollectionList.vue';
import CaldavForm from '@/components/settings/forms/CaldavForm.vue';
import GoogleOAuthForm from '@/components/settings/forms/GoogleOAuthForm.vue';
import IcsUrlForm from '@/components/settings/forms/IcsUrlForm.vue';

// 4. Interface and types imports
import type {
  CaldavConnection,
  CollectionKind,
  ConnectionCollection,
  GoogleConnection,
} from '@/components/settings/connectionModels';

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
  'update:connection': [connection: GoogleConnection | CaldavConnection];
}>();

// 6. Vars and const
const activeSegment = ref<'config' | 'calendarios' | 'tareas' | 'contactos'>('config');
const refreshingKind = ref<CollectionKind | null>(null);

// 7. Watch
watch(
  () => props.connection.discovering,
  (discovering, wasDiscovering) => {
    // Drop the section-derived label once the batch discovery finishes.
    if (wasDiscovering && !discovering) refreshingKind.value = null;
  },
);

watch(
  () => props.isNew,
  (isNew, wasNew) => {
    // A freshly created connection switches to its discovered calendars.
    if (wasNew && !isNew) activeSegment.value = 'calendarios';
  },
);

// 8. Computed
// A calendar published as an ICS URL belongs to no provider: the form is the
// plain ICS one, not the Google account form.
const formComponent = computed(() => {
  if (props.connectionType === 'caldav') return CaldavForm;
  const google = props.connection as GoogleConnection;
  return google.isOAuth ? GoogleOAuthForm : IcsUrlForm;
});

// The single collection currently downloading, when the user syncs one row.
const syncingCollection = computed<ConnectionCollection | null>(
  () => props.connection.collections.find((item) => item.syncing) ?? null,
);

const progressAlert = computed(() => {
  const collection = syncingCollection.value;
  if (collection !== null) {
    const kind = collectionKindOf({ type: collection.type });
    return {
      isOpen: true,
      header: `Obteniendo ${kindLabel({ kind, plural: true })}`,
      message: `Descargando “${collection.name}”…`,
    };
  }

  if (props.connection.discovering) {
    const kind = refreshingKind.value;
    if (kind === null) {
      return {
        isOpen: true,
        header: 'Obteniendo contenido de la cuenta',
        message: 'Descubriendo contenido disponible…',
      };
    }
    return {
      isOpen: true,
      // The header stays personalized per section, but the message must not
      // claim only that kind is fetched: refreshConnection discovers the
      // whole account.
      header: `Obteniendo ${kindLabel({ kind, plural: true })}`,
      message: 'Buscando todo el contenido disponible de la cuenta…',
    };
  }

  return { isOpen: false, header: '', message: '' };
});

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function onFormUpdate(params: { connection: GoogleConnection | CaldavConnection }): void {
  emit('update:connection', params.connection);
}

function onSegmentChange(params: { detail: { value?: string | number | null } }): void {
  const value = params.detail.value;
  if (value === 'config' || value === 'calendarios' || value === 'tareas' || value === 'contactos') {
    activeSegment.value = value;
  }
}

function kindLabel(params: { kind: CollectionKind; plural?: boolean }): string {
  const { kind, plural = false } = params;
  if (kind === 'tasks') return plural ? 'tareas' : 'tarea';
  if (kind === 'contacts') return plural ? 'contactos' : 'contacto';
  return plural ? 'calendarios' : 'calendario';
}

function onRefresh(params: { kind: CollectionKind }): void {
  refreshingKind.value = params.kind;
  emit('refresh');
}
</script>
