<template>
  <div v-for="(task, indexTask) in todo" :key="indexTask">
    <ion-item
      :ref="`item-todo-${new Date().getTime()}`"
      lines="none"
      button
      @mouseenter="showButtonsOptionTODO = indexTask"
      @mouseleave="showButtonsOptionTODO = -1"
      @click="showButtonsOptionTODO = indexTask"
    >
      <ion-label>{{ task.title }} {{ indexTask + 1 }}</ion-label>
      <!-- reschedule element -->
      <ion-button v-if="showButtonsOptionTODO === indexTask" fill="clear"
        ><ion-icon :icon="stopwatchOutline"></ion-icon
      ></ion-button>

      <!-- trask element -->
      <ion-button
        v-if="showButtonsOptionTODO === indexTask"
        fill="clear"
        color="danger"
        ><ion-icon :icon="trashOutline"></ion-icon
      ></ion-button>
    </ion-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { stopwatchOutline, trashOutline } from "ionicons/icons";

const showButtonsOptionTODO = ref(-1);
const todo = [
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
  { title: "Terminar proyecto" },
];
</script>
