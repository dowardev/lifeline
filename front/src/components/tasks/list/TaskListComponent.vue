<template>
  <ion-row>
    <ion-col
      :class="{ 'vertical-border': !isPlatform('mobile') }"
      size-xs="12"
      size-lg="6"
      style="height: 50dvh"
    >
      <ion-list class="transparent">
        <ion-list-header>
          <ion-label class="center">Pendiente</ion-label>
        </ion-list-header>

        <div v-if="listTasks.incomplete.length > 0">
          <ion-item
            v-for="task in listTasks.incomplete"
            :key="task.name"
            class="transparent element-selected"
            style="margin-bottom: 12px"
            lines="full"
            @mouseenter="showButtonsOptionsTask = task.id"
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
              v-if="showButtonsOptionsTask === task.id"
              @click="updateTask({ idTask: task.id })"
              ><ion-icon :icon="createOutline"></ion-icon
            ></ion-button>

            <ion-button
              v-if="showButtonsOptionsTask === task.id"
              fill="clear"
              color="danger"
              @click="removeTask({ id: task.id })"
              ><ion-icon :icon="trashOutline"></ion-icon
            ></ion-button>
          </ion-item>
        </div>
      </ion-list>
    </ion-col>

    <ion-col style="padding-left: 12px">
      <ion-list class="transparent">
        <ion-list-header>
          <ion-label class="center">Completado</ion-label>
        </ion-list-header>

        <div v-if="listTasks.complete.length > 0">
          <ion-item
            v-for="task in listTasks.complete"
            :key="task.name"
            class="transparent element-selected"
            style="margin-bottom: 12px"
            lines="full"
            @mouseenter="showButtonsOptionsTask = task.id"
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
              v-if="showButtonsOptionsTask === task.id"
              @click="updateTask({ idTask: task.id })"
              ><ion-icon :icon="createOutline"></ion-icon
            ></ion-button>

            <ion-button
              v-if="showButtonsOptionsTask === task.id"
              fill="clear"
              color="danger"
              @click="removeTask({ id: task.id })"
              ><ion-icon :icon="trashOutline"></ion-icon
            ></ion-button>
          </ion-item>
        </div>
      </ion-list>
    </ion-col>
  </ion-row>
  <!-- end tasks -->
</template>

<script setup lang="ts">
import {
  IonCheckbox,
  IonLabel,
  isPlatform,
  popoverController,
} from "@ionic/vue";
import { createOutline, trashOutline } from "ionicons/icons";
import { onMounted, ref, watch } from "vue";

// interface
import { TaskItem } from "@/store/taskStore";

// components
import RightMenuTaskComponent from "./RightMenuTaskComponent.vue";

const emits = defineEmits(["update", "remove", "toggleCheck"]);
const props = defineProps({
  taskData: { type: Array<TaskItem>, default: () => [] },
});

const showButtonsOptionsTask = ref(-1);
const screenWidth = ref(window.innerWidth);
const listTasks = ref({
  complete: [] as TaskItem[],
  incomplete: [] as TaskItem[],
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
function toggleCheckTask(params: { id: number }) {
  const { id } = params;
  emits("toggleCheck", { idTask: id });
}

async function openPopoverRightTaskMenu(params: {
  ev: CustomEvent;
  taskId: number;
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

function updateTask(params: { idTask: number }) {
  const { idTask } = params;
  emits("update", { idTask });
}

function removeTask(params: { id: number }) {
  const { id } = params;
  emits("remove", { id });
}
</script>

<style scoped>
.element-selected {
  border: 1px solid var(--ion-color-primary);
}
.vertical-border {
  border-right: 1px solid var(--ion-color-secondary);
  padding-right: 12px;
}
</style>
