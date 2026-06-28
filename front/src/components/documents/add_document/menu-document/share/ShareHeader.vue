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

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from "@ionic/vue";
import { closeOutline } from "ionicons/icons";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
const emitEvent = defineEmits(["closeShare"]);

// 6. Vars and const
const pageTitle = "Compartir";

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
const closeShare = (): void => {
  emitEvent("closeShare");
};
</script>
