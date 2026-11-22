<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/settings"></ion-back-button>
        </ion-buttons>

        <ion-title>Cuentas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <ion-list class="transparent">
              <ion-list-header>
                <ion-label>Google Calendar</ion-label>

                <ion-button
                  fill="clear"
                  size="small"
                  :disabled="connectingGoogle"
                  @click="openAddSourceSheet()"
                >
                  <ion-icon slot="start" :icon="addOutline"></ion-icon>
                  {{ connectingGoogle ? 'Conectando…' : 'Agregar' }}
                </ion-button>
              </ion-list-header>

              <ion-item
                v-for="connection in googleConnections"
                :key="connection.id"
                button
                class="transparent"
                @click="openConnection({ connectionType: 'google', id: connection.id })"
              >
                <ion-icon
                  slot="start"
                  :icon="connection.isOAuth ? logoGoogle : linkOutline"
                ></ion-icon>

                <ion-label>
                  {{ connection.name || 'Nueva conexión' }}
                  <p v-if="connection.isOAuth">Cuenta conectada</p>

                  <p v-else-if="connection.serverId !== null">URL ICS guardada</p>

                  <p v-else>Sin guardar</p>
                </ion-label>

                <ion-icon slot="end" :icon="chevronForwardOutline"></ion-icon>
              </ion-item>
            </ion-list>

            <ion-list class="transparent">
              <ion-list-header>
                <ion-label>CalDAV</ion-label>

                <ion-button fill="clear" size="small" @click="addCaldavConnection()">
                  <ion-icon slot="start" :icon="addOutline"></ion-icon>
                  Agregar
                </ion-button>
              </ion-list-header>

              <ion-item
                v-for="connection in caldavConnections"
                :key="connection.id"
                button
                class="transparent"
                @click="openConnection({ connectionType: 'caldav', id: connection.id })"
              >
                <ion-icon slot="start" :icon="serverOutline"></ion-icon>

                <ion-label>
                  {{ connection.name || 'Nueva conexión' }}
                  <p v-if="connection.serverId !== null">
                    {{ connection.collections.filter((item) => item.subscribed).length }}
                    suscripciones
                  </p>

                  <p v-else>Sin guardar</p>
                </ion-label>

                <ion-icon slot="end" :icon="chevronForwardOutline"></ion-icon>
              </ion-item>
            </ion-list>

            <!-- LBDS-292 - the local calendars the account owns: the
                 protected default plus the ones the user created. -->
            <LocalCalendarsSection />
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-modal :is-open="selected !== null" @did-dismiss="closeModal()">
        <ConnectionModal
          v-if="selectedConnection !== null"
          :title="selectedConnection.name || 'Nueva conexión'"
          :connection="selectedConnection"
          :connection-type="selected?.connectionType ?? 'google'"
          :form-disabled="isFormDisabled()"
          :is-new="isNewDraft"
          @close="closeModal()"
          @save="onModalSave()"
          @refresh="onModalDiscover()"
          @toggle-subscription="onModalToggleSubscription({ value: $event })"
          @toggle-hidden="onModalToggleHidden({ value: $event })"
          @sync-collection="onModalSyncCollection({ value: $event })"
          @remove="onModalRemove()"
          @update:connection="onModalUpdate({ connection: $event })"
        />
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  alertController,
  toastController,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  addOutline,
  chevronForwardOutline,
  linkOutline,
  logoGoogle,
  serverOutline,
} from 'ionicons/icons';

// 2. Controllers / Composables
import { CalendarSourceController } from '@/controllers/calendarSourceController';
import type { ConnectionTestOutcome } from '@/controllers/calendarSourceController';
import { useAddSourceSheet } from '@/composables/useAddSourceSheet';

const calendarSourceController = new CalendarSourceController();

// The "Agregar" menu of the Google Calendar section: a Google account or a
// calendar published as an ICS URL.
const { open: openAddSourceSheet } = useAddSourceSheet({
  options: {
    onGoogle: () => {
      void connectGoogle();
    },
    onIcs: () => {
      addIcsConnection();
    },
  },
});

// 3. Components
import ConnectionModal from '@/components/settings/ConnectionModal.vue';
import LocalCalendarsSection from '@/views/settings/components/LocalCalendarsSection.vue';

// 4. Interface and types imports
import type { Ref } from 'vue';

import type {
  CaldavConnection,
  ConnectionCollection,
  GoogleConnection,
} from '@/components/settings/connectionModels';

interface SelectedConnection {
  connectionType: 'google' | 'caldav';
  id: string;
}

// 5. Main (props, emits, etc.)
// (none)

// 6. Vars and const
const googleConnections: Ref<GoogleConnection[]> = ref([]);
const caldavConnections: Ref<CaldavConnection[]> = ref([]);
const selected: Ref<SelectedConnection | null> = ref(null);
const draft: Ref<{ connectionType: 'google' | 'caldav'; connection: GoogleConnection | CaldavConnection } | null> =
  ref(null);
const isNewDraft = ref(false);
const route = useRoute();
const router = useRouter();
const connectingGoogle = ref(false);

// 7. Watch
// (none)

// 8. Computed
const selectedConnection = computed(() => {
  return draft.value?.connection ?? null;
});

function draftGoogle(): GoogleConnection | undefined {
  const current = draft.value;
  if (!current || current.connectionType !== 'google') return undefined;
  return current.connection as GoogleConnection;
}

function draftCaldav(): CaldavConnection | undefined {
  const current = draft.value;
  if (!current || current.connectionType !== 'caldav') return undefined;
  return current.connection as CaldavConnection;
}

function commitDraft(params: {
  connection: GoogleConnection | CaldavConnection;
  sourceId: number;
}): void {
  const { connection, sourceId } = params;
  const store =
    draft.value?.connectionType === 'google' ? googleConnections.value : caldavConnections.value;
  const real = (store as (GoogleConnection | CaldavConnection)[]).find(
    (item) => item.id === connection.id,
  );
  const persisted = {
    ...cloneConnection({
      item: {
        ...connection,
        serverId: sourceId,
        testing: false,
        saving: false,
        syncing: false,
        discovering: false,
        testOk: null,
        testResult: null,
        errorDetail: null,
        collections: connection.collections.map((item) => ({ ...item, syncing: false })),
      },
    }),
  };
  if (real) {
    Object.assign(real, persisted);
    return;
  }
  const created = persisted as GoogleConnection & CaldavConnection;
  if (draft.value?.connectionType === 'google') {
    googleConnections.value.push(created as GoogleConnection);
  } else {
    caldavConnections.value.push(created as CaldavConnection);
  }
}

// 9. OnMounted
onMounted(() => {
  void bootFromRoute();
});

// 10. Functions (named parameters pattern)
function cloneConnection<T>(params: { item: T }): T {
  return JSON.parse(JSON.stringify(params.item)) as T;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function findGoogleConnection(params: { id: string }): GoogleConnection | undefined {
  return googleConnections.value.find((item) => item.id === params.id);
}

/**
 * A draft for a calendar published as an ICS URL. The modal shows the
 * Google ICS form for it and the save path creates the source.
 */
function addIcsConnection(): void {
  const connection: GoogleConnection = {
    id: newId(),
    serverId: null,
    isOAuth: false,
    name: '',
    icsUrl: '',
    color: '#3880ff',
    testing: false,
    saving: false,
    syncing: false,
    discovering: false,
    collections: [],
    testOk: null,
    testResult: null,
    errorDetail: null,
  };
  selected.value = { connectionType: 'google', id: connection.id };
  draft.value = { connectionType: 'google', connection };
  isNewDraft.value = true;
}

function addCaldavConnection(): void {
  const connection: CaldavConnection = {
    id: newId(),
    serverId: null,
    name: '',
    url: '',
    username: '',
    password: '',
    color: '#3880ff',
    testing: false,
    saving: false,
    syncing: false,
    discovering: false,
    collections: [],
    testOk: null,
    testResult: null,
    errorDetail: null,
  };
  selected.value = { connectionType: 'caldav', id: connection.id };
  draft.value = { connectionType: 'caldav', connection };
  isNewDraft.value = true;
}

function findCaldavConnection(params: { id: string }): CaldavConnection | undefined {
  return caldavConnections.value.find((item) => item.id === params.id);
}

function openConnection(params: { connectionType: 'google' | 'caldav'; id: string }): void {
  const { connectionType, id } = params;
  const item =
    connectionType === 'google'
      ? findGoogleConnection({ id })
      : findCaldavConnection({ id });
  if (!item) return;
  selected.value = { connectionType, id };
  draft.value = {
    connectionType,
    connection: cloneConnection({ item }) as GoogleConnection | CaldavConnection,
  };
  isNewDraft.value = false;
}

function closeModal(): void {
  selected.value = null;
  draft.value = null;
  isNewDraft.value = false;
}

function selectedGoogle(): GoogleConnection | undefined {
  return draftGoogle();
}

function selectedCaldav(): CaldavConnection | undefined {
  return draftCaldav();
}

/**
 * Renders the collection kinds the provider refused. The backend already
 * returns an actionable sentence per kind (disabled Google API, missing
 * scope, …), so this only labels which kind each message belongs to.
 */
function discoveryWarning(params: { errors?: Record<string, string> }): string | null {
  const entries = Object.entries(params.errors ?? {});
  if (entries.length === 0) return null;
  const labels: Record<string, string> = {
    calendar: 'Calendarios',
    tasks: 'Tareas',
    contacts: 'Contactos',
  };
  return entries.map(([kind, detail]) => `${labels[kind] ?? kind}: ${detail}`).join(' · ');
}

function showToast(params: { message: string; duration?: number }): void {
  void toastController
    .create({
      message: params.message,
      duration: params.duration ?? 2500,
      position: 'bottom',
    })
    .then((toast) => toast.present());
}

async function handleAuthFailure(): Promise<void> {
  showToast({ message: 'Sesión inválida: iniciá sesión de nuevo' });
  router.push('/login');
}

function isOwnerMismatch(params: { outcome: ConnectionTestOutcome }): boolean {
  return !params.outcome.ok && params.outcome.message.includes('otra sesión');
}

async function reportOutcome(params: { outcome: ConnectionTestOutcome }): Promise<void> {
  const { outcome } = params;
  if (!outcome.ok && outcome.kind === 'auth') {
    await handleAuthFailure();
    return;
  }
  if (isOwnerMismatch({ outcome })) {
    showToast({ message: outcome.message });
    await loadPersistedSources();
    return;
  }
  showToast({ message: outcome.message });
}

async function bootFromRoute(): Promise<void> {
  await loadPersistedSources();
  const query = route.query as Record<string, string | null>;
  if (typeof query['error'] === 'string') {
    showToast({ message: `Google no conectado: ${query['error']}` });
    return;
  }
  if (query['google'] === 'connected') {
    showToast({ message: 'Cuenta Google conectada' });
    const connectedId = Number(query['connected']);
    const target =
      googleConnections.value.find((item) => item.serverId === connectedId) ??
      googleConnections.value.find((item) => item.isOAuth);
    if (target) {
      openConnection({ connectionType: 'google', id: target.id });
      const opened = draftGoogle();
      if (opened) await discoverGoogleConnection({ connection: opened });
    }
  }
}

async function connectGoogle(): Promise<void> {
  if (connectingGoogle.value) return;
  connectingGoogle.value = true;
  try {
    const outcome = await calendarSourceController.startGoogleOAuth();
    if (outcome.ok && outcome.url) {
      window.location.href = outcome.url;
      return;
    }
    showToast({ message: outcome.message ?? 'No se pudo iniciar' });
  } finally {
    connectingGoogle.value = false;
  }
}

async function loadPersistedSources(): Promise<void> {
  googleConnections.value = googleConnections.value.filter((item) => item.serverId === null);
  caldavConnections.value = caldavConnections.value.filter((item) => item.serverId === null);
  try {
    const sources = await calendarSourceController.listSources();
    for (const source of sources) {
      if (source.type === 'ics' || source.type === 'google') {
        googleConnections.value.push({
          id: newId(),
          serverId: source.id,
          isOAuth: source.type === 'google',
          name: source.name,
          icsUrl: source.url,
          color: source.color,
          testing: false,
          saving: false,
          syncing: false,
          discovering: false,
          collections: (source.collections ?? []).map((item) => ({ ...item, syncing: false })),
          testOk: null,
          testResult: null,
          errorDetail: null,
        });
      } else {
        caldavConnections.value.push({
          id: newId(),
          serverId: source.id,
          name: source.name,
          url: source.url,
          username: source.username ?? '',
          password: '',
          testing: false,
          color: source.color,
          saving: false,
          syncing: false,
          discovering: false,
          collections: (source.collections ?? []).map((item) => ({ ...item, syncing: false })),
          testOk: null,
          testResult: null,
          errorDetail: null,
        });
      }
    }
  } catch {
    showToast({ message: 'No se pudieron cargar las conexiones guardadas' });
  }
}

async function testGoogleConnection(params: { connection: GoogleConnection }): Promise<void> {
  const { connection } = params;
  if (!connection || connection.testing) return;
  if (!connection.icsUrl) {
    showToast({ message: 'Completá la URL ICS para probar' });
    return;
  }
  connection.testing = true;
  connection.testOk = null;
  connection.testResult = null;
  connection.errorDetail = null;
  try {
    const outcome = await calendarSourceController.testConnection({
      type: 'google',
      url: connection.icsUrl,
    });
    await reportCardResult({ connection, outcome });
  } finally {
    connection.testing = false;
  }
}

async function testCaldavConnection(params: { connection: CaldavConnection }): Promise<void> {
  const { connection } = params;
  if (!connection || connection.testing) return;
  if (!connection.url) {
    showToast({ message: 'Completá la URL del servidor para probar' });
    return;
  }
  connection.testing = true;
  connection.testOk = null;
  connection.testResult = null;
  connection.errorDetail = null;
  try {
    const outcome = await calendarSourceController.testConnection({
      type: 'caldav',
      url: connection.url,
      username: connection.username,
      password: connection.password,
    });
    await reportCardResult({ connection, outcome });
  } finally {
    connection.testing = false;
  }
}

async function reportCardResult(params: {
  connection: { testOk: boolean | null; testResult: string | null; errorDetail: string | null };
  outcome: ConnectionTestOutcome;
}): Promise<void> {
  const { connection, outcome } = params;
  if (!outcome.ok && outcome.kind === 'auth') {
    await handleAuthFailure();
  } else if (isOwnerMismatch({ outcome })) {
    showToast({ message: outcome.message });
    await loadPersistedSources();
  } else {
    connection.testOk = outcome.ok;
    connection.testResult = outcome.message;
    connection.errorDetail = outcome.ok ? null : (outcome.detail ?? null);
    showToast({ message: outcome.message });
  }
}

function normalizeConnectionUrl(params: { url: string }): string {
  return params.url.trim().replace(/\/+$/, '').toLowerCase();
}

function googleDuplicate(params: { connection: GoogleConnection }): boolean {
  const { connection } = params;
  if (connection.isOAuth) return false;
  const url = normalizeConnectionUrl({ url: connection.icsUrl });
  if (url === '') return false;
  return googleConnections.value.some(
    (item) =>
      !item.isOAuth &&
      item.serverId !== null &&
      item.serverId !== connection.serverId &&
      normalizeConnectionUrl({ url: item.icsUrl }) === url,
  );
}

function caldavDuplicate(params: { connection: CaldavConnection }): boolean {
  const { connection } = params;
  const url = normalizeConnectionUrl({ url: connection.url });
  if (url === '') return false;
  return caldavConnections.value.some(
    (item) =>
      item.serverId !== null &&
      item.serverId !== connection.serverId &&
      normalizeConnectionUrl({ url: item.url }) === url &&
      item.username === connection.username,
  );
}

async function saveGoogleConnection(params: { connection: GoogleConnection }): Promise<void> {
  const { connection } = params;
  if (!connection || connection.saving) return;
  if (!connection.isOAuth && (!connection.name || !connection.icsUrl)) {
    showToast({ message: 'Completá nombre y URL ICS' });
    return;
  }
  if (!connection.isOAuth && googleDuplicate({ connection })) {
    showToast({ message: 'Esta conexión ya existe' });
    return;
  }
  if (!connection.isOAuth) {
    await testGoogleConnection({ connection });
    if (!connection.testOk) return;
  }
  const isCreate = connection.serverId === null;
  connection.saving = true;
  let savedSource: { id: number } | null = null;
  let savedOk = false;
  try {
    const outcome = await calendarSourceController.saveSource({
      serverId: connection.serverId,
      type: 'google',
      name: connection.name || 'Google Calendar',
      ...(connection.isOAuth ? {} : { url: connection.icsUrl }),
      color: connection.color,
      collections: connection.collections.map((item) => ({
        href: item.href,
        subscribed: item.subscribed,
        hidden: item.hidden,
      })),
    });
    if (outcome.ok && outcome.source) {
      commitDraft({ connection, sourceId: outcome.source.id });
      connection.serverId = outcome.source.id;
      isNewDraft.value = false;
    }
    await reportOutcome({ outcome });
    savedOk = outcome.ok;
    if (outcome.ok && outcome.source) {
      savedSource = outcome.source;
    }
  } finally {
    connection.saving = false;
  }
  if (savedOk && savedSource && isCreate) {
    if (connection.isOAuth) {
      await discoverGoogleConnection({ connection });
    } else {
      const synced = await calendarSourceController.syncSource({
        serverId: savedSource.id,
      });
      await reportOutcome({ outcome: synced });
    }
  }
}

async function saveCaldavConnection(params: { connection: CaldavConnection }): Promise<void> {
  const { connection } = params;
  if (!connection || connection.saving) return;
  if (!connection.name || !connection.url) {
    showToast({ message: 'Completá nombre y URL del servidor' });
    return;
  }
  if (caldavDuplicate({ connection })) {
    showToast({ message: 'Esta conexión ya existe' });
    return;
  }
  await testCaldavConnection({ connection });
  if (!connection.testOk) return;
  const isCreate = connection.serverId === null;
  connection.saving = true;
  let savedOk = false;
  try {
    const outcome = await calendarSourceController.saveSource({
      serverId: connection.serverId,
      type: 'caldav',
      name: connection.name,
      url: connection.url,
      username: connection.username,
      password: connection.password,
      color: connection.color,
      collections: connection.collections.map((item) => ({
        href: item.href,
        subscribed: item.subscribed,
        hidden: item.hidden,
      })),
    });
    if (outcome.ok && outcome.source) {
      commitDraft({ connection, sourceId: outcome.source.id });
      connection.serverId = outcome.source.id;
      isNewDraft.value = false;
    }
    await reportOutcome({ outcome });
    savedOk = outcome.ok;
  } finally {
    connection.saving = false;
  }
  if (savedOk && isCreate) await discoverCaldavConnection({ connection });
}

async function refreshConnection(params: {
  connection: {
    serverId: number | null;
    discovering: boolean;
    collections: ConnectionCollection[];
  };
}): Promise<void> {
  const { connection } = params;
  if (!connection || connection.discovering) return;
  if (connection.serverId === null) {
    showToast({ message: 'Guardá la conexión antes de refrescar' });
    return;
  }
  connection.discovering = true;
  try {
    const discovered = await calendarSourceController.discoverCollections({
      serverId: connection.serverId,
    });
    if (!discovered.ok || !discovered.collections) {
      const failureWarning = discoveryWarning({ errors: discovered.discoveryErrors });
      await reportOutcome({
        outcome:
          failureWarning === null
            ? discovered
            : { ...discovered, message: `${discovered.message} — ${failureWarning}` },
      });
      return;
    }
    const localFlags = new Map(
      connection.collections.map((item) => [
        item.href,
        { subscribed: item.subscribed, hidden: item.hidden },
      ]),
    );
    connection.collections = discovered.collections.map((item) => {
      const local = localFlags.get(item.href);
      return {
        ...item,
        syncing: false,
        subscribed: local?.subscribed ?? item.subscribed,
        hidden: local?.hidden ?? item.hidden,
      };
    });
    const subscribed = connection.collections.filter((item) => item.subscribed);
    const warning = discoveryWarning({ errors: discovered.discoveryErrors });
    if (subscribed.length === 0) {
      const count = `${discovered.collections.length} colecciones, ninguna suscripta`;
      showToast({
        message: warning === null ? count : `${count} — ${warning}`,
        duration: warning === null ? undefined : 8000,
      });
      return;
    }
    const synced = await calendarSourceController.syncSource({ serverId: connection.serverId });
    if (synced.ok) {
      const summary = `${discovered.collections.length} colecciones, ${subscribed.length} sincronizadas`;
      showToast({
        message: warning === null ? summary : `${summary} — ${warning}`,
        duration: warning === null ? undefined : 8000,
      });
      return;
    }
    await reportOutcome({ outcome: synced });
  } finally {
    connection.discovering = false;
  }
}

async function discoverGoogleConnection(params: { connection: GoogleConnection }): Promise<void> {
  const { connection } = params;
  if (!connection.isOAuth) {
    if (connection.serverId === null) {
      showToast({ message: 'Guardá la conexión antes de refrescar' });
      return;
    }
    if (connection.discovering) return;
    connection.discovering = true;
    try {
      const synced = await calendarSourceController.syncSource({ serverId: connection.serverId });
      await reportOutcome({ outcome: synced });
    } finally {
      connection.discovering = false;
    }
    return;
  }
  await refreshConnection({ connection });
}

async function discoverCaldavConnection(params: { connection: CaldavConnection }): Promise<void> {
  await refreshConnection({ connection: params.connection });
}

function toggleSubscription(params: {
  connection: { collections: ConnectionCollection[] };
  href: string;
  subscribed: boolean;
}): void {
  const { connection, href, subscribed } = params;
  const target = connection.collections.find((item) => item.href === href);
  if (target) target.subscribed = subscribed;
}

function toggleGoogleSubscription(params: { href: string; subscribed: boolean }): void {
  const connection = selectedGoogle();
  if (!connection) return;
  toggleSubscription({ connection, href: params.href, subscribed: params.subscribed });
  if (connection.serverId !== null) {
    void persistConnectionState({ connection, href: params.href, subscribed: params.subscribed });
  }
}

function toggleCaldavSubscription(params: { href: string; subscribed: boolean }): void {
  const connection = selectedCaldav();
  if (!connection) return;
  toggleSubscription({ connection, href: params.href, subscribed: params.subscribed });
  if (connection.serverId !== null) {
    void persistConnectionState({ connection, href: params.href, subscribed: params.subscribed });
  }
}

async function persistConnectionState(params: {
  connection: { serverId: number | null; collections: ConnectionCollection[]; id: string };
  href: string;
  subscribed: boolean;
}): Promise<void> {
  const { connection, href, subscribed } = params;
  if (connection.serverId === null) return;
  const outcome = await calendarSourceController.saveCollections({
    serverId: connection.serverId,
    collections: connection.collections.map((item) => ({
      href: item.href,
      subscribed: item.subscribed,
      hidden: item.hidden,
    })),
  });
  if (!outcome.ok) {
    const target = connection.collections.find((item) => item.href === href);
    if (target) target.subscribed = !subscribed;
    await reportOutcome({ outcome });
    return;
  }
  const real =
    draftGoogle()?.id === (connection as any).id
      ? findGoogleConnection({ id: (connection as any).id })
      : findCaldavConnection({ id: (connection as any).id });
  if (real) {
    real.collections = connection.collections.map((item) => ({ ...item }));
  }
  showToast({ message: 'Suscripción actualizada' });
}

async function syncCollection(params: {
  connection: { serverId: number | null; collections: ConnectionCollection[] };
  href: string;
}): Promise<void> {
  const { connection, href } = params;
  if (connection.serverId === null) return;
  const target = connection.collections.find((item) => item.href === href);
  if (!target || target.syncing || !target.subscribed) return;
  target.syncing = true;
  try {
    const outcome = await calendarSourceController.syncSource({
      serverId: connection.serverId,
      collectionHref: href,
    });
    await reportOutcome({ outcome });
  } finally {
    target.syncing = false;
  }
}

function onModalSyncCollection(params: { value: { href: string } }): void {
  const connection = selectedGoogle() ?? selectedCaldav();
  if (!connection) return;
  void syncCollection({ connection, href: params.value.href });
}

async function removeConnection(params: {
  connectionType: 'google' | 'caldav';
  id: string;
}): Promise<void> {
  const { connectionType, id } = params;
  const connection =
    connectionType === 'google' ? findGoogleConnection({ id }) : findCaldavConnection({ id });
  if (!connection) return;
  const outcome = await calendarSourceController.removeSource({ serverId: connection.serverId });
  if (!outcome.ok) {
    await reportOutcome({ outcome });
    return;
  }
  if (connectionType === 'google') {
    googleConnections.value = googleConnections.value.filter((item) => item.id !== id);
  } else {
    caldavConnections.value = caldavConnections.value.filter((item) => item.id !== id);
  }
  closeModal();
}

function isFormDisabled(): boolean {
  const connection = selectedGoogle() ?? selectedCaldav();
  return connection ? connection.testing || connection.saving : false;
}

function onModalUpdate(params: { connection: GoogleConnection | CaldavConnection }): void {
  if (draft.value) draft.value.connection = params.connection;
}

function onModalSave(): void {
  const google = selectedGoogle();
  if (google) {
    void saveGoogleConnection({ connection: google });
    return;
  }
  const caldav = selectedCaldav();
  if (caldav) {
    void saveCaldavConnection({ connection: caldav });
  }
}

function onModalDiscover(): void {
  const google = selectedGoogle();
  if (google) {
    void discoverGoogleConnection({ connection: google });
    return;
  }
  const caldav = selectedCaldav();
  if (caldav) {
    void discoverCaldavConnection({ connection: caldav });
  }
}

function syncHiddenToReal(params: { draft: { collections: ConnectionCollection[]; id: string } }): void {
  const { draft } = params;
  const real =
    draftGoogle()?.id === draft.id
      ? findGoogleConnection({ id: draft.id })
      : findCaldavConnection({ id: draft.id });
  if (!real) return;
  real.collections = draft.collections.map((item) => ({ ...item }));
}

function onModalToggleHidden(params: { value: { href: string } }): void {
  const connection = selectedGoogle() ?? selectedCaldav();
  if (!connection) return;
  const target = connection.collections.find((item) => item.href === params.value.href);
  if (!target) return;
  target.hidden = !target.hidden;
  if (connection.serverId !== null) {
    void persistConnectionState({ connection, href: params.value.href, subscribed: target.subscribed }).then(() => {
      if (connection.serverId !== null) syncHiddenToReal({ draft: connection as any });
    });
  } else {
    syncHiddenToReal({ draft: connection as any });
  }
}

function onModalToggleSubscription(params: { value: { href: string; subscribed: boolean } }): void {
  if (selected.value?.connectionType === 'google') {
    toggleGoogleSubscription({ href: params.value.href, subscribed: params.value.subscribed });
  } else {
    toggleCaldavSubscription({ href: params.value.href, subscribed: params.value.subscribed });
  }
}

async function onModalRemove(): Promise<void> {
  const current = selected.value;
  if (!current) return;
  const alert = await alertController.create({
    cssClass: 'alert-danger',
    header: 'Eliminar conexión',
    message: 'Esta acción eliminará la conexión y sus eventos sincronizados.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        cssClass: 'alert-button-danger',
        handler: (): void => {
          void removeConnection({ connectionType: current.connectionType, id: current.id });
        },
      },
    ],
  });
  await alert.present();
}
</script>

<style>
ion-alert.alert-danger .alert-button-danger {
  color: var(--ion-color-danger);
}
</style>
