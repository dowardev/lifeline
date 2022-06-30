<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          debounce="500"
          @ionChange="search($event.detail.value)"
          style="--box-shadow: white"
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
          @click="closeModal(result)"
        >
          <ion-label>{{ result }}</ion-label>
        </ion-item>
      </div>
      <div v-if="searchResult.length == 0">
        <ion-item
          v-for="result in [timeZones][0].names"
          :key="result"
          button
          @click="closeModal(result)"
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

export default defineComponent({
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSearchbar,
  },
  data() {
    return {
      timeZones: getAllTimeZonesNamesService(),
      searchResult: [] as Array<string>,
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
    closeModal(timeZone: string) {
      modalController.dismiss({ timeZone });
    },
  },
});
</script>
