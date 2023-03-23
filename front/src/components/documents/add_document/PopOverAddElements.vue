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

<script lang="ts">
import { IonContent, popoverController } from "@ionic/vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "PopoverAddElementsComponent",
  components: { IonContent },

  data() {
    return {
      elements: [
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
      ] as Array<{ name: string; text: string; type: string }>,
    };
  },

  methods: {
    selectOption(params: {
      element: { name: string; text: string; type: string };
    }) {
      const name = params.element.name;
      const text = params.element.text;
      const type = params.element.type;
      popoverController.dismiss({ name, text, type });
    },
  },
});
</script>
