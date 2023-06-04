<template>
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
          @contextmenu.prevent="
            openPopoverRightTaskMenu({
              ev: $event,
              taskId: task.id,
            })
          "
          @press="
            openPopoverRightTaskMenu({
              ev: $event,
              taskId: task.id,
            })
          "
        >
          <ion-checkbox
            :checked="task.checked"
            label-placement="end"
            justify="start"
            @ion-change="toggleCheckTask({ id: task.id })"
            >{{ task.name }}</ion-checkbox
          >

          <ion-button
            v-if="showButtonsOptionsTask === parseInt(task.id)"
            @click="updateTask({ idTask: task.id })"
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
          @contextmenu.prevent="
            openPopoverRightTaskMenu({
              ev: $event,
              taskId: task.id,
            })
          "
          @press="
            openPopoverRightTaskMenu({
              ev: $event,
              taskId: task.id,
            })
          "
        >
          <ion-checkbox
            :checked="task.checked"
            label-placement="end"
            justify="start"
            @ion-change="toggleCheckTask({ id: task.id })"
            >{{ task.name }}</ion-checkbox
          >

          <ion-button
            v-if="showButtonsOptionsTask === parseInt(task.id)"
            @click="updateTask({ idTask: task.id })"
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
</template>

<script setup lang="ts">
import { IonCheckbox, IonLabel, popoverController } from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { onMounted, ref, watch } from "vue";

// interface
import { Task } from "@/utils/interfaces";

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

// watch
const handleResize = () => {
  screenWidth.value = window.innerWidth;
};
watch(
  () => props.taskData,
  (tasks) => {
    if (!tasks) return;
    listTasks.value.complete = [];
    listTasks.value.incomplete = [];

    tasks.forEach((task) => {
      if (task.checked) {
        listTasks.value.complete.push(task);
      } else {
        listTasks.value.incomplete.push(task);
      }
    });
  }
);

// mounted
onMounted(() => {
  window.addEventListener("resize", handleResize);
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
</script>
