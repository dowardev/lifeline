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

<script lang="ts">
import {
  IonItem,
  IonList,
  IonInput,
  IonReorder,
  IonReorderGroup,
} from "@ionic/vue";
import {
  addOutline,
  closeOutline,
  pricetagsOutline,
  saveOutline,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "ListComponent",
  components: {
    IonItem,
    IonList,
    IonInput,
    IonReorder,
    IonReorderGroup,
  },

  setup() {
    const isAlertTrashOpenRef = ref(false);
    const setOpenAlertTrash = (state: boolean) =>
      (isAlertTrashOpenRef.value = state);

    const isAlertStorageOpenRef = ref(false);
    const setOpenAlertStorage = (state: boolean) =>
      (isAlertStorageOpenRef.value = state);

    const handleReorder = (event: CustomEvent) => {
      // The `from` and `to` properties contain the index of the item
      // when the drag started and ended, respectively
      console.log(
        "Dragged from index",
        event.detail.from,
        "to",
        event.detail.to
      );

      // Finish the reorder and position the item in the DOM based on
      // where the gesture ended. This method can also be called directly
      // by the reorder group
      event.detail.complete();
    };

    return {
      pageTitle: "Home",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      isAlertTrashOpenRef,
      setOpenAlertTrash,
      saveOutline,
      isAlertStorageOpenRef,
      setOpenAlertStorage,
      addOutline,
      handleReorder,
      closeOutline,
    };
  },

  data() {
    return {
      listElements: [{ value: "" }],
    };
  },
});
</script>
