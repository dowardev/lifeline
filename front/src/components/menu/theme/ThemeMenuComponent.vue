<template>
  <ion-header mode="ios" class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon :icon="chevronBackOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <p class="ion-padding-start">Elije el que mas te guste</p>

    <!-- theme selector -->
    <ion-row v-for="(theme, index) in availableThemes" :key="index">
      <ion-col size="12">
        <ion-item
          lines="none"
          button
          @click="applyTheme({ name: theme as Theme })"
          ><ion-label>{{ theme }}</ion-label>
          <ion-icon
            v-if="currentTheme == theme"
            :icon="checkmarkOutline"
          ></ion-icon>
        </ion-item>
      </ion-col>
    </ion-row>
  </ion-content>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  modalController,
} from "@ionic/vue";
import { checkmarkOutline, chevronBackOutline } from "ionicons/icons";
import { onMounted, ref } from "vue";

// 2. Controllers / Composables
import { ThemeController } from "@/controllers/themeController";
const themeController = new ThemeController();

// 3. Components
// (none)

// 4. Interface and types imports
import { Theme } from "@/utils/types";

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const availableThemes: Theme[] = ["light", "dark", "catppuccin-latte-maroon", "catppuccin-macchiato-maroon"];
const pageTitle = "Selector de tema";
const currentTheme = ref("" as Theme);

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
onMounted(() => {
  currentTheme.value = themeController.getTheme() as Theme;
});

// 10. Functions (named parameters pattern)
const closeModal = (): void => {
  modalController.dismiss();
};

async function applyTheme(params: { name: Theme }): Promise<void> {
  const theme = params.name;
  themeController.applyTheme({ theme });
  themeController.setTheme({ theme });
  currentTheme.value = theme;
}
</script>
