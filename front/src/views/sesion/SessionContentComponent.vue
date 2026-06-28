<template>
  <ion-grid>
    <ion-row>
      <ion-col>
        <ion-header
          v-if="!isPlatform('desktop') && !isPlatform('tablet')"
          class="fade-in-title ion-no-border"
        >
          <ion-toolbar style="--background: transparent">
            <ion-title size="large">{{ props.pageTitle }}</ion-title>
          </ion-toolbar>
        </ion-header>
      </ion-col>
    </ion-row>

    <ion-row class="center">
      <ion-col size="12" size-md="10" size-lg="8" size-xl="9">
        <div v-if="props.mainSegment == 'login'"><LoginContentComponent /></div>
        <div v-if="props.mainSegment == 'signup'">
          <SignupComponent />
        </div>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script setup lang="ts">
import { IonRow, IonCol, isPlatform } from "@ionic/vue";

// components
import LoginContentComponent from "./login/LoginComponent.vue";
import SignupComponent from "./signup/SignUpComponent.vue";

// vars
const props = defineProps({
  mainSegment: { default: "login", type: String },
  pageTitle: { type: String, required: true, default: "Iniciar sesión" },
});
</script>

<style scoped>
.center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
