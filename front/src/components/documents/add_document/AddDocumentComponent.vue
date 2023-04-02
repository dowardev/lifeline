<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closePage()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>

        <ion-buttons slot="end">
          <div v-if="isPlatform('desktop')">
            <!-- order elements -->
            <ion-button
              :disabled="
                (
                  useDocument().getUserDocument({ documentId: documentUrl })
                    ?.elements ?? []
                ).length <= 1
              "
              @click="toggleReorder()"
            >
              <ion-icon :icon="moveOutline"></ion-icon>
            </ion-button>

            <!-- reminders -->
            <ion-button @click="openModalReminderDocument()">
              <ion-icon :icon="timeOutline"></ion-icon>
            </ion-button>
          </div>

          <ion-button :strong="true" @click="openModalMenuOpt()">
            <ion-icon :icon="ellipsisHorizontalOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content
      v-if="
        documentUrl != undefined &&
        useDocument().getUserDocument({ documentId: documentUrl }) != undefined
      "
      :fullscreen="true"
    >
      <ion-item>
        <ion-input
          label="Titulo"
          label-placement="floating"
          placeholder="Nuevo documento"
          :value="
            useDocument().getUserDocument({ documentId: documentUrl })?.title
          "
          @ion-blur="updateTitle({ tltle: $event.target.value as string })"
        ></ion-input>
      </ion-item>

      <ion-item lines="none">
        <ion-button
          v-if="isDisabled == false && !isPlatform('desktop')"
          slot="end"
          fill="clear"
          @click="toggleReorder()"
        >
          Terminar reordenamiento
        </ion-button>
      </ion-item>

      <!-- elements -->
      <ion-list>
        <ion-reorder-group
          :disabled="isDisabled"
          @ion-item-reorder="reorderElements($event)"
        >
          <ion-list
            v-for="(element, indexElement) in useDocument().getUserDocument({
              documentId: documentUrl,
            })?.elements"
            :key="indexElement"
          >
            <div style="float: left">
              <ion-button v-if="isDisabled == false" fill="clear">
                <ion-reorder></ion-reorder>
              </ion-button>
            </div>

            <ion-card v-if="element.type == 'note'">
              <NoteComponent
                :data="element.data"
                @change-value="
                  updateElement({
                    data: $event,
                    index: indexElement,
                  })
                "
                @add-element="
                  openPopoverAddElement({
                    ev: $event,
                  })
                "
                @remove-note="
                  removeElement({
                    index: indexElement,
                    documentId: useDocument().getUserDocument({
                      documentId: documentUrl!,
                    })?.id!,
                  })
                "
              ></NoteComponent>
            </ion-card>

            <!-- <TableComponent v-if="element.element.name == 'table'"></TableComponent> -->

            <ion-card v-if="element.type == 'list'">
              <ListComponent></ListComponent>
            </ion-card>

            <ion-card v-if="element.type == 'todo'">
              <TodoComponent></TodoComponent>
            </ion-card>

            <ion-card v-if="element.type == 'richtext'">
              <RichTextEditor :content-editable="true"></RichTextEditor>
            </ion-card>
          </ion-list>
        </ion-reorder-group>
      </ion-list>

      <!-- add element -->
      <ion-item
        v-if="isDisabled"
        button
        @click="
          openPopoverAddElement({
            ev: $event,
          })
        "
      >
        <ion-label>Agregar elemento</ion-label>
        <ion-button fill="clear">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-button>
      </ion-item>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonItem,
  IonLabel,
  IonList,
  IonReorder,
  IonReorderGroup,
  popoverController,
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  modalController,
  IonInput,
} from "@ionic/vue";
import {
  pricetagsOutline,
  timeOutline,
  trashOutline,
  addOutline,
  closeOutline,
  saveOutline,
  ellipsisHorizontalOutline,
  moveOutline,
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

import { useDocument } from "../../../composables/useDocument";
import { format } from "date-fns";
import { useNote } from "../../../composables/useNote";
import {
  DocumentElements,
  ElementData,
  OptionsMainMenuDocument,
  TypeDocumentElement,
} from "../../../utils/types";
import MenuOptComponent from "./MenuOptComponent.vue";
import { isPlatform } from "@ionic/vue";
import DocumentReminderComponent from "./DocumentReminderComponent.vue";

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
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonInput,
  },

  setup() {
    return {
      pageTitle: "Agregar documento",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      addOutline,
      closeOutline,
      saveOutline,
      format,
      useNote,
      useDocument,
      ellipsisHorizontalOutline,
      isPlatform,
      moveOutline,
    };
  },

  data() {
    let isDisabled = ref(true);
    const toggleReorder = () => {
      isDisabled.value = !isDisabled.value;
      // useDocument().updateDocument({
      //   document: this.elementsBak as any
      // });
      console.log(this.elementsBak);
    };
    return {
      isDisabled,
      toggleReorder,
      documentUrl: "",
      documentId: "",
    };
  },

  mounted() {
    const documentUrl = this.$route.params.url as string;
    if (documentUrl) {
      this.documentUrl = documentUrl;
      this.start();
    }
  },

  methods: {
    async start() {
      const documentUrl = this.documentUrl;
      await useDocument().loadDocument({ elementId: documentUrl });
      this.documentId =
        useDocument().getUserDocument({ documentUrl })?.id ?? "";
    },

    removeElement(params: { index: number; documentId: string }) {
      const index = params.index;
      const documentId = params.documentId;

      useDocument().deleteElement({ index, documentId });
    },

    async openPopoverAddElement(params: { ev: Event }) {
      const ev = params.ev;

      const popover = await popoverController.create({
        component: PopOverAddElements,
        event: ev,
      });
      await popover.present();

      await popover.onDidDismiss().then((response) => {
        if (response.data == undefined) return;

        const type = response.data.type;
        const id = Date.now();
        this.insertElement({ type, id });
      });
    },

    insertElement(params: { id: number; type: TypeDocumentElement }) {
      const type = params.type;
      const documentId = this.documentId;
      if (!documentId) return;

      const element = {
        type,
        documentId,
        data: undefined,
      };

      useDocument().insertElement({ documentId, element });

      // TODO: improve code
      const document = useDocument().getUserDocument({ documentId });
      if (!document?.elements) return;
      useDocument().updateDocument({
        document,
      });
    },

    updateElement(params: { data: ElementData; index: number }) {
      const data = params.data;
      const index = params.index;
      const documentId = this.documentUrl;
      const document = useDocument().getUserDocument({ documentId });

      if (!document?.elements) return;
      document.elements[index].data = data;

      useDocument().updateDocument({
        document,
      });
    },

    closePage() {
      this.$router.go(-1);
    },

    reorderElements(event: CustomEvent) {
      const documentId = this.documentUrl;
      let document = useDocument().getUserDocument({ documentId });
      const oldPosition = event.detail.from;
      const newPosition = event.detail.to;
      if (!document) return;

      if (document.elements != undefined) {
        const elementBak = document.elements[oldPosition];
        if (oldPosition < newPosition) {
          const arr = document.elements;
          const index = newPosition;
          arr.splice(index + 1, 0, elementBak);
          document.elements.splice(oldPosition, 1);
          document.elements = arr;
        } else {
          const arr = document.elements;
          const index = newPosition;
          arr.splice(index, 0, elementBak);
          document.elements.splice(oldPosition + 1, 1);
          document.elements = arr;
        }
      }
      event.detail.complete();
    },

    toggleReorder2() {
      this.isDisabled = !this.isDisabled;
      if (this.isDisabled == true) {
        useDocument().updateDocument({
          document: this.elementsBak,
        });
      }
    },

    async updateTitle(params: { tltle: string }) {
      const title = params.tltle;
      const documentId = this.documentId;
      const document = useDocument().getUserDocument({ documentId });
      const url = `${title.replace(" ", "-")}-${documentId}`;

      if (!document) return;
      document.title = title;
      document.url = url;

      await useDocument().updateDocument({
        document,
      });

      this.$router.replace(url);
    },

    async openModalMenuOpt() {
      const modal = await modalController.create({
        component: MenuOptComponent,
        initialBreakpoint: 0.75,
        breakpoints: [0, 0.25, 0.5, 0.75],
        componentProps: { documentId: this.documentUrl },
      });
      modal.present();

      const { data, role } = await modal.onWillDismiss();
      if (role === "confirm") {
        const option = data.option;
        const dataOption = data.data ? data : undefined;
        this.setOptionMainMenu({ option, data: dataOption });
      }
    },

    setOptionMainMenu(params: { option: OptionsMainMenuDocument; data?: any }) {
      const option = params.option;
      const data = params.data;

      console.log(option);
      if (option == "order") this.toggleReorder();
    },

    async openModalReminderDocument() {
      const modal = await modalController.create({
        component: DocumentReminderComponent,
        initialBreakpoint: 0.75,
        breakpoints: [0, 0.25, 0.5, 0.75],
      });
      modal.present();
    },
  },
});
</script>
