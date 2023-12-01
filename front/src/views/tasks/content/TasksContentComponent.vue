<template>
  <div>
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
          <ion-card class="card-main-content element-selected">
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
                    :task-data="useTask().getTasks()"
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
                    :task-data="useTask().getTasks()"
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
  </div>
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

// composable
import { useTask } from "@/composables/useTask";
import { useSystem } from "@/composables/useSystem";

// interface
import { NewTask } from "@/utils/interfaces";

// components
import AddTaskComponent from "@/components/tasks/AddTaskComponent.vue";
import listTasksComponent from "@/components/tasks/list/TaskListComponent.vue";
import kanbanComponent from "@/components/tasks/kanban/KanbanComponent.vue";
import { ViewMode } from "@/utils/types";

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
const viewMode = ref("list" as "list" | "kanban");

// mounted
onMounted(() => {
  useTask().loadTasks();
  getTasksViewMode();
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
    kanban: {
      columnName: "pending",
      position: useTask().getTasks()!.length,
    },
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

function setTasksViewMode(params: { viewMode: ViewMode }) {
  const { viewMode } = params;
  useSystem().setTasksViewMode({ viewMode });
}

async function getTasksViewMode() {
  viewMode.value = await useSystem().getTasksViewMode();
}

async function kanbanUpdate(params: {
  position: number;
  id: string;
  columnName: "pending" | "progress" | "finalized";
}) {
  const { id, columnName, position } = params;
  const task = useTask().getTask({ idTask: id })!;
  task.kanban.columnName = columnName;
  task.kanban.position = position;
  useTask().updateTask({ task });
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

.element-selected {
  border: 1px solid var(--ion-color-primary);
}
@media only screen and (min-width: 992px) {
  .modal-event {
    --width: 80vw;
    --height: 90vh;
  }
}
</style>
