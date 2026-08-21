<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="firstMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <section>
            <ion-button fill="clear" expand="block" @click="addDocument()">
              <ion-icon :icon="addOutline"></ion-icon>
            </ion-button>
          </section>

          <ion-button id="open-main-calendar" fill="clear">
            <ion-icon :icon="calendarOutline"></ion-icon>
          </ion-button>
          <ion-popover trigger="open-main-calendar" :show-backdrop="false">
            <ion-datetime
              ref="mainCalendar"
              v-model="date"
              presentation="date"
              @ion-change="selectDay($event)"
            >
            </ion-datetime>
            <ion-item>
              <ion-button slot="end" fill="clear" @click="resetCalendar()"
                >Reset</ion-button
              >
            </ion-item>
          </ion-popover>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content v-if="documentsList != undefined">
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <ion-row>
              <ion-col
                v-for="(document, index) in documentsList"
                :key="index"
                size-xs="12"
                class="center"
              >
                <ion-card
                  @click="openDocument({ documentUrl: document.url ?? '' })"
                  @contextmenu.prevent="
                    openPopoverRightMenu({ ev: $event, documentId: String(document.id) })
                  "
                  @press="
                    openPopoverRightMenu({ ev: $event, documentId: String(document.id) })
                  "
                >
                  <ion-card-header>
                    <ion-card-title>{{ document.title }}</ion-card-title>
                  </ion-card-header>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonMenuButton,
  IonButtons,
  IonDatetime,
  IonPopover,
  IonCard,
  IonCardTitle,
  IonCardHeader,
  IonRow,
  IonCol,
  IonItem,
  IonIcon,
  popoverController,
} from "@ionic/vue";
import { computed, onMounted, ref } from "vue";
import RightMenuComponent from "./RightMenuComponent.vue";
import { useRouter } from "vue-router";
import { addOutline, calendarOutline } from "ionicons/icons";
import { EventController } from "@/controllers/eventController";

const router = useRouter();
const eventController = new EventController();
const date = ref("");

// controllers
import { DocumentController } from "@/controllers/documentController";
const documentController = new DocumentController();
const documentsList = computed(() => documentController.getUserDocuments())

// refs
const pageTitle = ref("Inicio");
const mainCalendar = ref(null);

// functions
const resetCalendar = async (): Promise<void> => {
  (mainCalendar.value as any).$el.reset();
};

const selectDay = (e: any): void => {
  const selectedDate = e.detail.value;
  eventController.setDate({ date: selectedDate });
  date.value = selectedDate;
};

const addDocument = async (): Promise<void> => {
  const documentUrl = (await createDocument())?.documentUrl;

  await router.push({
    name: "DocumentPage",
    params: { url: documentUrl },
  });
};

const loadDocuments = async (): Promise<void> => {
  await documentController.loadDocuments();
};

const openDocument = async (params: { documentUrl: string }): Promise<void> => {
  const url = params.documentUrl;
  router.push(`/document/${url}`);
};

const deleteDocument = async (params: { documentId: string }): Promise<void> => {
  const documentId = params.documentId;
  await documentController.deleteDocument({ id: Number(documentId) });
};

const openPopoverRightMenu = async (params: {
  ev: Event;
  documentId: string;
}): Promise<void> => {
  const documentId = params.documentId;
  const ev = params.ev;

  const popover = await popoverController.create({
    component: RightMenuComponent,
    event: ev,
    showBackdrop: false,
  });
  await popover.present();

  const { role, data } = await popover.onDidDismiss();
  if (role == "confirm" && data.option == "delete") {
    await deleteDocument({ documentId });
  }
};

const createDocument = async (): Promise<
  { documentUrl: string | undefined } | undefined
> => {
  const document = {
    title: "Nuevo documento",
  };

  let url = undefined;
  try {
    const response = await documentController.createDocument({ title: document.title });
    if (response == null) return undefined;
    url = response.url;
    return { documentUrl: url };
  } catch (e) {
    console.error(e);
  }

  return undefined;
};

// mounted
onMounted(() => {
  loadDocuments();
});
</script>
