<template>
  <ion-item lines="none">
    <ion-button slot="end" fill="clear" @click="toggleReorder()">
      Ordenar elementos
    </ion-button>
  </ion-item>

  <ion-list>
    <ion-reorder-group
      :disabled="isDisabled"
      @ion-item-reorder="handleReorder($event)"
    >
      <ion-list v-for="(element, index) in elementsSelected" :key="index">
        <ion-list-header>
          <ion-label>{{ element.element.text }}</ion-label>

          <ion-button
            v-if="isDisabled"
            @click="openPopover({ ev: $event, index })"
          >
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>

          <ion-button
            v-if="isDisabled"
            @click="removeElement({ id: element.id })"
          >
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>

          <ion-button v-if="isDisabled == false">
            <ion-reorder slot="end"></ion-reorder>
          </ion-button>
        </ion-list-header>

        <ion-card v-if="element.element.name == 'note'">
          <NoteComponent></NoteComponent>
        </ion-card>

        <!-- <TableComponent v-if="element.element.name == 'table'"></TableComponent> -->

        <ion-card v-if="element.element.name == 'list'">
          <ListComponent></ListComponent>
        </ion-card>

        <ion-card v-if="element.element.name == 'todo'">
          <TodoComponent></TodoComponent>
        </ion-card>

        <ion-card v-if="element.element.name == 'richText'">
          <RichTextEditor :content-editable="true"></RichTextEditor>
        </ion-card>
      </ion-list>
    </ion-reorder-group>
  </ion-list>

  <!-- add element -->
  <ion-item
    v-if="isDisabled"
    button
    @click="openPopover({ ev: $event, index: elementsSelected.length - 1 })"
  >
    <ion-label>Agregar elemento</ion-label>
    <ion-button fill="clear">
      <ion-icon :icon="addOutline"></ion-icon>
    </ion-button>
  </ion-item>
</template>

<script lang="ts">
import {
  IonItem,
  IonLabel,
  IonList,
  IonReorder,
  IonReorderGroup,
  popoverController,
} from "@ionic/vue";
import {
  pricetagsOutline,
  timeOutline,
  trashOutline,
  addOutline,
  closeOutline,
} from "ionicons/icons";
import { defineComponent, ref } from "vue";
import PopOverAddElements from "./PopOverAddElements.vue";
// elements
import NoteComponent from "../note/NoteComponent.vue";
// import TableComponent from "../table/TableComponent.vue";
import ListComponent from "../list/ListComponent.vue";
import TodoComponent from "../todo/TodoComponent.vue";

// markdown
import RichTextEditor from "../rich_text/RichTextComponent.vue";

export default defineComponent({
  name: "AddDocumentComponent",
  components: {
    IonItem,
    IonLabel,
    IonList,
    IonReorder,
    IonReorderGroup,
    NoteComponent,
    // TableComponent,
    ListComponent,
    TodoComponent,
    RichTextEditor,
  },

  setup() {
    let isDisabled = ref(true);

    const handleReorder = (event: CustomEvent) => {
      console.log(
        "Dragged from index",
        event.detail.from,
        "to",
        event.detail.to
      );

      event.detail.complete();
    };

    const toggleReorder = () => {
      isDisabled.value = !isDisabled.value;
    };
    return {
      pageTitle: "Home",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      isDisabled,
      handleReorder,
      toggleReorder,
      addOutline,
      closeOutline,
    };
  },

  data() {
    return {
      elementsSelected: [] as Array<{
        element: { name: string; text: string };
        id: number;
      }>,
    };
  },

  methods: {
    removeElement(params: { id: number }) {
      const id = params.id;

      const elements = this.elementsSelected.filter((element) => {
        if (element.id != id) return element;
      });

      this.elementsSelected = elements;
    },

    async openPopover(params: { ev: Event; index: number }) {
      const ev = params.ev;
      const index = params.index;

      const popover = await popoverController.create({
        component: PopOverAddElements,
        event: ev,
      });
      await popover.present();

      await popover.onDidDismiss().then((response) => {
        const element = response.data.element;
        const position = response.data.position;
        const id = Date.now();
        this.insertElement({ element, position, id, index });
      });
    },

    insertElement(params: {
      element: { name: string; text: string };
      id: number;
      position: "before" | "after";
      index: number;
    }) {
      const element = params.element;
      const id = params.id;
      const position = params.position;
      const index = params.index;

      if (position == "after") {
        this.elementsSelected.push({
          element: element as any,
          id: Date.now(),
        });
      } else {
        this.elementsSelected.splice(index, 0, { element, id });
      }
    },
  },
});
</script>
