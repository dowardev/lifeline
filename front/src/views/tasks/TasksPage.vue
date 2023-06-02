<template>
  <ion-page>
    <ion-header collapse="fade" mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :fullscreen="true"
      :scroll-events="true"
      @ion-scroll="handleScroll"
    >
      <ion-header collapse="condense" mode="ios">
        <ion-toolbar>
          <ion-title size="large">{{ pageTitle }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div
        style="position: sticky; top: 0; z-index: 3"
        class="ion-padding-start ion-padding-end"
        :class="{
          'background1-main-section': positionScroll == 0,
          'background2-main-section': positionScroll > 0,
        }"
      >
        <ion-row :class="{ center: screenWidth >= 768 }">
          <ion-col size-xs="12" size-md="6">
            <div style="display: flex; justify-content: space-between">
              <div style="width: 100%">
                <ion-input
                  label="Agregar tarea"
                  placeholder="Comprar pan"
                  :fill="positionScroll > 10 ? 'outline' : 'solid'"
                  :value="inputTaskValue"
                  label-placement="floating"
                  @ion-input="inputTaskValue = $event.detail.value as string"
                ></ion-input>
              </div>

              <div class="center-vertical ion-padding-start">
                <ion-button
                  slot="end"
                  :disabled="!inputTaskValue"
                  @click="addTask({ name: inputTaskValue })"
                  ><ion-icon :icon="addOutline"></ion-icon
                ></ion-button>
              </div>
            </div>
          </ion-col>
        </ion-row>

        <ion-row :class="{ center: screenWidth >= 768 }">
          <ion-col size-xs="12" size-md="6">
            <ion-item lines="none" style="--background: transparent">
              <ion-select interface="popover" :value="listSelected">
                <ion-select-option value="tray"
                  >Bandeja de entrada</ion-select-option
                >
              </ion-select>

              <div slot="end">
                <ion-button fill="clear"
                  ><ion-icon :icon="appsOutline"></ion-icon
                ></ion-button>
                <ion-button fill="clear"
                  ><ion-icon :icon="albumsOutline"></ion-icon
                ></ion-button>
              </div>
            </ion-item>
          </ion-col>
        </ion-row>
      </div>

      <!-- tasks -->
      <ion-row
        :class="{ center: screenWidth >= 768 }"
        class="ion-padding-start ion-padding-end"
      >
        <ion-col size-xs="12" size-md="6">
          <ion-list>
            <ion-list-header>
              <ion-label>Pendiente</ion-label>
            </ion-list-header>

            <ion-item
              v-for="task in listTasks.incomplete"
              :key="task.name"
              class="ion-padding-start"
              lines="full"
              @mouseenter="showButtonsOptionsTask = parseInt(task.id)"
              @mouseleave="showButtonsOptionsTask = -1"
            >
              <ion-checkbox
                :checked="task.checked"
                label-placement="end"
                justify="start"
                @ion-change="toggleCheckTask({ task })"
                >{{ task.name }}</ion-checkbox
              >

              <ion-button
                v-if="showButtonsOptionsTask === parseInt(task.id)"
                @click="isOpenModalAddTask = true"
                ><ion-icon :icon="createOutline"></ion-icon
              ></ion-button>

              <ion-button
                v-if="showButtonsOptionsTask === parseInt(task.id)"
                fill="clear"
                color="danger"
                @click="removeTask({ id: task.id })"
                ><ion-icon :icon="trashOutline"></ion-icon
              ></ion-button>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>Completado</ion-label>
            </ion-list-header>

            <ion-item
              v-for="task in listTasks.complete"
              :key="task.name"
              class="ion-padding-start"
              lines="full"
              @mouseenter="showButtonsOptionsTask = parseInt(task.id)"
              @mouseleave="showButtonsOptionsTask = -1"
            >
              <ion-checkbox
                :checked="task.checked"
                label-placement="end"
                justify="start"
                @ion-change="toggleCheckTask({ task })"
                >{{ task.name }}</ion-checkbox
              >

              <ion-button
                v-if="showButtonsOptionsTask === parseInt(task.id)"
                @click="isOpenModalAddTask = true"
                ><ion-icon :icon="createOutline"></ion-icon
              ></ion-button>

              <ion-button
                v-if="showButtonsOptionsTask === parseInt(task.id)"
                fill="clear"
                color="danger"
                @click="removeTask({ id: task.id })"
                ><ion-icon :icon="trashOutline"></ion-icon
              ></ion-button>
            </ion-item>
          </ion-list>
        </ion-col>
      </ion-row>
      <!-- end tasks -->

      <!-- modals -->
      <ion-modal
        ref="modalAddTask"
        class="modal-event"
        :is-open="isOpenModalAddTask"
        @did-dismiss="isOpenModalAddTask = false"
      >
        <AddTaskComponent />
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonInput,
  IonModal,
  IonCheckbox,
  IonLabel,
  IonButton,
  IonButtons,
} from "@ionic/vue";
import {
  addOutline,
  albumsOutline,
  appsOutline,
  createOutline,
  trashOutline,
} from "ionicons/icons";
import { computed, onMounted, ref, watch } from "vue";
// components
import AddTaskComponent from "@/components/tasks/AddTaskComponent.vue";
import { useTasksStore } from "@/store/tasksStore";
import { useTask } from "@/composables/useTask";
import { Task } from "@/utils/interfaces";

const pageTitle = "Tareas";
const listSelected = ref("tray");
const showButtonsOptionsTask = ref(-1);

const positionScroll = ref(0);
const handleScroll = (event: CustomEvent) => {
  positionScroll.value = event.detail.scrollTop;
};
const screenWidth = ref(window.innerWidth);
const inputTaskValue = ref("");
const isOpenModalAddTask = ref(false);

// mounted
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

// watch
const handleResize = () => {
  screenWidth.value = window.innerWidth;
};
const listTasks = ref({
  complete: [] as Task[],
  incomplete: [] as Task[],
});
watch(
  () => useTask().getTasks(),
  (tasks) => {
    if (!tasks) return;
    listTasks.value.complete = [];
    listTasks.value.incomplete = [];

    tasks.forEach((task) => {
      if (task.checked) {
        listTasks.value.complete.push({
          id: task.id,
          name: task.name,
          checked: task.checked,
        });
      } else {
        listTasks.value.incomplete.push({
          id: task.id,
          name: task.name,
          checked: task.checked,
        });
      }
    });
  }
);

// functions
async function addTask(params: { name: string }) {
  const { name } = params;
  // tasks.value.push({ name, checked: false });
  const taskName = inputTaskValue.value;
  await useTask().saveTask({ task: { name, checked: false } });
  inputTaskValue.value = "";
}

async function removeTask(params: { id: string }) {
  const { id } = params;
  await useTask().deleteTask({ taskId: id });
}

function toggleCheckTask(params: { task: Task }) {
  const { task } = params;
  task.checked = !task.checked;
  useTask().updateTask({
    task: { id: task.id, name: task.name, checked: task.checked },
  });
}
</script>

<style scoped>
.background1-main-section {
  background: var(--ion-background-color);
}
.background2-main-section {
  background: var(--ion-color-step-50);
}
@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
