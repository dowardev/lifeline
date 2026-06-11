<template>
  <ion-content>
    <!-- edit -->
    <section>
      <ion-item lines="none" button @click="selectOption({ option: 'edit' })">
        <ion-icon slot="start" :icon="createOutline"> </ion-icon>
        <ion-label>Editar</ion-label>
      </ion-item>
    </section>

    <!-- delete -->
    <section>
      <ion-item
        v-if="showDeleteOption"
        lines="none"
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
    </section>
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
import { createOutline, trashOutline } from "ionicons/icons";
import { ref } from "vue";

type Option = "delete" | "edit";
type Role = "confirm" | "cancel";

let progress = ref(0);

const showDeleteOption = ref(true);
const intervalDeleteId = ref(null as any);

// funtions
function selectOption(params: { option: Option }) {
  const option = params.option;
  if (option == "delete") deleteOption();
  if (option == "edit") editOption();
}

function deleteOption() {
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
}

async function cancelDelete() {
  clearInterval(intervalDeleteId.value);
  await closeModal({ data: { option: "delete" }, role: "cancel" });
}

async function closeModal(params: { data: { option: Option }; role: Role }) {
  const data = params.data;
  const role = params.role;
  await popoverController.dismiss(data, role);
}

async function editOption() {
  await closeModal({
    data: { option: "edit" },
    role: "confirm",
  });
}
</script>
