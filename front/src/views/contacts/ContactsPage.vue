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

        <ion-title>{{ $t('message.contacts.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <ion-searchbar
              v-model="searchQuery"
              :placeholder="$t('message.contacts.search')"
              :debounce="0"
              :disabled="loading"
            ></ion-searchbar>

            <div v-if="loading" class="contacts-state">
              <ion-spinner name="crescent"></ion-spinner>
            </div>

            <div v-else-if="loadError" class="contacts-state">
              <ion-icon :icon="alertCircleOutline" size="large" color="danger"></ion-icon>
              <p>{{ $t('message.contacts.loadError') }}</p>
              <ion-button fill="clear" @click="loadContacts">
                <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
                Reintentar
              </ion-button>
            </div>

            <div
              v-else-if="contacts.length === 0"
              class="contacts-state"
              data-testid="contacts-empty"
            >
              <ion-icon :icon="peopleOutline" size="large"></ion-icon>
              <p>{{ $t('message.contacts.empty') }}</p>
            </div>

            <ion-list
              v-else-if="filteredContacts.length > 0"
              data-testid="contacts-list"
            >
              <ion-item
                v-for="contact in filteredContacts"
                :key="contact.key"
                button
                :detail="true"
                @click="openDetail({ contact })"
              >
                <ion-avatar slot="start">
                  <ion-icon :icon="personCircleOutline" size="large"></ion-icon>
                </ion-avatar>
                <ion-label class="ion-text-wrap">
                  <h2>{{ contact.displayName || $t('message.noTitle') }}</h2>
                  <p v-if="contact.email">{{ contact.email }}</p>
                  <p v-else-if="contact.phone">{{ contact.phone }}</p>
                  <p v-else>{{ contact.sourceName || '—' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>

            <div v-else class="contacts-state">
              <ion-icon :icon="searchOutline" size="large"></ion-icon>
              <p>{{ $t('message.contacts.noResults') }}</p>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>

    <ion-modal :is-open="isOpenDetail" @did-dismiss="closeDetail">
      <ion-page>
        <ion-header mode="ios" class="ion-no-border">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button :aria-label="$t('message.contacts.close')" @click="closeDetail">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-title>{{ $t('message.contacts.title') }}</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content v-if="selectedContact">
          <ExternalContactDetailComponent :contact="selectedContact" />
        </ion-content>
      </ion-page>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, onMounted, ref, watch } from 'vue';
import {
  alertCircleOutline,
  closeOutline,
  peopleOutline,
  personCircleOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';

// 2. Controllers / Composables
import { ExternalContactsController } from '@/controllers/externalContactsController';
import { useExternalSyncOnEnter } from '@/composables/useExternalSync';

const controller = new ExternalContactsController();
const { lastSyncedAt } = useExternalSyncOnEnter();

// 3. Components
import ExternalContactDetailComponent from '@/components/contacts/ExternalContactDetailComponent.vue';

// 4. Interface and types imports
import type { ExternalContact } from '@/services/externalContactService';

// 5. Main (props, emits, etc.)
// (none)

// 6. Vars and const
const searchQuery = ref('');
const contacts = ref<ExternalContact[]>([]);
const loading = ref(false);
const loadError = ref(false);
const isOpenDetail = ref(false);
const selectedContact = ref<ExternalContact | null>(null);

// 7. Watch
watch(lastSyncedAt, () => {
  void loadContacts();
});

// 8. Computed
const filteredContacts = computed((): ExternalContact[] => {
  const query = searchQuery.value.trim().toLowerCase();
  if (query === '') return contacts.value;
  return contacts.value.filter((contact) => {
    return (
      contact.displayName.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query)
    );
  });
});

// 9. OnMounted
onMounted(() => {
  void loadContacts();
});

// 10. Functions (named parameters pattern)
async function loadContacts(): Promise<void> {
  loading.value = true;
  loadError.value = false;
  try {
    contacts.value = await controller.loadContacts();
  } catch (error) {
    console.warn('[ContactsPage] no se pudieron cargar los contactos', error);
    contacts.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

function openDetail(params: { contact: ExternalContact }): void {
  selectedContact.value = params.contact;
  isOpenDetail.value = true;
}

function closeDetail(): void {
  isOpenDetail.value = false;
  selectedContact.value = null;
}
</script>

<style scoped>
.contacts-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  color: var(--ion-color-medium, #92949c);
}
</style>
