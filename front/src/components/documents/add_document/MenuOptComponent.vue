<template>
  <ion-header
    v-if="optionSelected == 'none'"
    :translucent="true"
    class="ion-no-border"
    mode="ios"
  >
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closePopover({ role: 'cancel' })">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <section v-if="optionSelected == 'none'">
      <ion-list>
        <ion-list-header>
          <ion-label>Basico</ion-label>
        </ion-list-header>

        <div style="display: flex; justify-content: space-evenly">
          <!-- reminders -->
          <ion-button
            fill="clear"
            class="mainButtons"
            :size="
              isPlatform('mobile') || isPlatform('mobileweb')
                ? 'small'
                : 'large'
            "
            @click="selectOption({ option: 'reminder' })"
          >
            <ion-icon :icon="timeOutline"></ion-icon>
          </ion-button>

          <!-- order elements -->
          <ion-button
            fill="clear"
            class="mainButtons"
            :size="
              isPlatform('mobile') || isPlatform('mobileweb')
                ? 'small'
                : 'large'
            "
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

          <!-- share -->
          <ion-button
            fill="clear"
            class="mainButtons"
            :size="
              isPlatform('mobile') || isPlatform('mobileweb')
                ? 'small'
                : 'large'
            "
            @click="selectOption({ option: 'share' })"
          >
            <ion-icon :icon="shareSocialOutline"></ion-icon>
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
    </section>

    <section v-if="optionSelected == 'share'">
      <ShareComponent
        :url="useDocument().getUserDocument({ documentId: documentId })?.url"
        @close-share="toggleShareOption()"
      />
    </section>

    <section v-if="optionSelected == 'reminder'">
      <RemindersComponent @close-reminders="toggleReminderOption()" />
    </section>
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
popoverController,
} from "@ionic/vue";
import {
  closeOutline,
  moveOutline,
  saveOutline,
  shareSocialOutline,
  timeOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import DocumentReminderComponent from "./DocumentReminderComponent.vue";
import { OptionsMainMenuDocument } from "../../../utils/types";
import { useDocument } from "../../../composables/useDocument";
import { isPlatform } from "@ionic/vue";
import ShareComponent from "./ShareComponent.vue";
import RemindersComponent from "./RemindersComponent.vue";

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
    ShareComponent,
    RemindersComponent,
  },

  props: { documentId: { default: "", type: String } },

  setup() {
    return {
      closeOutline,
      pageTitle: "Opciones",
      saveOutline,
      moveOutline,
      timeOutline,
      useDocument,
      isPlatform,
      shareSocialOutline,
    };
  },

  data() {
    return {
      optionSelected: "none" as OptionsMainMenuDocument,
    };
  },

  methods: {
    async closePopover(params: {
      role: "confirm" | "cancel";
      data?: { option: OptionsMainMenuDocument; data?: any };
    }) {
      const role = params.role;
      const data = params.data;
      return await popoverController.dismiss(data, role);
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
      if (option == "share") this.toggleShareOption();
      if (option == "reminder") this.toggleReminderOption();
    },

    async saveOption() {
      await this.closePopover({ role: "confirm", data: { option: "save" } });
    },

    async orderElementsOption() {
      await this.closePopover({ role: "confirm", data: { option: "order" } });
    },

    toggleShareOption() {
      const optionSelected = this.optionSelected;

      if (optionSelected == "none") this.optionSelected = "share";
      if (optionSelected == "share") this.optionSelected = "none";
    },

    toggleReminderOption() {
      const optionSelected = this.optionSelected;

      if (optionSelected == "none") this.optionSelected = "reminder";
      if (optionSelected == "reminder") this.optionSelected = "none";
    },
  },
});
</script>

<style scoped>
.mainButtons {
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
}
</style>
