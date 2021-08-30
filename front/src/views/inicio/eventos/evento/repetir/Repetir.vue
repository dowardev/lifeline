<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Repetir</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-item>
            <ion-label>Frecuencia</ion-label>
            <ion-select v-model="frecuencySelect">
              <ion-select-option value="unico">Evento unico</ion-select-option>
              <ion-select-option value="diariamente"
                >Diariamente</ion-select-option
              >
              <ion-select-option value="semanalmente"
                >Semanalmente</ion-select-option
              >
              <ion-select-option value="mensualmente"
                >Mensualmente</ion-select-option
              >
              <ion-select-option value="anualmente"
                >Anualmente</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row v-if="frecuencySelect != 'unico'">
        <ion-col size="12">
          <ion-item>
            <ion-label>Cada</ion-label>
            <ion-select value="1">
              <ion-select-option
                v-for="item in frecuency"
                :key="item"
                :value="item"
                >{{ item }}</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-col>
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline } from "ionicons/icons";
export default defineComponent({
  name: "Repetir",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const frecuency = [];
    for (let i = 1; i <= 50; i++) {
      frecuency.push(i.toString());
    }
    return { chevronBackOutline, frecuency };
  },
  data() {
    return {
      frecuencySelect: "unico",
    };
  },
});
</script>
