<template>
  <ion-row
    :class="{ center: screenWidth >= 768 }"
    class="ion-padding-start ion-padding-end"
  >
    <ion-col size-xs="12" size-md="3" sizw-lg="2">
      <h3>Pendiente</h3>
      <div class="border-column"></div>
      <draggable
        class="list-group"
        :list="pending"
        group="people"
        item-key="name"
        @change="eventKanban({ evt: $event, columnName: 'pending' })"
      >
        <template #item="{ element }">
          <div class="list-group-item">
            <ion-card
              @mouseover="showButtonsOptionsTask = element.id"
              @mouseleave="showButtonsOptionsTask = -1"
              @contextmenu.prevent="
                openPopoverRightTaskMenu({
                  ev: $event,
                  taskId: element.id,
                  columnName: 'pending',
                })
              "
              @press="
                openPopoverRightTaskMenu({
                  ev: $event,
                  taskId: element.id,
                  columnName: 'pending',
                })
              "
            >
              <ion-card-content
                >{{ element.name }}
                <div
                  v-show="showButtonsOptionsTask == element.id"
                  class="hover-overlay"
                >
                  <ion-button
                    @click="updateTask({ idTask: element.id.toString() })"
                    ><ion-icon :icon="createOutline"></ion-icon
                  ></ion-button>

                  <ion-button
                    fill="clear"
                    color="danger"
                    @click="removeTask({ id: element.id.toString() })"
                    ><ion-icon :icon="trashOutline"></ion-icon
                  ></ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </template>
      </draggable>
    </ion-col>

    <ion-col size-xs="12" size-md="3" sizw-lg="2">
      <h3>En progreso</h3>
      <div class="border-column"></div>
      <draggable
        class="list-group"
        :list="progress"
        group="people"
        item-key="name"
        @change="eventKanban({ evt: $event, columnName: 'progress' })"
      >
        <template #item="{ element }">
          <div class="list-group-item">
            <ion-card
              @mouseover="showButtonsOptionsTask = element.id"
              @mouseleave="showButtonsOptionsTask = -1"
              @contextmenu.prevent="
                openPopoverRightTaskMenu({
                  ev: $event,
                  taskId: element.id,
                  columnName: 'progress',
                })
              "
              @press="
                openPopoverRightTaskMenu({
                  ev: $event,
                  taskId: element.id,
                  columnName: 'progress',
                })
              "
            >
              <ion-card-content
                >{{ element.name }}
                <div
                  v-show="showButtonsOptionsTask == element.id"
                  class="hover-overlay"
                >
                  <ion-button
                    @click="updateTask({ idTask: element.id.toString() })"
                    ><ion-icon :icon="createOutline"></ion-icon
                  ></ion-button>

                  <ion-button
                    fill="clear"
                    color="danger"
                    @click="removeTask({ id: element.id.toString() })"
                    ><ion-icon :icon="trashOutline"></ion-icon
                  ></ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </template>
      </draggable>
    </ion-col>

    <ion-col size-xs="12" size-md="3" sizw-lg="2">
      <h3>Finalizado</h3>
      <div class="border-column"></div>
      <draggable
        class="list-group"
        :list="finalized"
        group="people"
        item-key="name"
        @change="eventKanban({ evt: $event, columnName: 'finalized' })"
      >
        <template #item="{ element }">
          <div class="list-group-item">
            <ion-card
              @mouseover="showButtonsOptionsTask = element.id"
              @mouseleave="showButtonsOptionsTask = -1"
              @contextmenu.prevent="
                openPopoverRightTaskMenu({
                  ev: $event,
                  taskId: element.id,
                  columnName: 'finalized',
                })
              "
              @press="
                openPopoverRightTaskMenu({
                  ev: $event,
                  taskId: element.id,
                  columnName: 'finalized',
                })
              "
            >
              <ion-card-content
                >{{ element.name }}
                <div
                  v-show="showButtonsOptionsTask == element.id"
                  class="hover-overlay"
                >
                  <ion-button
                    @click="updateTask({ idTask: element.id.toString() })"
                    ><ion-icon :icon="createOutline"></ion-icon
                  ></ion-button>

                  <ion-button
                    fill="clear"
                    color="danger"
                    @click="removeTask({ id: element.id.toString() })"
                    ><ion-icon :icon="trashOutline"></ion-icon
                  ></ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </template>
      </draggable>
    </ion-col>
  </ion-row>
</template>

<script setup lang="ts">
import {
  popoverController,
  IonCard,
  IonCardContent,
  IonRow,
  IonCol,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { onMounted, ref, watch } from "vue";
import draggable from "vuedraggable/src/vuedraggable";

// interface
import { Task } from "@/utils/interfaces";

interface Item {
  id: string;
  name: string;
  position: number;
}

// components
import RightMenuTaskComponent from "./RightMenuTaskComponent.vue";

const emits = defineEmits(["update", "delete", "toggleCheck", "kanbanUpdate"]);
const props = defineProps({
  taskData: { type: Array<Task>, default: () => [] },
});

const showButtonsOptionsTask = ref(-1);
const screenWidth = ref(window.innerWidth);
const pending = ref([] as Item[]);
const progress = ref([] as Item[]);
const finalized = ref([] as Item[]);

// watch
const handleResize = () => {
  screenWidth.value = window.innerWidth;
};
watch(
  () => props.taskData,
  (tasks) => {
    if (!tasks) return;
    pending.value = [];
    progress.value = [];
    finalized.value = [];

    tasks.forEach((task) => {
      if (task.kanban!.columnName == "pending") {
        pending.value.push({
          id: task.id,
          name: task.name,
          position: task.kanban!.position,
        });
      }

      if (task.kanban!.columnName == "progress") {
        progress.value.push({
          id: task.id,
          name: task.name,
          position: task.kanban!.position,
        });
      }

      if (task.kanban!.columnName == "finalized") {
        finalized.value.push({
          id: task.id,
          name: task.name,
          position: task.kanban!.position,
        });
      }
    });
    pending.value.sort((a, b) => a.position - b.position);
    progress.value.sort((a, b) => a.position - b.position);
    finalized.value.sort((a, b) => a.position - b.position);
  }
);

// mounted
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

// functions
async function openPopoverRightTaskMenu(params: {
  ev: CustomEvent;
  taskId: string;
  columnName: string;
}) {
  const { taskId, ev, columnName } = params;

  const popover = await popoverController.create({
    component: RightMenuTaskComponent,
    event: ev,
    showBackdrop: false,
    componentProps: { currentColumn: columnName },
  });
  await popover.present();

  const { role, data } = await popover.onDidDismiss();
  if (role == "confirm" && data.option == "delete") removeTask({ id: taskId });

  if (role == "confirm" && data.option == "edit")
    updateTask({ idTask: taskId });

  if (role == "confirm" && data.option == "moveElement") {
    let position = 0;
    if (data.newcolumn == "pending") position = pending.value.length;
    if (data.newcolumn == "progress") position = progress.value.length;
    if (data.newcolumn == "finalized") position = finalized.value.length;
    const data2 = { columnName: data.newcolumn, position, id: taskId } as {
      position: number;
      columnName: string;
      id: string;
    };
    emits("kanbanUpdate", data2);
  }
}

function updateTask(params: { idTask: string }) {
  const { idTask } = params;
  emits("update", { idTask });
}

function removeTask(params: { id: string }) {
  const { id } = params;
  emits("delete", { id });
}

function eventKanban(params: { evt: any; columnName: string }) {
  const { evt, columnName } = params;

  const data = { columnName } as {
    position: number;
    columnName: string;
    id: string;
  };

  if (evt.added) {
    data.id = evt.added.element.id;
    if (columnName == "pending")
      data.position = pending.value.findIndex(
        (element) => element.id == data.id
      );
    if (columnName == "progress")
      data.position = progress.value.findIndex(
        (element) => element.id == data.id
      );
    if (columnName == "finalized")
      data.position = finalized.value.findIndex(
        (element) => element.id == data.id
      );
    emits("kanbanUpdate", data);
  }

  if (evt.moved) {
    data.id = evt.moved.element.id;
    if (columnName == "pending")
      data.position = pending.value.findIndex(
        (element) => element.id == data.id
      );
    if (columnName == "progress")
      data.position = progress.value.findIndex(
        (element) => element.id == data.id
      );
    if (columnName == "finalized")
      data.position = finalized.value.findIndex(
        (element) => element.id == data.id
      );
    emits("kanbanUpdate", data);
  }
}
</script>

<style scoped>
.drag-drop-container {
  display: flex;
  justify-content: space-between;
}

.column {
  flex-basis: 30%;
  padding: 10px;
}

.item {
  margin-bottom: 10px;
  padding: 5px;
  cursor: move;
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.centered-button {
  text-align: center;
}

.border-column {
  border-bottom: 1px solid var(--ion-color-primary);
}
</style>
