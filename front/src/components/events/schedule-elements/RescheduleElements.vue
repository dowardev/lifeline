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
// 1. Imports (ionic/vue/ionicons)
import { ref } from "vue";
import { stopwatchOutline, trashOutline } from "ionicons/icons";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
// (none)

// 6. Vars and const
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

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
// (none)
</script>
