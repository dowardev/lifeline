<template>
  <ion-list>
    <!-- The reorder gesture is disabled by default, enable it to drag and drop items -->
    <ion-reorder-group
      :disabled="false"
      @ion-item-reorder="handleReorder($event)"
    >
      <ion-item v-for="(element, index) in listElements" :key="index">
        <ion-reorder slot="start"></ion-reorder>

        <ion-input v-model="element.value" placeholder="Meditar">{{
          element.value
        }}</ion-input>

        <ion-button
          slot="end"
          fill="clear"
          @click="listElements.splice(index, 1)"
        >
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-item>
    </ion-reorder-group>
  </ion-list>

  <ion-button
    expand="full"
    fill="clear"
    @click="listElements.push({ value: '' })"
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

const handleReorder = (event: CustomEvent) => {
  console.log("Dragged from index", event.detail.from, "to", event.detail.to);
  event.detail.complete();
};

const listElements = [{ value: "" }];
</script>
