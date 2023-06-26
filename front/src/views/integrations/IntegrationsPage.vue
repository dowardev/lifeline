<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <!-- button popover  main options -->
          <ion-button
            @click="
              eventPopOverMainOptions = isPlatform('mobile') ? null : $event;
              isOpenPopOverMainOptions = true;
            "
          >
            <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-row>
        <ion-col
          v-for="integration in integrations"
          :key="integration.name"
          size-xs="12"
          size-lg="12"
        >
          <ion-row class="center">
            <ion-col size-xs="12" size-md="6" size-lg="4">
              <ion-card>
                <ion-card-header>
                  <section
                    style="display: flex; justify-content: space-between"
                  >
                    <div>
                      <ion-card-title>{{ integration.name }}</ion-card-title>
                    </div>

                    <div v-if="integration.state == 'available'">
                      <ion-button size="small">Instalar</ion-button>
                    </div>

                    <div v-if="integration.state == 'installed'">
                      <ion-button size="small" color="danger"
                        >Remover</ion-button
                      >
                    </div>
                  </section>

                  <section
                    v-for="category in integration.categories"
                    :key="category"
                    style="display: flex"
                  >
                    <ion-chip>{{ category }}</ion-chip>
                  </section>
                </ion-card-header>

                <ion-card-content>
                  <ion-accordion-group>
                    <ion-accordion>
                      <ion-item slot="header">
                        <ion-label>Descripción</ion-label>
                      </ion-item>

                      <div slot="content" class="ion-padding">
                        <p>{{ integration.description }}</p>
                        <ion-item lines="none">
                          <ion-button
                            v-if="integration.url"
                            slot="end"
                            fill="clear"
                            @click="openUrl({ url: integration.url })"
                            >Mas información.</ion-button
                          >
                        </ion-item>
                      </div>
                    </ion-accordion>
                  </ion-accordion-group>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
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
      <!-- end modals -->

      <!-- popovers -->
      <!-- popover main options -->
      <ion-popover
        :is-open="isOpenPopOverMainOptions"
        :event="eventPopOverMainOptions"
        :dismiss-on-select="true"
        @did-dismiss="isOpenPopOverMainOptions = false"
      >
        <ion-content>
          <!-- button modal help integrations -->
          <ion-item id="open-modal-help-integrations" button lines="none">
            <ion-icon slot="start" :icon="helpCircleOutline"></ion-icon>
            <ion-label class="ion-text-wrap">Ayuda</ion-label>
          </ion-item>
        </ion-content>
      </ion-popover>
      <!-- end popovers -->
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
  isPlatform,
} from "@ionic/vue";
import {
  closeOutline,
  ellipsisVerticalOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { ref } from "vue";

interface Element {
  name: string;
  url?: string;
  description: string;
  state: "installed" | "available";
  categories: string[];
}

const pageTitle = "Integraciones";
const integrations = [
  {
    name: "WakaTime",
    url: "https://wakatime.com/",
    description:
      "Wakatime es una herramienta que se integra con tu editor de código y te permite hacer un seguimiento automático del tiempo que pasas escribiendo código. Wakatime te muestra cuánto tiempo pasas en cada proyecto y en cada archivo, así como cuánto tiempo pasas escribiendo en cada lenguaje de programación.",
    state: "installed",
    categories: ["Productividad"],
  },
  {
    name: "Todoist",
    url: "https://todoist.com",
    description:
      "Todoist es una herramienta de productividad que te permite organizar tus proyectos profesionales y personales. Puedes recopilar tareas, organizar proyectos y planificar tu día. Todoist te permite organizar tus tareas por proyectos y asignar tareas y subtareas a cada uno. Puedes usarlo tanto a nivel personal, con proyectos como “compras” o “recordatorios”, pero también puedes gestionar tus proyectos profesionales, compartiendo las tareas con otros usuarios.",
    state: "available",
    categories: ["Productividad"],
  },
  {
    name: "Google Calendar",
    url: "https://calendar.google.com",
    description:
      "Google Calendar es un calendario online que ofrece Google gratuitamente a sus usuarios y que combina agenda, calendario electrónico, creador de eventos y otras funciones que nos facilita mejorar la productividad y compartirlos con nuestros contactos. Permite sincronizarlo con los contactos de Gmail de manera que podamos invitarlos y compartir eventos..",
    state: "available",
    categories: ["Productividad"],
  },
  {
    name: "Google Fit",
    description:
      "Google Fit es una aplicación oficial de Google destinada a mejorar nuestra salud de una forma muy simple: informándonos de la actividad física que llevamos a cabo a diario. Los usuarios tendrán que marcarse una serie de objetivos diarios o semanales. La aplicación registra la actividad física que realizamos y nos proporciona datos como calorías, distancia recorrida y pasos realizados. También podemos ver nuestras estadísticas y marcarnos objetivos diarios.",
    state: "available",
    categories: ["Salud"],
  },
] as Array<Element>;
const isOpenPopOverMainOptions = ref(false);
const eventPopOverMainOptions = ref(null as CustomEvent | null);

// functions
function openUrl(params: { url: string }): void {
  const { url } = params;
  window.open(url, "_blank");
}
</script>
