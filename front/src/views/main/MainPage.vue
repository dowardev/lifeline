<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="md">
      <div>
        <!-- session -->
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

        <!-- landing -->
        <LandingHeaderComponent
          v-if="$route.path == '/landing'"
          :page-title="landingComponent.pageTitle"
        />

        <!-- home -->
        <HomeHeaderComponent
          v-if="$route.path == '/home'"
          :page-title="landingComponent.pageTitle"
        />
      </div>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-card class="card-main-content">
        <!-- session -->
        <SessionContentComponent
          v-if="
            $route.path == '/session' ||
            $route.path == '/signup' ||
            $route.path == '/login'
          "
          :main-segment="sessionComponent.mainSegment"
          :page-title="sessionComponent.pageTitle"
        />

        <!-- landing -->
        <LandingContentComponent
          v-if="$route.path == '/landing'"
          :page-title="landingComponent.pageTitle"
        />

        <!-- home -->
        <HomeContentComponent
          v-if="$route.path == '/home'"
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
import HomeContentComponent from "@/views/home/content/HomeContentComponent.vue";
import HomeHeaderComponent from "@/views/home/header/HomeHeaderComponent.vue";

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
