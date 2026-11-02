<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-item class="transparent">
    <ion-input
      :disabled="disabled"
      :value="connection.name"
      label="Nombre"
      label-placement="stacked"
      placeholder="Mi servidor CalDAV"
      @ion-input="updateField({ field: 'name', value: $event.detail.value as string })"
    ></ion-input>
  </ion-item>

  <ion-item class="transparent">
    <ion-input
      :disabled="disabled"
      :value="connection.url"
      label="URL del servidor"
      label-placement="stacked"
      placeholder="https://caldav.ejemplo.com/remote.php/dav"
      inputmode="url"
      @ion-input="updateField({ field: 'url', value: $event.detail.value as string })"
    ></ion-input>
  </ion-item>

  <ion-item class="transparent">
    <ion-input
      :disabled="disabled"
      :value="connection.username"
      label="Usuario"
      label-placement="stacked"
      placeholder="usuario"
      @ion-input="updateField({ field: 'username', value: $event.detail.value as string })"
    ></ion-input>
  </ion-item>

  <ion-item class="transparent">
    <ion-input
      :disabled="disabled"
      :value="connection.password"
      label="Contraseña"
      label-placement="stacked"
      type="password"
      placeholder="••••••••"
      @ion-input="updateField({ field: 'password', value: $event.detail.value as string })"
    ></ion-input>
  </ion-item>

  <ion-item :disabled="disabled" class="transparent">
    <ion-label>Color</ion-label>

    <input
      slot="end"
      :value="connection.color"
      type="color"
      :disabled="disabled"
      @input="updateField({ field: 'color', value: ($event.target as HTMLInputElement).value })"
    />
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
const props = defineProps<{ connection: CaldavConnection; disabled: boolean }>();
const emit = defineEmits<{ 'update:connection': [connection: CaldavConnection] }>();

// 6. Vars and const
// (none)

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
function updateField(params: { field: 'name' | 'url' | 'username' | 'password' | 'color'; value: string }): void {
  emit('update:connection', { ...props.connection, [params.field]: params.value });
}
</script>
