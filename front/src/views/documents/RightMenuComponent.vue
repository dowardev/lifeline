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
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  popoverController,
} from "@ionic/vue";
import { trashOutline } from "ionicons/icons";
import { ref } from "vue";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const progress = ref(0);
const showDeleteOption = ref(true);
const intervalDeleteId = ref<ReturnType<typeof setInterval>>(0 as any);

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
type Option = "delete";
type Role = "confirm" | "cancel";

const selectOption = (params: { option: Option }): void => {
  const option = params.option;
  if (option == "delete") deleteOption();
};

const deleteOption = (): void => {
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

const cancelDelete = async (): Promise<void> => {
  clearInterval(intervalDeleteId.value);
  await closeModal({ data: { option: "delete" }, role: "cancel" });
};

const closeModal = async (params: {
  data: { option: Option };
  role: Role;
}): Promise<void> => {
  const data = params.data;
  const role = params.role;
  await popoverController.dismiss(data, role);
};
</script>
