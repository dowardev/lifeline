<template>
  <ion-content>
    <ion-item
      v-if="showDeleteOption"
      button
      @click="selectOption({ option: 'delete' })"
    >
      <ion-icon slot="start" :icon="trashOutline" color="danger"> </ion-icon>
      <ion-label>Eliminar</ion-label>
    </ion-item>

    <ion-item v-if="!showDeleteOption" button>
      <ion-progress-bar :value="progress"></ion-progress-bar>
      <ion-button slot="end" fill="clear" @click="cancelDelete()"
        >Cancelar</ion-button
      >
    </ion-item>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent,
  popoverController,
  IonItem,
  IonButton,
  IonLabel,
} from "@ionic/vue";
import { trashOutline } from "ionicons/icons";
import { ref } from "vue";

type Option = "delete";
type Role = "confirm" | "cancel";

// refs
const progress = ref(0);
const showDeleteOption = ref(true);
const intervalDeleteId = ref(0);

const selectOption = (params: { option: Option }) => {
  const option = params.option;
  if (option == "delete") deleteOption();
};

const deleteOption = () => {
  showDeleteOption.value = false;
  intervalDeleteId.value = setInterval(() => {
    progress.value += 0.01;
    if (progress.value > 1) {
      clearInterval(intervalDeleteId.value);
      setTimeout(async () => {
        progress.value = 0;
        await closeModal({
          data: { option: "delete" },
          role: "confirm",
        });
      }, 1000);
    }
  }, 30);
};

const cancelDelete = async () => {
  clearInterval(intervalDeleteId.value);
  await closeModal({ data: { option: "delete" }, role: "cancel" });
};

const closeModal = async (params: { data: { option: Option }; role: Role }) => {
  const data = params.data;
  const role = params.role;
  await popoverController.dismiss(data, role);
};
</script>
