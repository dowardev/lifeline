<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="save()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Zona horaria</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          :debounce="500"
          @ion-change="search($event.detail.value!)"
        >
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="searchResult.length > 0">
        <ion-item
          v-for="result in searchResult"
          :key="result"
          button
          @click="save({ timeZone: result })"
        >
          <ion-label>{{ result }}</ion-label>
        </ion-item>
      </div>
      <div v-if="searchResult.length == 0">
        <ion-item
          v-for="result in [timeZones][0].names"
          :key="result"
          button
          @click="save({ timeZone: result })"
        >
          <ion-label>{{ result }}</ion-label>
        </ion-item>
      </div>
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
  IonSearchbar,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { getAllTimeZonesNames as getAllTimeZonesNamesService } from "../services/system";
import { closeOutline } from "ionicons/icons";

export default defineComponent({
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSearchbar,
  },

  setup() {
    return { closeOutline };
  },

  data() {
    return {
      timeZones: getAllTimeZonesNamesService(),
      searchResult: [] as Array<string>,
      timeZone: "",
    };
  },

  methods: {
    search(word: string) {
      this.searchResult.length = 0;
      [this.timeZones][0].names.forEach((element) => {
        if (element.toLowerCase().indexOf(word.toLowerCase()) >= 0) {
          this.searchResult.push(element);
        }
      });
    },

    save(params?: { timeZone: string }) {
      let timeZone = "";
      try {
        timeZone = params!.timeZone;
      } catch (e) {
        //
      }
      this.closeModal({ timeZone });
    },

    closeModal(params: { timeZone: string }) {
      modalController.dismiss({ timeZone: params.timeZone });
    },
  },
});
</script>
