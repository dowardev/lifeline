<template>
  <ion-header mode="ios" class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeShare()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>
</template>

<script lang="ts">
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
} from "@ionic/vue";
import {
  closeOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";

export default defineComponent({
  name: "HomePage",
  components: {
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
  },

  emits: ["closeShare"],

  setup() {
    return {
      pageTitle: "Compartir",
      closeOutline
    };
  },

  methods: {
    closeShare() {
      this.$emit("closeShare");
    },
  },
});
</script>
