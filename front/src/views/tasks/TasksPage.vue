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
      <listTasks
        :task-data="useTask().getTasks()"
        @update="updateTask({ idTask: $event.idTask })"
        @remove="removeTask({ id: $event.idTask })"
        @toggle-check="toggleCheckTask({ id: $event.idTask })"
      />

      <!-- modals -->
      <ion-modal
        ref="modalAddTask"
        class="modal-event"
        :is-open="isOpenModalAddTask"
        @did-dismiss="isOpenModalAddTask = false"
      >
        <AddTaskComponent />
      </ion-modal>

      <!-- modal update task -->
      <ion-modal
        class="modal-event"
        :backdrop-dismiss="false"
        :is-open="isOpenModalUpdateTask"
        @did-dismiss="isOpenModalUpdateTask = false"
      >
        <AddTaskComponent :task-data="useTask().getTask({ idTask })" />
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
  IonButton,
  IonButtons,
} from "@ionic/vue";
import { addOutline, albumsOutline, appsOutline } from "ionicons/icons";
import { onMounted, ref } from "vue";
import { useTask } from "@/composables/useTask";
import { NewTask } from "@/utils/interfaces";

// components
import AddTaskComponent from "@/components/tasks/AddTaskComponent.vue";
import listTasks from "@/components/tasks/list/taskList.vue";

const pageTitle = "Tareas";
const listSelected = ref("tray");

const positionScroll = ref(0);
const handleScroll = (event: CustomEvent) => {
  positionScroll.value = event.detail.scrollTop;
};
const screenWidth = ref(window.innerWidth);
const inputTaskValue = ref("");
const isOpenModalAddTask = ref(false);
const idTask = ref("");
const isOpenModalUpdateTask = ref(false);

// mounted
onMounted(() => {
  useTask().loadTasks();
});

// functions
async function addTask(params: { name: string }) {
  const { name } = params;
  const task = {
    name,
    checked: false,
    guests: [],
    reminders: {
      start: null,
      end: null,
      notifications: [],
      repeat: { frecuency: 1, type: "daily", daysWeek: [] },
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    subtasks: [],
  } as NewTask;
  await useTask().saveTask({ task });
  inputTaskValue.value = "";
}

async function removeTask(params: { id: string }) {
  const { id } = params;
  await useTask().deleteTask({ taskId: id });
}

function updateTask(params: { idTask: string }) {
  const { idTask: id } = params;
  idTask.value = id;
  isOpenModalUpdateTask.value = true;
}

function toggleCheckTask(params: { id: string }) {
  const { id } = params;
  const task = useTask().getTask({ idTask: id });
  if (!task) return;

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
