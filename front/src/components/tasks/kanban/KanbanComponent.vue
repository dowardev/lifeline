<template>
  <ion-row
    :class="{ center: screenWidth >= 768 }"
    class="ion-padding-start ion-padding-end"
  >
    <ion-col size-xs="12" size-md="4">
      <h3 class="center">Pendiente</h3>
      <div class="border-column"></div>
      <draggable
        :list="pending"
        group="people"
        item-key="name"
        @change="eventKanban({ evt: $event, columnName: 'pending' })"
      >
        <template #item="{ element }">
          <ion-item
            button
            class="transparent"
            lines="full"
            style="cursor: move"
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
            <ion-label>{{ element.name }} </ion-label>
          </ion-item>
        </template>
      </draggable>
    </ion-col>

    <ion-col size-xs="12" size-md="4">
      <h3 class="center">En progreso</h3>
      <div class="border-column"></div>
      <draggable
        :list="progress"
        group="people"
        item-key="name"
        @change="eventKanban({ evt: $event, columnName: 'progress' })"
      >
        <template #item="{ element }">
          <ion-item
            button
            class="transparent"
            lines="full"
            style="cursor: move"
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
            <ion-label>{{ element.name }} </ion-label>
          </ion-item>
        </template>
      </draggable>
    </ion-col>

    <ion-col size-xs="12" size-md="4">
      <h3 class="center">Finalizado</h3>
      <div class="border-column"></div>
      <draggable
        :list="finalized"
        group="people"
        item-key="name"
        @change="eventKanban({ evt: $event, columnName: 'finalized' })"
      >
        <template #item="{ element }">
          <ion-item
            button
            class="transparent"
            lines="full"
            style="cursor: move"
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
            <ion-label>{{ element.name }} </ion-label>
          </ion-item>
        </template>
      </draggable>
    </ion-col>
  </ion-row>
</template>

<script setup lang="ts">
import { popoverController, IonRow, IonCol } from "@ionic/vue";
import { onMounted, ref, watch } from "vue";
import draggable from "vuedraggable/src/vuedraggable";

// interface
import { TaskItem } from "@/store/taskStore";

interface Item {
  id: number;
  name: string;
  position: number;
}

// components
import RightMenuTaskComponent from "./RightMenuTaskComponent.vue";

const emits = defineEmits(["update", "delete", "toggleCheck", "kanbanUpdate"]);
const props = defineProps({
  taskData: { type: Array<TaskItem>, default: () => [] },
});

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
  taskId: number;
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
      id: number;
    };
    emits("kanbanUpdate", data2);
  }
}

function updateTask(params: { idTask: number }) {
  const { idTask } = params;
  emits("update", { idTask });
}

function removeTask(params: { id: number }) {
  const { id } = params;
  emits("delete", { id });
}

function eventKanban(params: { evt: any; columnName: string }) {
  const { evt, columnName } = params;

  const data = { columnName } as {
    position: number;
    columnName: string;
    id: number;
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
.centered-button {
  text-align: center;
}

.border-column {
  border-bottom: 1px solid var(--ion-color-primary);
}
</style>
