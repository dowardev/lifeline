<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-menu ref="menuRef" content-id="menu-content" type="overlay" menu-id="main-menu">
    <ion-header mode="ios" class="ion-no-border">
      <div class="menu-header-wrapper">
        <ion-toolbar>
          <ion-title>LifeLine</ion-title>
        </ion-toolbar>
        <span class="menu-version-chip" :class="chipClass">{{ versionLabel }}</span>
      </div>
    </ion-header>

    <ion-content>
      <div v-if="!isAuthenticated" class="auth-section">
        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isLogin }"
          :aria-current="isLogin ? 'page' : undefined"
          @click="navigate({ route: '/login' })"
        >
          <ion-icon slot="start" :icon="logInOutline"></ion-icon>
          <ion-label>Iniciar Sesión</ion-label>
        </ion-item>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isRegister }"
          :aria-current="isRegister ? 'page' : undefined"
          @click="navigate({ route: '/register' })"
        >
          <ion-icon slot="start" :icon="personAddOutline"></ion-icon>
          <ion-label>Registrarse</ion-label>
        </ion-item>
      </div>

      <div v-else class="user-section">
        <div class="user-info">
          <ion-icon :icon="personCircleOutline" class="user-avatar"></ion-icon>
          <ion-label class="user-name">{{ userName }}</ion-label>
          <ion-button fill="clear" size="small" class="logout-button" @click="handleLogout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </div>
      </div>

      <ion-list>
        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isHome }"
          :aria-current="isHome ? 'page' : undefined"
          @click="navigate({ route: '/' })"
        >
          <ion-icon slot="start" :icon="homeOutline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-item>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isCalendar }"
          :aria-current="isCalendar ? 'page' : undefined"
          @click="navigate({ route: '/calendar' })"
        >
          <ion-icon slot="start" :icon="calendarOutline"></ion-icon>
          <ion-label>Agenda</ion-label>
        </ion-item>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isTasks }"
          :aria-current="isTasks ? 'page' : undefined"
          @click="navigate({ route: '/tasks' })"
        >
          <ion-icon slot="start" :icon="checkboxOutline"></ion-icon>
          <ion-label>Tareas</ion-label>
        </ion-item>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isDocuments }"
          :aria-current="isDocuments ? 'page' : undefined"
          @click="navigate({ route: '/documents' })"
        >
          <ion-icon slot="start" :icon="documentTextOutline"></ion-icon>
          <ion-label>Documentos</ion-label>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>Integraciones</ion-label>
        </ion-list-header>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isWakatime }"
          :aria-current="isWakatime ? 'page' : undefined"
          @click="navigate({ route: '/integrations' })"
        >
          <ion-icon slot="start" :icon="hourglassOutline"></ion-icon>
          <ion-label>Wakatime</ion-label>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>Otros</ion-label>
        </ion-list-header>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isPolicies }"
          :aria-current="isPolicies ? 'page' : undefined"
          @click="navigate({ route: '/policies' })"
        >
          <ion-icon slot="start" :icon="shieldCheckmarkOutline"></ion-icon>
          <ion-label>Políticas</ion-label>
        </ion-item>

        <ion-item
          button
          lines="none"
          :class="{ 'menu-active': isAbout }"
          :aria-current="isAbout ? 'page' : undefined"
          @click="navigate({ route: '/about' })"
        >
          <ion-icon slot="start" :icon="informationCircleOutline"></ion-icon>
          <ion-label>Acerca de</ion-label>
        </ion-item>

        <ion-item
          button
          lines="none"
          @click="openThemeModal()"
        >
          <ion-icon slot="start" :icon="colorPaletteOutline"></ion-icon>
          <ion-label>Tema</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonTitle,
  IonToolbar,
  alertController,
  menuController,
  modalController,
} from '@ionic/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  calendarOutline,
  checkboxOutline,
  colorPaletteOutline,
  documentTextOutline,
  homeOutline,
  hourglassOutline,
  informationCircleOutline,
  logInOutline,
  logOutOutline,
  personAddOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'

// 2. Controllers / Composables
import { AuthController } from '@/controllers/authController'
import { useAppVersion } from '@/composables/useAppVersion'

const authController = new AuthController()
const { label: versionLabel, chipClass } = useAppVersion()

// 3. Components
import ThemeSelectorComponent from './theme/ThemeMenuComponent.vue'

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const menuRef = ref()
const route = useRoute()
const router = useRouter()

// 7. Watch
// (none)

// 8. Computed
const isAuthenticated = computed(() => authController.isLoggedIn())
const userName = computed(() => authController.getCurrentUser().userName || 'Usuario')

const isHome = computed(() => route.path === '/')
const isCalendar = computed(() => route.path === '/calendar')
const isTasks = computed(() => route.path.startsWith('/tasks'))
const isDocuments = computed(() => route.path.startsWith('/documents'))
const isWakatime = computed(() => route.path === '/integrations')
const isPolicies = computed(() => route.path === '/policies')
const isAbout = computed(() => route.path === '/about')
const isLogin = computed(() => route.path === '/login')
const isRegister = computed(() => route.path === '/register')

// 9. OnMounted
// none

// 10. Functions (named parameters pattern)
async function navigate(params: { route: string }): Promise<void> {
  try {
    await menuController.close('main-menu')
  } catch {
    try {
      if (menuRef.value?.$el?.close) {
        await menuRef.value.$el.close()
      }
    } catch {
      // fallback
    }
  }
  router.push(params.route)
}

async function handleLogout(): Promise<void> {
  const alert = await alertController.create({
    header: 'Cerrar Sesión',
    message: '¿Estás seguro de que quieres cerrar sesión?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
      },
      {
        text: 'Cerrar Sesión',
        role: 'confirm',
        handler: async (): Promise<void> => {
          await authController.logout()
          location.reload()
        },
      },
    ],
  })
  await alert.present()
}

async function openThemeModal(): Promise<void> {
  const modal = await modalController.create({
    component: ThemeSelectorComponent,
    initialBreakpoint: 0.5,
    breakpoints: [0, 0.5, 1],
  })
  await modal.present()
}
</script>

<style>
.menu-active {
  border-left: 4px solid var(--ion-color-primary);
  --padding-start: 12px;
  --background: rgba(var(--ion-color-primary-rgb), 0.08);
}

.auth-section {
  padding: 8px 0;
  border-bottom: 1px solid var(--ion-color-step-150);
}

.user-section {
  padding: 16px;
  border-bottom: 1px solid var(--ion-color-step-150);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  font-size: 40px;
  color: var(--ion-color-primary);
}

.user-name {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
}

.logout-button {
  --color: var(--ion-color-medium);
}

ion-menu ion-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

ion-menu ion-content::part(scroll) {
  flex: 1;
}

.menu-header-wrapper {
  position: relative;
}

.menu-header-wrapper .menu-version-chip {
  position: absolute;
  bottom: -8px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 4px;
  padding: 3px 7px;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.menu-header-wrapper .menu-version-chip.alpha {
  background: var(--ion-color-danger);
  color: var(--ion-color-danger-contrast);
}

.menu-header-wrapper .menu-version-chip.beta {
  background: var(--ion-color-warning);
  color: var(--ion-color-warning-contrast);
}

.menu-header-wrapper .menu-version-chip.stable {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}
</style>
