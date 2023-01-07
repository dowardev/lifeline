<template>
  <ion-content>
    <ion-item>
      <ion-label>Posicision</ion-label>
      <ion-select v-model="position">
        <ion-select-option value="before">Antes</ion-select-option>
        <ion-select-option value="after">Despues</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item
      v-for="(element, index) in elements"
      :key="index"
      @click="selectOption({ element, position })"
    >
      <ion-label>{{ element.text }}</ion-label>
    </ion-item>
  </ion-content>
</template>

<script lang="ts">
import { IonContent, popoverController,IonSelect,IonSelectOption } from "@ionic/vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "PopoverAddElementsComponent",
  components: { IonContent,IonSelect,IonSelectOption },

  data() {
    return {
      elements: [
        { name: "note", text: "Nota" },
        { name: "richText", text: "Texto enriquecido" },
        // { name: "table", text: "Tabla" },
        {
          name: "list",
          text: "Lista",
        },
        {
          name: "todo",
          text: "Tareas",
        },
      ],
      position: "after" as "after" | "before",
    };
  },

  methods: {
    selectOption(params: {
      element: { name: string; text: string };
      position: "after" | "before";
    }) {
      const element = params.element;
      const position = params.position;
      popoverController.dismiss({ element, position });
    },
  },
});
</script>
