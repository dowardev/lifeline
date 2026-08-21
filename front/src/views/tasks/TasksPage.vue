<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      :scroll-events="true"
      @ion-scroll="handleScroll"
    >
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <!-- input add task -->
            <section>
              <ion-row
                class="ion-padding-start ion-padding-end"
                :class="{ center: screenWidth >= 768 }"
              >
                <ion-col size-xs="12" size-md="9" size-lg="6">
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
            </section>

            <section>
              <ion-row :class="{ center: screenWidth >= 768 }">
                <ion-col size-xs="12" size-lg="6">
                  <ion-card class="card-main-content">
                    <ion-card-content>
                      <ion-row>
                        <ion-col size-xs="12" size-md="9" size-lg="12">
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

                              <ion-button
                                :fill="viewMode == 'list' ? 'clear' : 'solid'"
                                @click="
                                  viewMode = viewMode == 'list' ? 'kanban' : 'list';
                                  setTasksViewMode({ viewMode });
                                "
                                ><ion-icon :icon="albumsOutline"></ion-icon
                              ></ion-button>
                            </div>
                          </ion-item>
                        </ion-col>
                      </ion-row>

                      <!-- tasks -->
                      <ion-row>
                        <ion-col size="12">
                          <listTasksComponent
                            v-show="viewMode == 'list'"
                            :task-data="taskController.getTasks()"
                            @update="updateTask({ idTask: $event.idTask })"
                            @remove="removeTask({ id: $event.idTask })"
                            @toggle-check="toggleCheckTask({ id: $event.idTask })"
                          />
                        </ion-col>
                      </ion-row>

                      <ion-row>
                        <ion-col size-xs="12" size-md="12" size-lg="12">
                          <kanbanComponent
                            v-show="viewMode == 'kanban'"
                            :task-data="taskController.getTasks()"
                            @update="updateTask({ idTask: $event.idTask })"
                            @delete="removeTask({ id: $event.idTask })"
                            @toggle-check="toggleCheckTask({ id: $event.idTask })"
                            @kanban-update="
                              kanbanUpdate({
                                columnName: $event.columnName,
                                id: $event.id,
                                position: $event.position,
                              })
                            "
                          />
                        </ion-col>
                      </ion-row>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
              </ion-row>
            </section>
          </ion-col>
        </ion-row>
      </ion-grid>

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
        <AddTaskComponent :task-data="taskController.getTask({ id: idTask }) ?? undefined" />
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

// controllers
import { TaskController } from "@/controllers/taskController";
import { SystemController } from "@/controllers/systemController";
const taskController = new TaskController();
const systemController = new SystemController();

// components
import AddTaskComponent from "@/components/tasks/AddTaskComponent.vue";
import listTasksComponent from "@/components/tasks/list/TaskListComponent.vue";
import kanbanComponent from "@/components/tasks/kanban/KanbanComponent.vue";
import { ViewMode } from "@/utils/types";

const pageTitle = "Tareas";
const listSelected = ref("tray");

const positionScroll = ref(0);
const handleScroll = (event: CustomEvent): void => {
  positionScroll.value = event.detail.scrollTop;
};
const screenWidth = ref(window.innerWidth);
const inputTaskValue = ref("");
const isOpenModalAddTask = ref(false);
const idTask = ref("");
const isOpenModalUpdateTask = ref(false);
const viewMode = ref("list" as "list" | "kanban");

// mounted
onMounted(() => {
  taskController.loadTasks();
  getTasksViewMode();
});

// functions
async function addTask(params: { name: string }): Promise<void> {
  const { name } = params;
  await taskController.createTask({ title: name });
  inputTaskValue.value = "";
}

async function removeTask(params: { id: string }): Promise<void> {
  const { id } = params;
  await taskController.deleteTask({ id: Number(id) });
}

function updateTask(params: { idTask: string }): void {
  const { idTask: id } = params;
  idTask.value = id;
  isOpenModalUpdateTask.value = true;
}

function toggleCheckTask(params: { id: string }): void {
  const { id } = params;
  const task = taskController.getTask({ id });
  if (!task) return;

  const newChecked = !task.checked;
  const newStatus = newChecked ? 'completed' : 'pending';
  taskController.updateTaskStatus({ id: task.id, status: newStatus });
}

function setTasksViewMode(params: { viewMode: ViewMode }): void {
  const { viewMode } = params;
  systemController.setTasksViewMode({ viewMode });
}

async function getTasksViewMode(): Promise<void> {
  viewMode.value = await systemController.getTasksViewMode();
}

async function kanbanUpdate(params: {
  position: number;
  id: string;
  columnName: "pending" | "progress" | "finalized";
}): Promise<void> {
  const { id, columnName, position } = params;
  const columnToStatus: Record<string, string> = {
    pending: 'pending',
    progress: 'in_progress',
    finalized: 'completed',
  };
  taskController.updateTask({
    id: Number(id),
    status: columnToStatus[columnName] ?? 'pending',
    order: position,
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
