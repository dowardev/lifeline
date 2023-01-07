<template>
  <!-- nota -->
  <ion-item>
    <ion-textarea placeholder="Nota"></ion-textarea>
  </ion-item>

  <!-- time -->
  <ion-item>
    <ion-button id="click-trigger-calendar" size="small" fill="clear">
      <ion-icon :icon="timeOutline"></ion-icon>
    </ion-button>
    <ion-popover
      trigger="click-trigger-calendar"
      trigger-action="click"
      style="max-height: 60%"
    >
      <ion-content>
        <ion-list>
          <ion-list-header>
            <ion-label>Inicio</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-datetime></ion-datetime>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Final</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-datetime></ion-datetime>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>

    <!-- tags -->
    <ion-button id="click-trigger-tags" size="small" fill="clear">
      <ion-icon :icon="pricetagsOutline"></ion-icon>
    </ion-button>
    <ion-popover trigger="click-trigger-tags" trigger-action="click">
      <ion-content>
        <ion-item>
          <ion-input placeholder="Nombre de la etiqueta"></ion-input>
        </ion-item>

        <div class="ion-padding-start" style="display: flex">
          <div class="ion-padding-end">
            <ion-text color="primary">ee</ion-text>
          </div>

          <div class="ion-padding-end">
            <ion-text color="primary">esse</ion-text>
          </div>
        </div>
      </ion-content>
    </ion-popover>
  </ion-item>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonPopover,
  IonDatetime,
  IonLabel,
  IonList,
} from "@ionic/vue";
import {
  pricetagsOutline,
  saveOutline,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "NoteComponent",
  components: {
    IonContent,
    IonItem,
    IonPopover,
    IonDatetime,
    IonLabel,
    IonList,
  },

  setup() {
    const isAlertTrashOpenRef = ref(false);
    const setOpenAlertTrash = (state: boolean) =>
      (isAlertTrashOpenRef.value = state);

    const isAlertStorageOpenRef = ref(false);
    const setOpenAlertStorage = (state: boolean) =>
      (isAlertStorageOpenRef.value = state);
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
    };
  },
});
</script>
