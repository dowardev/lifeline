<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

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
// 1. Imports (ionic/vue/ionicons)
import {
  IonContent,
  popoverController,
  IonItem,
  IonButton,
  IonLabel,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { ref } from "vue";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
type Option = "delete" | "edit";
type Role = "confirm" | "cancel";

// 6. Vars and const
let progress = ref(0);

const showDeleteOption = ref(true);
const intervalDeleteId = ref(null as any);

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function selectOption(params: { option: Option }): void {
  const option = params.option;
  if (option == "delete") deleteOption();
  if (option == "edit") editOption();
}

function deleteOption(): void {
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

async function cancelDelete(): Promise<void> {
  clearInterval(intervalDeleteId.value);
  await closeModal({ data: { option: "delete" }, role: "cancel" });
}

async function closeModal(params: { data: { option: Option }; role: Role }): Promise<void> {
  const data = params.data;
  const role = params.role;
  await popoverController.dismiss(data, role);
}

async function editOption(): Promise<void> {
  await closeModal({
    data: { option: "edit" },
    role: "confirm",
  });
}
</script>
