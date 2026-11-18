<template>
  <ion-list class="transparent">
    <ion-list-header>
      <ion-label>Calendarios locales</ion-label>
    </ion-list-header>

    <ion-item v-if="loading">
      <ion-label>Cargando calendarios...</ion-label>
    </ion-item>

    <ion-item v-else-if="localCalendars.length === 0">
      <ion-label>
        <p>Todavía no tenés calendarios propios.</p>
      </ion-label>
    </ion-item>

    <ion-item v-for="cal in localCalendars" :key="cal.id">
      <ion-label>
        <h2>{{ cal.name }}</h2>
        <p v-if="isProtected(cal)">Calendario por defecto: no se puede renombrar ni eliminar.</p>
      </ion-label>
      <ion-button
        v-if="!isProtected(cal)"
        slot="end"
        fill="clear"
        @click="openRename(cal)"
        >Renombrar</ion-button
      >
      <ion-button
        v-if="!isProtected(cal)"
        slot="end"
        fill="clear"
        color="danger"
        @click="openDelete(cal)"
        >Eliminar</ion-button
      >
    </ion-item>

    <!-- Rename -->
    <ion-modal :is-open="renaming !== null" @did-dismiss="closeRename()">
      <ion-header>
        <ion-toolbar>
          <ion-title>Renombrar calendario</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeRename()">Cancelar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input
              label="Nombre"
              label-placement="stacked"
              :value="renameDraft"
              @ion-input="onRenameInput"
            ></ion-input>
          </ion-item>
        </ion-list>
        <ion-button
          expand="block"
          :disabled="renameDraft.trim() === ''"
          @click="confirmRename()"
          >Guardar</ion-button
        >
      </ion-content>
    </ion-modal>

    <!-- Delete -->
    <ion-modal :is-open="deleting !== null" @did-dismiss="closeDelete()">
      <ion-header>
        <ion-toolbar>
          <ion-title>Eliminar calendario</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeDelete()">Cancelar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <p class="ion-padding-horizontal">
          {{ deleting?.name }} tiene eventos que también se van a eliminar o a
          mover. Elegí qué hacer con ellos.
        </p>
        <ion-radio-group v-model="deleteStrategy" value="delete_events">
          <ion-item lines="none">
            <ion-radio label-placement="end" value="delete_events"
              >Borrar el calendario y todos sus eventos</ion-radio
            >
          </ion-item>
          <ion-item lines="none">
            <ion-radio label-placement="end" value="move"
              >Mover los eventos a otro calendario</ion-radio
            >
          </ion-item>
        </ion-radio-group>

        <ion-list v-if="deleteStrategy === 'move'">
          <ion-item>
            <ion-select
              label="Calendario destino"
              label-placement="stacked"
              :value="destinationId"
              @ion-change="onDestinationChange"
            >
              <ion-select-option
                v-for="destination in moveDestinations"
                :key="destination.id"
                :value="destination.id"
                >{{ destination.name }}</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-list>
        <ion-note v-if="deleteStrategy === 'move' && moveDestinations.length === 0">
          No tenés otro calendario local al cual mover los eventos. Creá uno
          primero o elegí borrar el calendario con sus eventos.
        </ion-note>

        <ion-button
          expand="block"
          color="danger"
          :disabled="!canDelete"
          @click="confirmDelete()"
          >Eliminar calendario</ion-button
        >
      </ion-content>
    </ion-modal>
  </ion-list>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { computed, onMounted, ref } from "vue";

// 2. Controllers / Composables
import { CalendarController } from "@/controllers/calendarController";
import { SystemController } from "@/controllers/systemController";

// 4. Interface and types imports
import type { InputEventDetail } from "@ionic/core";
import type { CalendarItem } from "@/store/calendarStore";

const calendarController = new CalendarController();
const systemController = new SystemController();

// 6. Vars and const
const loading = ref(false);
const renaming = ref<CalendarItem | null>(null);
const renameDraft = ref("");
const deleting = ref<CalendarItem | null>(null);
const deleteStrategy = ref<"delete_events" | "move">("delete_events");
const destinationId = ref<number | null>(null);

// 8. Computed
/**
 * LBDS-292 - only the LOCAL calendars are managed here. A mirrored row
 * belongs to an external source (Google / CalDAV) and its lifecycle is
 * owned by the source connection.
 */
const localCalendars = computed<CalendarItem[]>(() =>
  calendarController
    .getCalendarList()
    .filter((cal) => cal.source_id === null),
);

/**
 * The destinations of a "move": the local calendars OTHER than the one
 * being deleted. The protected default is the natural fallback, so it is
 * always available as a destination.
 */
const moveDestinations = computed<CalendarItem[]>(() =>
  localCalendars.value.filter((cal) => cal.id !== deleting.value?.id),
);

const canDelete = computed<boolean>(() => {
  if (deleting.value === null) return false;
  if (deleteStrategy.value === "delete_events") return true;
  return destinationId.value !== null && moveDestinations.value.length > 0;
});

// 9. OnMounted
onMounted(async () => {
  await loadCalendars();
});

// 10. Functions
async function loadCalendars(): Promise<void> {
  loading.value = true;
  try {
    await calendarController.getCalendars();
  } catch (error) {
    console.warn("[LocalCalendarsSection] Failed to load calendars:", error);
  } finally {
    loading.value = false;
  }
}

/**
 * LBDS-292 - the protected default calendar can neither be renamed nor
 * deleted: the server rejects it with 403 and the UI does not offer the
 * actions in the first place.
 */
function isProtected(cal: CalendarItem): boolean {
  return cal.protected === true || Number(cal.default) === 1;
}

function openRename(cal: CalendarItem): void {
  renaming.value = cal;
  renameDraft.value = cal.name;
}

function closeRename(): void {
  renaming.value = null;
  renameDraft.value = "";
}

function onRenameInput(event: CustomEvent<InputEventDetail>): void {
  renameDraft.value = event.detail.value ?? "";
}

async function confirmRename(): Promise<void> {
  const target = renaming.value;
  const name = renameDraft.value.trim();
  if (target === null || name === "") return;

  closeRename();
  try {
    await calendarController.renameCalendar({ id: target.id, name });
    await systemController.openToast({ message: "Calendario renombrado" });
  } catch (error) {
    console.warn("[LocalCalendarsSection] Rename failed:", error);
    await systemController.openToast({
      message: "No se pudo renombrar el calendario",
      color: "danger",
    });
  }
}

function openDelete(cal: CalendarItem): void {
  deleting.value = cal;
  deleteStrategy.value = "delete_events";
  destinationId.value = null;
}

function closeDelete(): void {
  deleting.value = null;
  deleteStrategy.value = "delete_events";
  destinationId.value = null;
}

function onDestinationChange(event: CustomEvent<{ value: number | string | null }>): void {
  const value = event.detail?.value;
  destinationId.value = value === null || value === undefined ? null : Number(value);
}

async function confirmDelete(): Promise<void> {
  const target = deleting.value;
  if (target === null || !canDelete.value) return;

  const strategy = deleteStrategy.value;
  const destination = destinationId.value;
  closeDelete();

  try {
    await calendarController.deleteCalendar({
      id: target.id,
      strategy,
      destinationCalendarId: strategy === "move" ? destination ?? undefined : undefined,
    });
    await systemController.openToast({
      message:
        strategy === "move"
          ? "Calendario eliminado y eventos movidos"
          : "Calendario y eventos eliminados",
    });
  } catch (error) {
    console.warn("[LocalCalendarsSection] Delete failed:", error);
    await systemController.openToast({
      message: "No se pudo eliminar el calendario",
      color: "danger",
    });
  }
}
</script>
