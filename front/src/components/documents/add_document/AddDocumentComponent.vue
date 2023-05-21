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
          <!-- button desktop options -->
          <ion-button
            v-if="isPlatform('desktop')"
            id="popover-document-desktop-menu-opt"
            :strong="true"
          >
            <ion-icon :icon="ellipsisHorizontalOutline"></ion-icon>
          </ion-button>

          <!-- button mobile options -->
          <ion-button
            v-if="!isPlatform('desktop')"
            id="modal-document-mobile-menu-opt"
            :strong="true"
          >
            <ion-icon :icon="ellipsisHorizontalOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- reorder -->
      <ion-toolbar v-if="isReorderDisabled == false">
        <ion-buttons slot="end">
          <ion-button @click="toggleReorder()">
            Terminar reordenamiento
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
      <section>
        <ion-row class="ion-padding">
          <ion-col>
            <ion-input
              label="Titulo"
              label-placement="floating"
              placeholder="Nuevo documento"
              :value="
                useDocument().getUserDocument({ documentId: documentUrl })
                  ?.title
              "
              @ion-blur="updateTitle({ tltle: $event.target.value as string })"
            ></ion-input>
          </ion-col>
        </ion-row>
      </section>

      <!-- elements -->
      <section>
        <ion-reorder-group
          v-if="
            useDocument().getUserDocument({
              documentId: documentUrl,
            })?.elements ?? [].length > 0
          "
          :disabled="isReorderDisabled"
          @ion-item-reorder="reorderElements($event)"
        >
          <ion-list
            v-for="(element, indexElement) in useDocument().getUserDocument({
              documentId: documentUrl,
            })?.elements"
            :key="indexElement"
          >
            <ion-list-header v-if="isReorderDisabled == false">
              <ion-button fill="clear">
                <ion-reorder></ion-reorder>
              </ion-button>
            </ion-list-header>

            <ion-row>
              <ion-col class="elements">
                <ion-card v-if="element.type == 'note'" id="card-element">
                  <!-- note component -->
                  <NoteComponent
                    :data="element.data as Note"
                    @update-value="
                      updateNoteValue({
                        data: { value: $event },
                        index: indexElement,
                        documentId,
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
                    @update-reminder="
                      setNoteReminders({
                        data: {
                          dateStart: $event.data.dateStart,
                          dateEnd: $event.data.dateEnd,
                        },
                        index: indexElement,
                        documentId,
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
              </ion-col>
            </ion-row>
          </ion-list>
        </ion-reorder-group>
      </section>

      <!-- add element -->
      <ion-item
        v-if="isReorderDisabled"
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

      <!-- popovers -->
      <ion-popover
        trigger="popover-document-desktop-menu-opt"
        trigger-action="click"
        style="--width: 22rem"
        mode="md"
        @ion-popover-will-dismiss="
          setOptionMainMenu({
            option: $event.detail.data ? $event.detail.data.option : undefined,
          })
        "
      >
        <ion-content>
          <MenuOptComponent :document-id="documentId" />
        </ion-content>
      </ion-popover>

      <!-- modals -->
      <ion-modal
        ref="modal"
        trigger="modal-document-mobile-menu-opt"
        :mode="isPlatform('ios') ? 'ios' : 'md'"
        @will-dismiss="
          setOptionMainMenu({
            option: $event.detail.data ? $event.detail.data.option : undefined,
          })
        "
      >
        <ion-content>
          <ion-page v-if="!isPlatform('desktop')">
            <MenuOptComponent :document-id="documentId" />
          </ion-page>

          <MenuOptComponent v-else :document-id="documentId" />
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
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
  IonPopover,
  IonModal,
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
  ElementData,
  OptionsMainMenuDocument,
  TypeDocumentElement,
} from "../../../utils/types";
import MenuOptComponent from "./menu-document/MenuOptComponent.vue";
import { isPlatform } from "@ionic/vue";
import { Note } from "@/utils/interfaces";
// import { useReminders } from "@/composables/useReminders";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const pageTitle = "Agregar documento";
const isDisabled = ref(true);
const toggleReorder = () => {
  isDisabled.value = !isDisabled.value;
};
const isReorderDisabled = isDisabled;
let documentUrl = route.params.url as string;
let documentId = "";

// functions
const start = async () => {
  await useDocument().loadDocument({ elementId: documentUrl });
  documentId = useDocument().getUserDocument({ documentUrl })?.id ?? "";
};

const removeElement = (params: { index: number; documentId: string }) => {
  const index = params.index;
  const documentId = params.documentId;

  useDocument().deleteElement({ index, documentId });
};

const openPopoverAddElement = async (params: { ev: Event }) => {
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
    insertElement({ type, id });
  });
};

const insertElement = (params: { id: number; type: TypeDocumentElement }) => {
  const type = params.type;
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
};

const updateElement = (params: { data: ElementData; index: number }) => {
  const data = params.data;
  const index = params.index;
  const documentId = documentUrl;
  const document = useDocument().getUserDocument({ documentId });

  if (!document?.elements) return;
  document.elements[index].data = data;

  useDocument().updateDocument({
    document,
  });
};

const updateNoteValue = (params: {
  data: { value: string };
  index: number;
  documentId: string;
}) => {
  const data = params.data;
  const index = params.index;
  const documentId = params.documentId;
  useDocument().updateNoteValue({ data, index, documentId });
};

const closePage = () => {
  router.go(-1);
};

const reorderElements = (event: CustomEvent) => {
  const documentId = documentUrl;
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
};

const updateTitle = async (params: { tltle: string }) => {
  const title = params.tltle;
  const document = useDocument().getUserDocument({ documentId });
  const url = `${title.replace(" ", "-")}-${documentId}`;

  if (!document) return;
  document.title = title;
  document.url = url;

  await useDocument().updateDocument({
    document,
  });

  router.replace(url);
};

const setOptionMainMenu = (params: {
  option: OptionsMainMenuDocument | undefined;
  data?: any;
}) => {
  const option = params.option;
  if (option == undefined) return;
  // const data = params.data;

  if (option == "order") toggleReorder();
};

const setNoteReminders = async (params: {
  data: { dateStart: string; dateEnd: string };
  index: number;
  documentId: string;
}) => {
  const data = params.data;
  const index = params.index;
  const documentId = params.documentId;
  await useDocument().updateNoteReminder({ data, index, documentId });
  // useReminders().loadReminders();
};

// mountded
if (documentUrl) {
  documentUrl = documentUrl;
  start();
}
</script>

<style scoped>
@media only screen and (min-width: 992px) {
  .elements {
    display: flex;
    justify-content: center;
  }
  .elements > #card-element {
    width: 60%;
  }
}
</style>
