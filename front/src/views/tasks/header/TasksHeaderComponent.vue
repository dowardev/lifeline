<template>
  <div>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <div v-if="!isPlatform('mobile')">
          <ion-item lines="none">
            <ion-button fill="clear"
              ><ion-icon :icon="stopwatchOutline"></ion-icon
            ></ion-button>

            <ion-button
              :fill="viewMode == 'list' ? 'clear' : 'solid'"
              @click="
                viewMode = viewMode == 'list' ? 'kanban' : 'list';
                setTasksViewMode({ viewMode });
              "
              ><ion-icon :icon="albumsOutline"></ion-icon
            ></ion-button>
          </ion-item>
        </div>

        <ion-select interface="popover" :value="listSelected">
          <ion-select-option value="tray">Bandeja de entrada</ion-select-option>
        </ion-select>

        <ion-button
          v-if="isPlatform('mobile')"
          slot="end"
          @click="
            (popOverMainOptions.event = $event),
              (popOverMainOptions.open = true)
          "
        >
          <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <ion-popover
      :is-open="popOverMainOptions.open"
      :event="popOverMainOptions.event"
      @did-dismiss="popOverMainOptions.open = false"
    >
      <ion-content>
        <ion-item button lines="none">
          <ion-icon slot="start" :icon="stopwatchOutline"></ion-icon>
          <ion-label class="ion-text-wrap"
            >Reagendar elementos vencidos</ion-label
          >
        </ion-item>

        <!-- view mode  -->
        <ion-item
          lines="none"
          button
          @click="
            viewMode = viewMode == 'list' ? 'kanban' : 'list';
            setTasksViewMode({ viewMode });
          "
        >
          <ion-icon slot="start" :icon="albumsOutline"></ion-icon>
          <ion-label> Vista </ion-label>

          <ion-label slot="end">
            {{ viewMode == "list" ? "kanban" : "list" }}
          </ion-label>
        </ion-item>
      </ion-content>
    </ion-popover>
    <!-- end popovers -->
  </div>
</template>

<script setup lang="ts">
import { useSystem } from "@/composables/useSystem";
import { ViewMode } from "@/utils/types";
import { IonTitle, IonToolbar, IonButtons, isPlatform } from "@ionic/vue";
import {
  albumsOutline,
  ellipsisVerticalOutline,
  stopwatchOutline,
} from "ionicons/icons";
import { ref, watch, reactive } from "vue";

const props = defineProps({
  viewModeProp: { type: String, default: "list" },
});

const pageTitle = "Tareas";
const listSelected = ref("tray");
const popOverMainOptions = reactive({
  open: false,
  event: Event,
});
const viewMode = ref("list" as "list" | "kanban");

watch(
  () => props.viewModeProp,
  (newValue, oldValue) => {
    viewMode.value = newValue as "list" | "kanban";
  },
  { immediate: true }
);

// functions
function setTasksViewMode(params: { viewMode: ViewMode }): void {
  const { viewMode } = params;
  useSystem().setTasksViewMode({ viewMode });
}
</script>

<style scoped>
.background1-main-section {
  background: var(--ion-background-color);
}
.background2-main-section {
  background: var(--ion-color-step-50);
}
.card-main-content {
  max-height: 81vh;
  overflow-y: auto;
}
@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
