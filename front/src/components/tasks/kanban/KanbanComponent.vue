<template>
  <ion-row
    :class="{ center: screenWidth >= 768 }"
    class="ion-padding-start ion-padding-end"
  >
    <ion-col size-xs="12" size-md="6">
      <div class="drag-drop-container">
        <div
          v-for="column in columns"
          :key="column.id"
          class="column"
          :data-column-id="column.id"
        >
          <h2>{{ column.title }}</h2>
          <ion-card
            v-for="item in column.items"
            :key="item.id"
            class="item"
            :draggable="true"
            @dragstart="dragStart(item, column.id)"
          >
            <ion-card-content>{{ item.title }}</ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-col>
  </ion-row>
  <!-- end tasks -->
</template>

<script setup lang="ts">
import { IonCheckbox, IonLabel, popoverController } from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { onMounted, ref, watch } from "vue";

// interface
import { Task } from "@/utils/interfaces";
interface Column {
  id: number;
  title: string;
  items: Item[];
}

interface Item {
  id: number;
  title: string;
}

// components
import RightMenuTaskComponent from "./RightMenuTaskComponent.vue";

const emits = defineEmits(["update", "remove", "toggleCheck"]);
const props = defineProps({
  taskData: { type: Array<Task>, default: () => [] },
});

const showButtonsOptionsTask = ref(-1);
const screenWidth = ref(window.innerWidth);
const listTasks = ref({
  complete: [] as Task[],
  incomplete: [] as Task[],
});
const columns = ref<Column[]>([
  {
    id: 1,
    title: "Pendiente",
    items: [],
  },
  {
    id: 2,
    title: "En Progreso",
    items: [],
  },
  {
    id: 3,
    title: "Finalizado",
    items: [],
  },
]);

let draggedItem: Item | null = null;
let sourceColumnId: number | null = null;

// watch
const handleResize = () => {
  screenWidth.value = window.innerWidth;
};
watch(
  () => props.taskData,
  (tasks) => {
    if (!tasks) return;
    columns.value[0].items = [];
    columns.value[1].items = [];
    columns.value[2].items = [];

    tasks.forEach((task) => {
      if (task.kanbanColumn == undefined || task.kanbanColumn == "pending") {
        columns.value[0].items.push({
          id: parseInt(task.id),
          title: task.name,
        });
      }
    });
  }
);

// mounted
onMounted(() => {
  window.addEventListener("resize", handleResize);
  const containers = document.querySelectorAll(".drag-drop-container .column");

  containers.forEach((container) => {
    container.addEventListener("dragover", (event: Event) => {
      allowDrop(event as DragEvent);
    });

    container.addEventListener("drop", (event: Event) => {
      const columnId = parseInt(container.getAttribute("data-column-id")!);
      dragOver(event as DragEvent, columnId);
    });
  });
});

// functions
function toggleCheckTask(params: { id: string }) {
  const { id } = params;
  emits("toggleCheck", { idTask: id });
}

async function openPopoverRightTaskMenu(params: {
  ev: CustomEvent;
  taskId: string;
}) {
  const taskId = params.taskId;
  const ev = params.ev;

  const popover = await popoverController.create({
    component: RightMenuTaskComponent,
    event: ev,
    showBackdrop: false,
  });
  await popover.present();

  const { role, data } = await popover.onDidDismiss();
  if (role == "confirm" && data.option == "delete") removeTask({ id: taskId });

  if (role == "confirm" && data.option == "edit")
    updateTask({ idTask: taskId });
}

function updateTask(params: { idTask: string }) {
  const { idTask } = params;
  emits("update", { idTask });
}

function removeTask(params: { id: string }) {
  const { id } = params;
  emits("remove", { id });
}

function dragStart(item: Item, columnId: number) {
  draggedItem = item;
  sourceColumnId = columnId;
}

function dragOver(event: DragEvent, columnId: number) {
  if (draggedItem && sourceColumnId !== null) {
    event.preventDefault();
    const sourceColumnIndex = columns.value.findIndex(
      (column) => column.id === sourceColumnId
    );
    const targetColumnIndex = columns.value.findIndex(
      (column) => column.id === columnId
    );

    if (sourceColumnIndex === -1 || targetColumnIndex === -1) {
      return;
    }

    const sourceColumn = columns.value[sourceColumnIndex];
    const targetColumn = columns.value[targetColumnIndex];

    const itemIndex = sourceColumn.items.findIndex(
      (item) => item.id === draggedItem!.id
    );

    if (itemIndex !== -1) {
      sourceColumn.items.splice(itemIndex, 1);
      targetColumn.items.push(draggedItem);
      draggedItem = null;
      sourceColumnId = null;
    }
  }
}

function allowDrop(event: DragEvent) {
  event.preventDefault();
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
}
</style>
