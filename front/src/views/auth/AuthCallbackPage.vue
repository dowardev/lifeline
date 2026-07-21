<template>
  <ion-page>
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row class="ion-justify-content-center ion-align-items-center" style="height: 100%;">
          <ion-col size="12" size-md="6" size-lg="4" class="ion-text-center">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <p v-if="loading">Iniciando sesión...</p>
            <div v-else-if="error">
              <p style="color: var(--ion-color-danger); word-break: break-all;">{{ error }}</p>
              <ion-button class="ion-margin-top" @click="redirectToSSO">
                Intentar de nuevo
              </ion-button>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// 1. Imports
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonButton, IonCol, IonContent, IonGrid, IonPage, IonRow, IonSpinner } from '@ionic/vue'

// 2. Controllers / Composables
// none

// 3. Components
// none

// 4. Interface and types imports
// none

// 5. Main
const router = useRouter()

// 6. Vars and const
const loading = ref(true)
const error = ref<string | null>(null)

// 7. Watch
// none

// 8. Computed
// none

// 9. OnMounted
onMounted(async () => {
  const params = new URL(window.location.href).searchParams

  const oauthError = params.get('error')
  const oauthErrorDesc = params.get('error_description')
  if (oauthError) {
    loading.value = false
    error.value = oauthErrorDesc || oauthError
    return
  }

  try {
    const ssoClient = (await import('@/ssoClientAccessor')).getSSOClient()
    await ssoClient.handleCallback(window.location.href)
    router.push('/home')
  } catch (e: any) {
    loading.value = false
    error.value = e?.message || 'Error desconocido al iniciar sesión'
  }
})

// 10. Functions (named parameters pattern)
function redirectToSSO(): void {
  import('@/ssoClientAccessor').then(({ getSSOClient }) => {
    getSSOClient().loginWithRedirect({
      redirectUri: `${window.location.origin}/auth/callback`,
    })
  })
}
</script>
