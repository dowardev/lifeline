<template>
  <ion-page>
    <ion-header collapse="fade" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :fullscreen="true"
      :scroll-events="true"
      @ion-scroll="handleScroll"
    >
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div
        style="
          position: sticky;
          top: 0;
          z-index: 3;
          ref=refPrueba
        "
        class="ion-padding-start ion-padding-end"
        :class="{ prueba1: positionScroll == 0, prueba2: positionScroll > 0 }"
      >
        <ion-row :class="{ center: screenWidth >= 768 }">
          <ion-col size-xs="12" size-md="6">
            <div style="display: flex; justify-content: space-between">
              <div style="width: 100%">
                <ion-input
                  label="Agregar tarea"
                  placeholder="Comprar pan"
                  :fill="positionScroll > 10 ? 'outline' : 'solid'"
                  label-placement="floating"
                ></ion-input>
              </div>

              <div class="center-vertical ion-padding-start">
                <ion-button slot="end"
                  ><ion-icon :icon="addOutline"></ion-icon
                ></ion-button>
              </div>
            </div>
          </ion-col>
        </ion-row>

        <ion-row :class="{ center: screenWidth >= 768 }">
          <ion-col size-xs="12" size-md="6">
            <ion-item lines="none" style="--background: transparent">
              <ion-select interface="popover" :value="listSelected">
                <ion-select-option value="tray"
                  >Bandeja de entrada</ion-select-option
                >
              </ion-select>

              <div slot="end">
                <ion-button fill="clear"
                  ><ion-icon :icon="appsOutline"></ion-icon
                ></ion-button>
                <ion-button fill="clear"
                  ><ion-icon :icon="albumsOutline"></ion-icon
                ></ion-button>
              </div>
            </ion-item>
          </ion-col>
        </ion-row>
      </div>

      <ion-row
        :class="{ center: screenWidth >= 768 }"
        class="ion-padding-start ion-padding-end"
      >
        <ion-col size-xs="12" size-md="6">
          <ion-item
            v-for="(task, indexTask) in tasks"
            :key="task.name"
            class="ion-padding-start"
            button
            lines="full"
            @mouseenter="showButtonsOptionTODO = indexTask"
            @mouseleave="showButtonsOptionTODO = -1"
            @click="showButtonsOptionTODO = indexTask"
          >
            <ion-label>{{ task.name }} </ion-label>
            <ion-button v-if="showButtonsOptionTODO === indexTask" fill="clear"
              ><ion-icon :icon="trashOutline"></ion-icon
            ></ion-button>
          </ion-item>
        </ion-col>
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonInput,
} from "@ionic/vue";
import {
  addOutline,
  albumsOutline,
  appsOutline,
  trashOutline,
} from "ionicons/icons";
import { onMounted, ref, watch } from "vue";

const pageTitle = "Tareas";
const listSelected = ref("tray");
const tasks = ref(Array<{ name: string }>());
const showButtonsOptionTODO = ref(-1);

const fillPrueba = ref("solid" as "solid" | "outline" | undefined);
const positionScroll = ref(0);
const handleScroll = (event: CustomEvent) => {
  positionScroll.value = event.detail.scrollTop;
};
const screenWidth = ref(window.innerWidth);

// mounted
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

// watch
const handleResize = () => {
  screenWidth.value = window.innerWidth;
};
</script>

<style scoped>
.prueba1 {
  background: var(--ion-background-color);
}
.prueba2 {
  background: var(--ion-color-step-50);
}
</style>
