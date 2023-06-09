<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-row>
        <ion-col size="12">
          <div style="width: 100%">
            <ion-button
              id="open-modal-help-integrations"
              fill="clear"
              style="float: right"
            >
              <ion-icon :icon="helpCircleOutline"></ion-icon>
            </ion-button>
          </div>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col
          v-for="integration in integrations"
          :key="integration.name"
          size-lg="4"
        >
          <ion-card>
            <ion-card-header>
              <div style="display: flex; justify-content: space-between">
                <div>
                  <ion-card-title>{{ integration.name }}</ion-card-title>
                </div>

                <div>
                  <ion-button size="small" fill="clear">Instalar</ion-button>
                </div>
              </div>
            </ion-card-header>

            <ion-card-content>
              <ion-accordion-group>
                <ion-accordion>
                  <ion-item slot="header">
                    <ion-label>Descripcion</ion-label>
                  </ion-item>
                  <div slot="content" class="ion-padding">
                    <p>{{ integration.description }}</p>
                  </div>
                </ion-accordion>
              </ion-accordion-group>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <!-- modals -->
      <ion-modal ref="modal" trigger="open-modal-help-integrations">
        <ion-header mode="ios" class="ion-bo-border">
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="modalController.dismiss()"
                ><ion-icon :icon="closeOutline"></ion-icon
              ></ion-button>
            </ion-buttons>
            <ion-title>Integraciones</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <p>
            Las integraciones son una forma de ampliar la funcionalidad de
            LifeLine al permitirte tener todas tus aplicaciones de productividad
            en un único lugar. Constantemente trabajamos para incorporar cada
            vez más servicios, con el objetivo de mejorar y enriquecer tu
            experiencia dentro de la aplicación, haciendo que sea lo más
            completa posible.
          </p>
        </ion-content>
      </ion-modal>
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
  IonModal,
  IonButton,
  modalController,
} from "@ionic/vue";
import { closeOutline, helpCircleOutline } from "ionicons/icons";

const pageTitle = "Integraciones";
const integrations = [
  {
    name: "WakaTime",
    url: "",
    description:
      "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
    state: "Integrada",
  },
];
</script>
