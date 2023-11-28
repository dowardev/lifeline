<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="md">
      <div>
        <SessionHeaderComponent
          v-if="
            $route.path == '/session' ||
            $route.path == '/signup' ||
            $route.path == '/login'
          "
          :page-title="sessionComponent.pageTitle"
          :main-segment="sessionComponent.mainSegment"
          @main-segment="sessionComponent.mainSegment = $event"
        />
      </div>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-card class="card-main-content">
        <SessionContentComponent
          v-if="
            $route.path == '/session' ||
            $route.path == '/signup' ||
            $route.path == '/login'
          "
          ref="sessionContentComponent"
          :main-segment="sessionComponent.mainSegment"
          :page-title="sessionComponent.pageTitle"
        />
      </ion-card>
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
// session
import SessionHeaderComponent from "../sesion/header/SessionHeaderComponent.vue";
import SessionContentComponent from "@/views/sesion/SessionContentComponent.vue";
import { reactive } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

// vars
const pageTitle = "Home";
const route = useRoute();

// session
const sessionContentComponent = ref();
const sessionComponent = reactive({
  mainSegment: route.path == "/login" ? "login" : "signup",
  pageTitle: route.path == "/login" ? "Iniciar sesión" : "Registrarse",
});
</script>

<style scoped>
.card-main-content {
  height: 97%;
}
</style>
