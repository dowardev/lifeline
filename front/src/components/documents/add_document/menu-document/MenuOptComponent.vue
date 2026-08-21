<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <!-- FIX: remove mobile devices -->
  <ion-header
    v-if="optionSelected == 'none'"
    :translucent="true"
    class="ion-no-border"
    mode="ios"
  >
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closePage({ role: 'cancel' })">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content
    :fullscreen="!isPlatform('desktop') ? true : false"
    :class="{
      'ion-fade-in': optionSelected == 'none',
    }"
  >
    <section v-if="optionSelected == 'none'">
      <ion-list>
        <ion-list-header>
          <ion-label>Básico</ion-label>
        </ion-list-header>

        <div style="display: flex; justify-content: space-evenly">
          <!-- reminders -->
          <ion-button
            fill="clear"
            class="mainButtons"
            size="large"
            @click="selectOption({ option: 'reminder' })"
          >
            <ion-icon :icon="timeOutline"></ion-icon>
          </ion-button>

          <!-- order elements -->
          <ion-button
            fill="clear"
            class="mainButtons"
            size="large"
            :disabled="
              (
                documentController.getUserDocument({
                  documentId: props.documentId,
                })?.elements ?? []
              ).length <= 1
            "
            @click="selectOption({ option: 'order' })"
          >
            <ion-icon :icon="moveOutline"></ion-icon>
          </ion-button>

          <!-- share -->
          <ion-button
            fill="clear"
            class="mainButtons"
            size="large"
            @click="selectOption({ option: 'share' })"
          >
            <ion-icon :icon="shareSocialOutline"></ion-icon>
          </ion-button>
        </div>
      </ion-list>

      <!-- edition -->
      <ion-list>
        <ion-list-header>
          <ion-label>Edición</ion-label>
        </ion-list-header>

        <!-- history -->
        <ion-accordion-group>
          <ion-accordion value="history">
            <ion-item slot="header">
              <ion-label>Historial</ion-label>
            </ion-item>

            <div slot="content" class="ion-padding">
              <ion-item>
                <ion-label>Cambio 1</ion-label>
                <ion-button fill="clear">Aplicar</ion-button>
              </ion-item>

              <ion-item>
                <ion-label>Cambio 2</ion-label>
                <ion-button fill="clear">Aplicar</ion-button>
              </ion-item>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </ion-list>
    </section>
  </ion-content>

  <section
    v-if="optionSelected == 'share'"
    :class="{
      'ion-fade-in': optionSelected == 'share',
    }"
  >
    <ShareComponent
      :url="documentController.getUserDocument({ documentId: documentId })?.url"
      @close-share="toggleShareOption()"
    />
  </section>

  <section
    v-if="optionSelected == 'reminder'"
    :class="{
      'ion-fade-in': optionSelected == 'reminder',
    }"
  >
    <RemindersComponent @close-reminders="toggleReminderOption()" />
  </section>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
  isPlatform,
  modalController,
  popoverController,
} from "@ionic/vue";
import {
  closeOutline,
  moveOutline,
  shareSocialOutline,
  timeOutline,
} from "ionicons/icons";

// 2. Controllers / Composables
import { DocumentController } from "@/controllers/documentController";
const documentController = new DocumentController();

// 3. Components
import ShareComponent from "./share/ShareComponent.vue";
import RemindersComponent from "./reminder/RemindersComponent.vue";

// 4. Interface and types imports
import type { OptionsMainMenuDocument } from "../../../../utils/types";

// 5. Main (props, emits)
const props = defineProps({ documentId: { default: "", type: String } });

// 6. Vars and const
const pageTitle = "Opciones";

let optionSelected = "none";

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
const closePage = async (params: {
  role: "confirm" | "cancel";
  data?: { option: OptionsMainMenuDocument; data?: any };
}): Promise<void> => {
  const role = params.role;
  const data = params.data;
  const modal = await modalController.getTop();

  if (modal) await modalController.dismiss(data, role);
  else await popoverController.dismiss(data, role);
};

const selectOption = (params: { option: OptionsMainMenuDocument }): void => {
  const option = params.option;

  if (option == "save") saveOption();
  if (option == "order") orderElementsOption();
  if (option == "share") toggleShareOption();
  if (option == "reminder") toggleReminderOption();
};

const saveOption = async (): Promise<void> => {
  await closePage({ role: "confirm", data: { option: "save" } });
};

const orderElementsOption = async (): Promise<void> => {
  await closePage({ role: "confirm", data: { option: "order" } });
};

const toggleShareOption = (): void => {
  if (optionSelected == "none") optionSelected = "share";
  if (optionSelected == "share") optionSelected = "none";
};

const toggleReminderOption = (): void => {
  if (optionSelected == "none") optionSelected = "reminder";
  if (optionSelected == "reminder") optionSelected = "none";
};
</script>

<style scoped>
.mainButtons {
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
}

.ion-fade-in {
  animation: fadeIn 0.3s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
