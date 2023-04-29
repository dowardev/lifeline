<template>
  <ion-content>
    <div>
      <!-- reminders -->
      <ion-button fill="clear" @click="selectOption({ option: 'add' })">
        <ion-icon :icon="addOutline"> </ion-icon>
      </ion-button>

      <!-- reminders -->
      <ion-button fill="clear" @click="selectOption({ option: 'reminders' })">
        <ion-icon :icon="timeOutline"> </ion-icon>
      </ion-button>

      <!-- tags -->
      <!-- <ion-button fill="clear"> -->
      <!--   <ion-icon :icon="pricetagOutline" color="danger"> </ion-icon> -->
      <!-- </ion-button> -->

      <!-- cancel -->
      <div style="float: right">
        <ion-button
          fill="clear"
          color="danger"
          @click="selectOption({ option: 'remove' })"
        >
          <ion-icon :icon="closeOutline"> </ion-icon>
        </ion-button>
      </div>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { IonContent, popoverController, IonButton } from "@ionic/vue";
import { addOutline, closeOutline, timeOutline } from "ionicons/icons";

type Option = "add" | "remove" | "reminders";
type Role = "confirm" | "cancel";

// functions;
const selectOption = (params: { option: Option }) => {
  const option = params.option;
  if (option == "add") addOption();
  if (option == "remove") removeOption();
  if (option == "reminders") reminderOption();
};

const addOption = async () => {
  await closeModal({
    data: { option: "add" },
    role: "confirm",
  });
};

const removeOption = async () => {
  await closeModal({
    data: { option: "remove" },
    role: "confirm",
  });
};

const closeModal = async (params: { data: { option: Option }; role: Role }) => {
  const data = params.data;
  const role = params.role;
  await popoverController.dismiss(data, role);
};

const reminderOption = async () => {
  await closeModal({
    data: { option: "reminders" },
    role: "confirm",
  });
};
</script>
