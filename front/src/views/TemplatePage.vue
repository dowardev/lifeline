<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-title>Template</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <!-- content -->
            <!-- end content -->
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- modals -->
      <!-- end modals -->

      <!-- popovers -->
      <!-- end popovers  -->

      <!-- alerts -->
      <!-- end alerts -->
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
// 1. Imports (ionic/vue/ionicons)
// - Vue: ref, computed, watch, onMounted, etc.
// - Ionicons: addOutline, chevronBackOutline, etc.
// - Utilities: date-fns, messages, db, etc.
// - Ionic: IonButton, IonContent, IonDatetime, etc.
// - Local packages: @/utils/..., @/store/..., etc.
import { IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/vue'

// 2. Controllers / Composables
// - Import and instantiate controllers/composables
// import { AuthController } from '@/controllers/authController'
// const authController = new AuthController()

// 3. Components
// - Import child Vue components
// import ChildComponent from '@/components/ChildComponent.vue'

// 4. Interface and types imports
// - ONLY types/interfaces (import type)
// import type { User, EventItem } from '@/store/userStore'

// 5. Main (props, emits, etc.)
// defineProps<{ items: Item[] }>()
// defineEmits<{ update: [value: string] }>()

// 6. Vars and const
// const isOpen = ref(false)

// 7. Watch
// watch(() => props.items, (val) => { /* ... */ })

// 8. Computed
// const filtered = computed(() => items.value.filter(...))

// 9. OnMounted
// onMounted(() => { loadData() })

// 10. Functions (named parameters pattern)
// function loadData(params: { force?: boolean }) { /* ... */ }
// function holaMundo(params: { objeto1: string; objeto2: number }) {
//   const { objeto1, objeto2 } = params
// }
</script>
