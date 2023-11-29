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

        <LandingHeaderComponent
          v-if="$route.path == '/landing'"
          :page-title="landingComponent.pageTitle"
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
          :main-segment="sessionComponent.mainSegment"
          :page-title="sessionComponent.pageTitle"
        />

        <LandingContentComponent
          v-if="$route.path == '/landing'"
          :page-title="landingComponent.pageTitle"
        />
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage } from "@ionic/vue";
import { reactive } from "vue";
import { ref } from "vue";
import { useRoute } from "vue-router";
// components
import SessionHeaderComponent from "@/views/sesion/header/SessionHeaderComponent.vue";
import SessionContentComponent from "@/views/sesion/SessionContentComponent.vue";
import LandingContentComponent from "@/views/lading/content/LandingCotentComponent.vue";
import LandingHeaderComponent from "@/views/lading/header/LandingHeaderComponent.vue";

// vars
const route = useRoute();

// session
const sessionComponent = reactive({
  mainSegment: route.path == "/login" ? "login" : "signup",
  pageTitle: route.path == "/login" ? "Iniciar sesión" : "Registrarse",
});
const landingComponent = reactive({
  pageTitle: route.path == "",
});
</script>

<style scoped>
.card-main-content {
  height: 97%;
}
</style>
