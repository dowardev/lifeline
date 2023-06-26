<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <ion-button id="click-trigger-main-options"
            ><ion-icon :icon="ellipsisVerticalOutline"></ion-icon
          ></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row class="ion-padding">
        <ion-col size="12">
          <div class="center">
            <img :src="DeveloperByImage" alt="" class="logo" />
          </div>
        </ion-col>

        <ion-col size="12" class="center">
          <p class="description">
            LifeLine es una aplicación de productividad todo en uno donde podrás
            aumentar tu nivel de productividad gracias a todas las herramientas
            que te ofrece ademas de las diversas integraciones con las que es
            compatible.
          </p>
        </ion-col>
      </ion-row>

      <!-- popovers -->
      <ion-popover trigger="click-trigger-main-options" trigger-action="click">
        <ion-content
          ><ion-item
            button
            lines="none"
            @click="openURl({ url: 'https://dowar.xyz' })"
            ><ion-icon slot="start" :icon="globeOutline"></ion-icon
            ><ion-label>DowarDev</ion-label></ion-item
          >

          <ion-item button lines="none" disabled
            ><ion-icon slot="start" :icon="logoAppleAppstore"></ion-icon
            ><ion-label class="ion-text-wrap"
              >Aplicación movil(App Gallery)</ion-label
            ></ion-item
          >
        </ion-content>
      </ion-popover>
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
} from "@ionic/vue";
import DeveloperByImage from "@/assets/otros/developer_by.png";
import {
  ellipsisVerticalOutline,
  globeOutline,
  logoAppleAppstore,
} from "ionicons/icons";

const pageTitle = "LifeLine";

// functions
function openURl(params: { url: string }) {
  const { url } = params;
  window.open(url, "_blank");
}
</script>

<style scoped>
.logo {
  width: 70%;
  max-width: 70%;
}
.description {
  width: 100%;
  text-align: center;
}

@media only screen and (min-width: 768px) {
  .logo {
    width: 34%;
    max-width: 34%;
  }
  .description {
    width: 50%;
    text-align: center;
  }
}

@media only screen and (min-width: 992px) {
  .logo {
    width: 26%;
    max-width: 26%;
  }
  .description {
    width: 50%;
    text-align: center;
  }
}
</style>
