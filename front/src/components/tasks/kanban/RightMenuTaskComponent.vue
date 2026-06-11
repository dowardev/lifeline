<template>
  <ion-content>
    <!-- edit -->
    <section>
      <ion-item lines="none" button @click="selectOption({ option: 'edit' })">
        <ion-icon slot="start" :icon="createOutline"> </ion-icon>
        <ion-label>Editar</ion-label>
      </ion-item>
    </section>

    <!-- move other space-->
    <section>
      <ion-item lines="none" button>
        <ion-icon slot="start" :icon="arrowForwardOutline"> </ion-icon>

        <ion-select
          placeholder="Mover a"
          ok-text="Confirmar"
          cancel-text="Cancelar"
          @ion-change="
            selectOption({
              option: 'moveElement',
              newcolumn: $event.detail.value,
            })
          "
        >
          <ion-select-option
            v-if="props.currentColumn != 'pending'"
            value="pending"
            >Pendiente</ion-select-option
          >
          <ion-select-option
            v-if="props.currentColumn != 'progress'"
            value="progress"
            >En proceso</ion-select-option
          >
          <ion-select-option
            v-if="props.currentColumn != 'finalized'"
            value="finalized"
            >Finalizado</ion-select-option
          >
        </ion-select>
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
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";
import {
  arrowForwardOutline,
  createOutline,
  trashOutline,
} from "ionicons/icons";
import { ref } from "vue";

type Option = "delete" | "edit" | "moveElement";
type Role = "confirm" | "cancel";

const props = defineProps({
  currentColumn: { default: "pending", type: String, required: true },
});

let progress = ref(0);

const showDeleteOption = ref(true);
const intervalDeleteId = ref(null as any);

// funtions
function selectOption(params: {
  option: Option;
  newcolumn?: "pending" | "progress" | "finalized";
}) {
  const { option, newcolumn } = params;
  if (option == "delete") deleteOption();
  if (option == "edit") editOption();
  if (option == "moveElement") moveElementOption({ columnName: newcolumn });
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

async function closeModal(params: {
  data: { option: Option; newcolumn?: "pending" | "progress" | "finalized" };
  role: Role;
}) {
  const { data, role } = params;

  await popoverController.dismiss(data, role);
}

async function editOption() {
  await closeModal({
    data: { option: "edit" },
    role: "confirm",
  });
}

async function moveElementOption(params: {
  columnName?: "pending" | "progress" | "finalized";
}) {
  const { columnName } = params;

  await closeModal({
    data: { option: "moveElement", newcolumn: columnName },
    role: "confirm",
  });
}
</script>
