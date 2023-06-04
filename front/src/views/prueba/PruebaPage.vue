<template>
  <div class="drag-drop-container">
    <div
      class="column"
      v-for="column in columns"
      :key="column.id"
      :data-column-id="column.id"
    >
      <h2>{{ column.title }}</h2>
      <div
        class="item"
        v-for="item in column.items"
        :key="item.id"
        :draggable="true"
        @dragstart="dragStart(item, column.id)"
      >
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Column {
  id: number;
  title: string;
  items: Item[];
}

interface Item {
  id: number;
  title: string;
}

const columns = ref<Column[]>([
  {
    id: 1,
    title: "Pendiente",
    items: [
      { id: 1, title: "Tarea 1" },
      { id: 2, title: "Tarea 2" },
      { id: 3, title: "Tarea 3" },
    ],
  },
  {
    id: 2,
    title: "En Progreso",
    items: [
      { id: 4, title: "Tarea 4" },
      { id: 5, title: "Tarea 5" },
    ],
  },
  {
    id: 3,
    title: "Finalizado",
    items: [{ id: 6, title: "Tarea 6" }],
  },
]);

let draggedItem: Item | null = null;
let sourceColumnId: number | null = null;

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

onMounted(() => {
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
</script>

<style scoped>
.drag-drop-container {
  display: flex;
  justify-content: space-between;
}

.column {
  flex-basis: 30%;
  border: 1px solid #ccc;
  padding: 10px;
}

.item {
  margin-bottom: 10px;
  padding: 5px;
  background-color: #f0f0f0;
}
</style>
