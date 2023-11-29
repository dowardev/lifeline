<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>
    </ion-toolbar>
  </div>
</template>

<script setup lang="ts">
import { IonTitle, IonToolbar } from "@ionic/vue";

const pageTitle = "";
</script>

<style scoped>
.text-head {
  font-size: 3rem;
}

.size-section {
  min-height: 100vh;
}

.section-title {
  text-decoration: underline var(--ion-color-primary);
}

@media only screen and (max-width: 600px) {
  .logo {
    max-width: 61vw;
  }
  .text-head {
    font-size: 3rem;
    text-align: center;
  }
  .logo-dowar {
    max-width: 91vw;
  }
}

@media only screen and (min-width: 768px) {
  .logo {
    max-width: 28vw;
  }
  .logo-dowar {
    max-width: 44vw;
  }
}

@media only screen and (min-width: 992px) {
  .logo {
    width: 14rem;
  }
  .logo-dowar {
    max-width: 34vw;
  }
}

@media only screen and (min-width: 1200px) {
  .logo {
    width: 16vw;
  }
  .logo-dowar {
    max-width: 22vw;
  }
}
</style>
