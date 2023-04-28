<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true">
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

    <ion-content
      v-if="useDocument().getUserDocuments() != undefined"
      :fullscreen="true"
    >
      <ion-row>
        <ion-col
          v-for="(document, index) in useDocument().getUserDocuments()"
          :key="index"
          size-xs="12"
          class="center"
        >
          <ion-card
            @click="openDocument({ documentUrl: document.url })"
            @contextmenu.prevent="
              openPopoverRightMenu({ ev: $event, documentId: document.id })
            "
            @press="
              openPopoverRightMenu({ ev: $event, documentId: document.id })
            "
          >
            <ion-card-header>
              <ion-card-title>{{ document.title }}</ion-card-title>
            </ion-card-header>
          </ion-card>
        </ion-col>
      </ion-row>
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
import { ref } from "vue";
import { useEventsStore } from "../../store/eventsStore";
import { Storage } from "@ionic/storage";
import { storeToRefs } from "pinia";
import { useDocument } from "../../composables/useDocument";
import RightMenuComponent from "./RightMenuComponent.vue";
import { useRouter } from "vue-router";
import { addOutline, calendarOutline } from "ionicons/icons";

const eventsStore = useEventsStore();
const { date } = storeToRefs(eventsStore);
const storage = new Storage();
storage.create();
const router = useRouter();

// refs
const pageTitle = ref("Inicio");
const mainCalendar = ref(null);

// functions
const resetCalendar = async () => {
  (mainCalendar.value as any).$el.reset();
};

const selectDay = (e: any) => {
  const date = e.detail.value;
  eventsStore.date = date;
  eventsStore.loadEvents({ refetch: false });
};

const addDocument = async () => {
  const documentUrl = (await createDocument())?.documentUrl;

  await router.push({
    name: "DocumentPage",
    params: { url: documentUrl },
  });
};

const loadDocuments = async () => {
  await useDocument().loadUserDocuments();
};

const openDocument = async (params: { documentUrl: string }) => {
  const url = params.documentUrl;
  router.push(`/document/${url}`);
};

const deleteDocument = async (params: { documentId: string }) => {
  const documentId = params.documentId;
  await useDocument().deleteDocument({ documentId });
};

const openPopoverRightMenu = async (params: {
  ev: Event;
  documentId: string;
}) => {
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
  let document = {
    title: "Nuevo documento",
  };

  let url = undefined;
  try {
    const response = await useDocument().saveDocument({ document });
    if (response == null) return undefined;
    url = response.url;
    return { documentUrl: url };
  } catch (e) {
    console.error(e);
  }

  return undefined;
};

// mounted
// this.eventsStore.loadEvents({ refetch: true });
loadDocuments();
</script>
