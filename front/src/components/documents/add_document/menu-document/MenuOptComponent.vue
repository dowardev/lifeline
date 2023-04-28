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
          <ion-label>Basico</ion-label>
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
  </ion-content>

  <section
    v-if="optionSelected == 'share'"
    :class="{
      'ion-fade-in': optionSelected == 'share',
    }"
  >
    <ShareComponent
      :url="useDocument().getUserDocument({ documentId: documentId })?.url"
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
import {
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
  popoverController,
  modalController,
} from "@ionic/vue";
import {
  closeOutline,
  moveOutline,
  saveOutline,
  shareSocialOutline,
  timeOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import { OptionsMainMenuDocument } from "../../../../utils/types";
import { useDocument } from "../../../../composables/useDocument";
import { isPlatform } from "@ionic/vue";
import ShareComponent from "./share/ShareComponent.vue";
import RemindersComponent from "./reminder/RemindersComponent.vue";

const props = defineProps({ documentId: { default: "", type: String } });

const pageTitle = "Opciones";

let optionSelected = "none";

// functions
const closePage = async (params: {
  role: "confirm" | "cancel";
  data?: { option: OptionsMainMenuDocument; data?: any };
}) => {
  const role = params.role;
  const data = params.data;
  const modal = await modalController.getTop();

  if (modal) await modalController.dismiss(data, role);
  else await popoverController.dismiss(data, role);
};

const selectOption = (params: { option: OptionsMainMenuDocument }) => {
  const option = params.option;

  if (option == "save") saveOption();
  if (option == "order") orderElementsOption();
  if (option == "share") toggleShareOption();
  if (option == "reminder") toggleReminderOption();
};

const saveOption = async () => {
  await closePage({ role: "confirm", data: { option: "save" } });
};

const orderElementsOption = async () => {
  await closePage({ role: "confirm", data: { option: "order" } });
};

const toggleShareOption = () => {
  if (optionSelected == "none") optionSelected = "share";
  if (optionSelected == "share") optionSelected = "none";
};

const toggleReminderOption = () => {
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
