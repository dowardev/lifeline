<template>
  <ion-list>
    <ion-reorder-group
      :disabled="false"
      @ion-item-reorder="handleReorder($event)"
    >
      <ion-item v-for="(element, index) in todoElements" :key="index">
        <ion-reorder slot="start"></ion-reorder>

        <ion-checkbox slot="start" :cheked="element.isChecked"></ion-checkbox>

        <ion-input v-model="element.value" placeholder="Meditar">{{
          element.value
        }}</ion-input>

        <ion-button
          slot="end"
          fill="clear"
          @click="todoElements.splice(index, 1)"
        >
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-item>
    </ion-reorder-group>
  </ion-list>

  <ion-button
    expand="full"
    fill="clear"
    @click="todoElements.push({ value: '', isChecked: false })"
  >
    <ion-icon :icon="addOutline"></ion-icon>
  </ion-button>
</template>

<script setup lang="ts">
import {
  IonItem,
  IonList,
  IonInput,
  IonReorder,
  IonReorderGroup,
} from "@ionic/vue";
import { addOutline, closeOutline } from "ionicons/icons";

const todoElements = [{ value: "", isChecked: false }];

// functions
const handleReorder = (event: CustomEvent) => {
  console.log("Dragged from index", event.detail.from, "to", event.detail.to);
  event.detail.complete();
};
</script>
