<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="md">
      <SessionHeaderComponent
        :page-title="sessionData.pageTitle"
        :main-segment="sessionData.mainSegment"
        @main-segment="sessionData.mainSegment = $event"
      />
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="10">
            <SessionContentComponent
              :main-segment="sessionData.mainSegment"
              :page-title="sessionData.pageTitle"
            />
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, IonHeader, IonContent 
} from '@ionic/vue'
import { reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

// components
import SessionHeaderComponent from './header/SessionHeaderComponent.vue'
import SessionContentComponent from './SessionContentComponent.vue'

const route = useRoute()

const sessionData = reactive({
  mainSegment:
    route.path == "/login" || route.path == "/session"
      ? "login"
      : "signup",
  pageTitle:
    route.path == "/login" || route.path == "/session"
      ? "Iniciar sesión"
      : "Registrarse",
})

watch(
  () => route.path,
  async (newPath) => {
    sessionData.mainSegment =
      newPath == "/login" || newPath == "/session" ? "login" : "signup"
    sessionData.pageTitle =
      newPath == "/login" || newPath == "/session"
        ? "Iniciar sesión"
        : "Registrarse"
  },
)
</script>