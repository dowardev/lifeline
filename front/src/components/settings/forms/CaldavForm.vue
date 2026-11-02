<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-item class="transparent">
    <ion-input
      v-model="connection.name"
      :disabled="disabled"
      label="Nombre"
      label-placement="stacked"
      placeholder="Mi servidor CalDAV"
    ></ion-input>
  </ion-item>

  <ion-item class="transparent">
    <ion-input
      v-model="connection.url"
      :disabled="disabled"
      label="URL del servidor"
      label-placement="stacked"
      placeholder="https://caldav.ejemplo.com/remote.php/dav"
      inputmode="url"
    ></ion-input>
  </ion-item>

  <ion-item class="transparent">
    <ion-input
      v-model="connection.username"
      :disabled="disabled"
      label="Usuario"
      label-placement="stacked"
      placeholder="usuario"
    ></ion-input>
  </ion-item>

  <ion-item class="transparent">
    <ion-input
      v-model="connection.password"
      :disabled="disabled"
      label="Contraseña"
      label-placement="stacked"
      type="password"
      placeholder="••••••••"
    ></ion-input>
  </ion-item>

  <ion-item :disabled="disabled" class="transparent">
    <ion-label>Color</ion-label>

    <input slot="end" v-model="connection.color" type="color" :disabled="disabled" />
  </ion-item>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonInput, IonItem, IonLabel } from '@ionic/vue';

// 2. Controllers / Composables
// (none — presentational)

// 3. Components
// (none)

// 4. Interface and types imports
import type { CaldavConnection } from '@/components/settings/connectionModels';

// 5. Main (props, emits, etc.)
defineProps<{ connection: CaldavConnection; disabled: boolean }>();

// 6. Vars and const
// (none)

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
// (none)
</script>
