<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center ion-align-items-center" style="height: 100%;">
          <ion-col size="12" size-md="6" size-lg="4" class="ion-text-center">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Redirigiendo al registro SSO...</p>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { onMounted } from 'vue'
import { IonCol, IonContent, IonGrid, IonPage, IonRow, IonSpinner } from '@ionic/vue'

// 2. Controllers / Composables
// none

// 3. Components
// none

// 4. Interface and types imports
// none

// 5. Main
// none

// 6. Vars and const
// none

// 7. Watch
// none

// 8. Computed
// none

// 9. OnMounted
onMounted(async () => {
  const ssoClient = (await import('@/ssoClientAccessor')).getSSOClient()
  await ssoClient.loginWithRedirect({
    screenHint: 'register',
    redirectUri: `${window.location.origin}/auth/callback`,
  })
})

// 10. Functions (named parameters pattern)
// none
</script>
