<template>
  <ion-content>
    <ion-item
      v-for="(element, index) in elements"
      :key="index"
      button
      @click="selectOption({ element })"
    >
      <ion-label>{{ element.text }}</ion-label>
    </ion-item>
  </ion-content>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import { IonContent, IonItem, IonLabel, popoverController } from "@ionic/vue";

// 2. Controllers / Composables
// (none)

// 3. Components
// (none)

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const elements = [
  { name: "note", text: "Nota", type: "note" },
  { name: "richText", text: "richText", type: "richText" },
  {
    name: "list",
    text: "Lista",
    type: "list",
  },
  {
    name: "todo",
    text: "Tareas",
    type: "todo",
  },
] as Array<{ name: string; text: string; type: string }>;

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
const selectOption = (params: {
  element: { name: string; text: string; type: string };
}): void => {
  const name = params.element.name;
  const text = params.element.text;
  const type = params.element.type;
  popoverController.dismiss({ name, text, type });
};
</script>
