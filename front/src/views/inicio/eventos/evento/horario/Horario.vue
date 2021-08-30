<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Seleccionar horario</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="4">
          <ion-item>
            <ion-select v-model="hourSelected">
              <ion-select-option
                v-for="hour in hours"
                :key="hour"
                :value="hour"
                >{{ hour }}</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-col>
        <ion-col size="4">
          <ion-item>
            <ion-select v-model="minuteSelected">
              <ion-select-option
                v-for="minute in minutes"
                :key="minute"
                :value="minute"
                >{{ minute }}</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-col>
        <ion-col size="4">
          <ion-item>
            <ion-select v-model="amSelected">
              <ion-select-option v-for="item in am" :key="item" :value="item">{{
                item
              }}</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12">
          <ion-card>
            <ion-card-header>
              Para que puedas decidir mejor a continuacion se mostraran los
              eventos, tareas y notas a los cuales se les ahiga asignado un
              recordatorio
            </ion-card-header>
            <ion-card-content>
              <ion-item lines="none">
                <ion-checkbox slot="start"></ion-checkbox>
                <ion-label>No volver a mostrar</ion-label>
              </ion-item>
              <ion-button fill="clear" expand="full">
                Aceptar
              </ion-button>
            </ion-card-content>
          </ion-card>
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
import { chevronBackOutline, saveOutline } from "ionicons/icons";
export default defineComponent({
  name: "Horario",
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
    const hours = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ];
    const minutes = ["00"];
    for (let i = 1; i <= 60; i++) {
      minutes.push(i.toString());
    }
    const am = ["am", "pm"];
    return { chevronBackOutline, hours, minutes, am, saveOutline };
  },
  data() {
    return { hourSelected: "12", minuteSelected: "00", amSelected: "am" };
  },
});
</script>
