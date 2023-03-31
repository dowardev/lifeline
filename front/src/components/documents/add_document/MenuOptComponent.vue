<template>
  <ion-header :translucent="true" class="ion-no-border" mode="ios">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal({ role: 'cancel' })">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-list v-if="isPlatform('mobile') || isPlatform('mobileweb')">
      <ion-list-header>
        <ion-label>Basico</ion-label>
      </ion-list-header>

      <div style="display: flex; justify-content: space-around">
        <!-- save -->
        <ion-button
          fill="clear"
          size="large"
          class="mainButtons"
          @click="selectOption({ option: 'save' })"
        >
          <ion-icon :icon="saveOutline"></ion-icon>
        </ion-button>

        <!-- reminders -->
        <ion-button
          fill="clear"
          class="mainButtons"
          size="large"
          @click="openModalReminderDocument()"
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
              useDocument().getUserDocument({ documentId: documentId })
                ?.elements ?? []
            ).length <= 1
          "
          @click="selectOption({ option: 'order' })"
        >
          <ion-icon :icon="moveOutline"></ion-icon>
        </ion-button>
      </div>
    </ion-list>

    <!-- edition -->
    <ion-list>
      <ion-list-header>
        <ion-label>Edicion</ion-label>
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
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  modalController,
  IonAccordion,
  IonAccordionGroup,
} from "@ionic/vue";
import {
  closeOutline,
  move,
  moveOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import DocumentReminderComponent from "./DocumentReminderComponent.vue";
import { OptionsMainMenuDocument } from "../../../utils/types";
import { useDocument } from "../../../composables/useDocument";
import { isPlatform } from "@ionic/vue";

export default defineComponent({
  name: "MenuOptComponent",

  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonAccordion,
    IonAccordionGroup,
  },

  props: { documentId: { default: "", type: String } },

  setup() {
    return {
      closeOutline,
      pageTitle: "Opciones del documento",
      saveOutline,
      moveOutline,
      timeOutline,
      useDocument,
      isPlatform,
    };
  },

  methods: {
    async closeModal(params: {
      role: "confirm" | "cancel";
      data?: { option: OptionsMainMenuDocument; data?: any };
    }) {
      const role = params.role;
      const data = params.data;
      return await modalController.dismiss(data, role);
    },

    async openModalReminderDocument() {
      const modal = await modalController.create({
        component: DocumentReminderComponent,
        initialBreakpoint: 0.75,
        breakpoints: [0, 0.25, 0.5, 0.75],
      });
      modal.present();
    },

    selectOption(params: { option: OptionsMainMenuDocument }) {
      const option = params.option;

      if (option == "save") this.saveOption();
      if (option == "order") this.orderElementsOption();
    },

    async saveOption() {
      await this.closeModal({ role: "confirm", data: { option: "save" } });
    },

    async orderElementsOption() {
      await this.closeModal({ role: "confirm", data: { option: "order" } });
    },
  },
});
</script>

<style scoped>
.mainButtons {
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
}
</style>
