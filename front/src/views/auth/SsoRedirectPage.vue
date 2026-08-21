<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center ion-align-items-center" style="height: 100%;">
          <ion-col size="12" size-md="6" size-lg="4" class="ion-text-center">
            <ion-spinner name="crescent"></ion-spinner>
            <p>{{ loadingMessage }}</p>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IonCol, IonContent, IonGrid, IonPage, IonRow, IonSpinner } from '@ionic/vue'

// 2. Controllers / Composables
// none

// 3. Components
// none

// 4. Interface and types imports
// none

// 5. Main
const route = useRoute()

// 6. Vars and const
// none

// 7. Watch
// none

// 8. Computed
const screenHint = computed<"login" | "register">(() => (route.query.screenHint as string) === 'register' ? 'register' : 'login')
const loadingMessage = computed(() =>
  screenHint.value === 'register' ? 'Redirigiendo al registro SSO...' : 'Redirigiendo al SSO...'
)

// 9. OnMounted
onMounted(async () => {
  const ssoClient = (await import('@/ssoClientAccessor')).getSSOClient()
  await ssoClient.loginWithRedirect({
    screenHint: screenHint.value,
    redirectUri: `${window.location.origin}/auth/callback`,
  })
})

// 10. Functions
// none
</script>