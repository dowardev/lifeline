<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ document?.title || "Documento" }}</ion-title>

        <ion-buttons slot="end">
          <ion-button fill="clear" @click="goBack()">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <ion-row class="center">
              <ion-col size-xs="12" size-lg="8">
                <ion-card>
                  <ion-card-content>
                    <div v-if="document">
                      <ion-text>
                        <p>{{ document.content as string }}</p>
                      </ion-text>
                    </div>
                    <div v-else>
                      <ion-text color="medium">
                        <p>Cargando documento...</p>
                      </ion-text>
                    </div>
                  </ion-card-content>
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
  IonButtons,
  IonCard,
  IonCardContent,
  IonText,
  IonRow,
  IonCol,
  IonMenuButton,
  IonIcon,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

// controllers
import { DocumentController } from "@/controllers/documentController";
const documentController = new DocumentController();

const router = useRouter();
const route = useRoute();

const documentUrl = route.params.url as string;

const document = computed(() => {
  const docs = documentController.getUserDocuments();
  if (!docs) return undefined;
  return docs.find((doc) => doc.url === documentUrl);
});

function goBack(): void {
  router.push("/documents");
}

onMounted(() => {
  documentController.loadDocuments();
});
</script>