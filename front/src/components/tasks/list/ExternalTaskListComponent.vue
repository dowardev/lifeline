<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div>
    <div v-if="loading" class="ext-tasks-state">
      <ion-spinner name="crescent"></ion-spinner>
    </div>

    <div v-else-if="loadError" class="ext-tasks-state">
      <ion-icon :icon="alertCircleOutline" size="large" color="danger"></ion-icon>
      <p>{{ $t('message.externalTasks.loadError') }}</p>
    </div>

    <div
      v-else-if="tasks.length === 0"
      class="ext-tasks-state"
      data-testid="ext-tasks-empty"
    >
      <ion-icon :icon="checkboxOutline" size="large"></ion-icon>
      <p>{{ $t('message.externalTasks.empty') }}</p>
    </div>

    <ion-list v-else data-testid="ext-tasks-list">
      <ion-item v-for="task in tasks" :key="task.key" lines="full">
        <ion-icon slot="start" :icon="linkOutline"></ion-icon>
        <ion-label class="ion-text-wrap">
          <h2>{{ task.title || $t('message.noTitle') }}</h2>
          <p v-if="formatDue({ dueAt: task.due_at })">
            {{ $t('message.externalTasks.dueOn') }}: {{ formatDue({ dueAt: task.due_at }) }}
          </p>
          <p v-if="task.status">
            {{ task.status }}
          </p>
          <p class="ext-task-source">
            <ion-chip>
              <ion-icon :icon="cloudOutline"></ion-icon>
              <ion-label>{{ task.sourceName || '—' }}</ion-label>
            </ion-chip>
          </p>
        </ion-label>
      </ion-item>
    </ion-list>

    <ion-item lines="none" class="transparent ext-tasks-readonly">
      <ion-icon slot="start" :icon="lockClosedOutline"></ion-icon>
      <ion-label class="ion-text-wrap">
        {{ $t('message.externalTasks.readOnlyBadge') }}
      </ion-label>
    </ion-item>
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from '@ionic/vue';
import { onMounted, ref, watch } from 'vue';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import {
  alertCircleOutline,
  checkboxOutline,
  cloudOutline,
  linkOutline,
  lockClosedOutline,
} from 'ionicons/icons';

// 2. Controllers / Composables
import { ExternalTasksController } from '@/controllers/externalTasksController';
import { useExternalSyncOnEnter } from '@/composables/useExternalSync';
import { useI18n } from 'vue-i18n';

const controller = new ExternalTasksController();
const { lastSyncedAt } = useExternalSyncOnEnter();
const { locale: i18nLocale } = useI18n();

// 3. Components
// (none)

// 4. Interface and types imports
import type { ExternalTask } from '@/services/externalTaskService';

// 5. Main (props, emits, etc.)
// (none)

// 6. Vars and const
const tasks = ref<ExternalTask[]>([]);
const loading = ref(false);
const loadError = ref(false);

// 7. Watch
watch(lastSyncedAt, () => {
  void load();
});

// 8. Computed
// (none)

// 9. OnMounted
onMounted(() => {
  void load();
});

// 10. Functions (named parameters pattern)
async function load(): Promise<void> {
  loading.value = true;
  loadError.value = false;
  try {
    tasks.value = await controller.loadTasks();
  } catch (error) {
    console.warn(
      '[ExternalTaskListComponent] no se pudieron cargar las tareas externas',
      error,
    );
    tasks.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

function formatDue(params: { dueAt: string | undefined }): string {
  const { dueAt } = params;
  if (typeof dueAt !== 'string' || dueAt === '') return '';
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return '';
  // Honor the active i18n locale so 'Vence: 1 de diciembre de 2026' becomes
  // 'Due: December 1, 2026' when the UI is English. Anything outside the two
  // supported languages falls back to en-US instead of the previous Spanish
  // hard-code.
  const dateFnsLocale = i18nLocale.value === 'es' ? es : enUS;
  return format(date, 'PP', { locale: dateFnsLocale });
}
</script>

<style scoped>
.ext-tasks-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
  color: var(--ion-color-medium, #92949c);
}

.ext-task-source {
  margin-top: 6px;
}

.ext-tasks-readonly {
  color: var(--ion-color-medium, #92949c);
  font-size: 0.85rem;
}
</style>
