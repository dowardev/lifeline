<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closeModal()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>Agregar documento</ion-title>

        <ion-buttons slot="end">
          <section>
            <ion-button id="open-modal-reminder" :strong="true">
              <ion-icon :icon="timeOutline"></ion-icon>
            </ion-button>

            <ion-modal
              ref="modalReminder"
              trigger="open-modal-reminder"
              :initial-breakpoint="0.65"
              :breakpoints="[0, 0.25, 0.5, 0.75]"
            >
              <ion-header class="ion-no-border" mode="ios">
                <ion-toolbar>
                  <ion-buttons slot="start">
                    <ion-button
                      @click="
                        ($refs as any).modalReminder.$el.dismiss(null, 'cancel')
                      "
                    >
                      <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                  </ion-buttons>

                  <ion-title>Vencimiento</ion-title>

                  <ion-buttons slot="end">
                    <ion-button :strong="true"
                      ><ion-icon :icon="saveOutline"></ion-icon
                    ></ion-button>
                  </ion-buttons>
                </ion-toolbar>
              </ion-header>

              <ion-content class="ion-padding">
                <!-- date start -->
                <section>
                  <ion-item button @click="openPopoverReminderStart">
                    <ion-label>Inicio</ion-label>
                    <ion-label slot="end">{{
                      format(new Date(dateReminderStart), "Pp")
                    }}</ion-label>
                  </ion-item>

                  <ion-popover
                    :is-open="popoverReminderStartOpen"
                    :event="popoverReminderStartEvent"
                    @did-dismiss="popoverReminderStartOpen = false"
                  >
                    <ion-content class="ion-padding">
                      <ion-datetime
                        :show-default-buttons="true"
                        cancel-text="Cancelar"
                        done-text="Confirmar"
                        locale="en-GB-u-hc-h12"
                        @ion-change="
                          dateReminderStart = $event.detail.value as string
                        "
                      ></ion-datetime>
                    </ion-content>
                  </ion-popover>
                </section>

                <!-- date end -->
                <section>
                  <ion-item button @click="openPopoverReminderEnd">
                    <ion-label>Final</ion-label>
                    <ion-label slot="end">{{
                      format(new Date(dateReminderEnd), "Pp")
                    }}</ion-label>
                  </ion-item>

                  <ion-popover
                    :is-open="popoverReminderEndOpen"
                    :event="popoverReminderEndEvent"
                    @did-dismiss="popoverReminderEndOpen = false"
                  >
                    <ion-content class="ion-padding">
                      <ion-datetime
                        :show-default-buttons="true"
                        cancel-text="Cancelar"
                        done-text="Confirmar"
                        locale="en-GB-u-hc-h12"
                        @ion-change="
                          dateReminderEnd = $event.detail.value as string
                        "
                      ></ion-datetime>
                    </ion-content>
                  </ion-popover>
                </section>

                <!-- reminder -->
                <section>
                  <ion-item>
                    <ion-label>Crear recordatorio</ion-label>
                    <ion-toggle v-model="reminderToggle"></ion-toggle>
                  </ion-item>

                  <ion-item v-if="reminderToggle == true">
                    <ion-label>Recordar</ion-label>
                    <ion-select
                      v-model="reminderRepeat"
                      ok-text="Confirmar"
                      cancel-text="Cancelar"
                    >
                      <ion-select-option value="just"
                        >A tiempo</ion-select-option
                      >
                      <ion-select-option valaue="5mb"
                        >5 minutos antes</ion-select-option
                      >
                      <ion-select-option valaue="10mb"
                        >10 minutos antes</ion-select-option
                      >
                      <ion-select-option valaue="30mb"
                        >30 minutos antes</ion-select-option
                      >
                      <ion-select-option valaue="1hb"
                        >1 hora antes</ion-select-option
                      >
                      <ion-select-option valaue="1wb"
                        >1 dia antes</ion-select-option
                      >
                    </ion-select>
                  </ion-item>
                </section>
              </ion-content>
            </ion-modal>
          </section>

          <ion-button @click="updateDocument()">
            <ion-icon :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-item>
        <ion-label position="floating">Titulo</ion-label>
        <ion-input
          placeholder="Nuevo documento"
          :value="document.title"
        ></ion-input>
      </ion-item>

      <ion-item lines="none">
        <ion-button
          slot="end"
          :disabled="document.elements == undefined"
          fill="clear"
          @click="toggleReorder()"
        >
          Ordenar elementos
        </ion-button>
      </ion-item>

      <!-- elements -->
      <ion-list>
        <ion-reorder-group
          :disabled="isDisabled"
          @ion-item-reorder="reorderElements($event)"
        >
          <ion-list v-for="(element, index) in document.elements" :key="index">
            <div style="float: left">
              <ion-button v-if="isDisabled == false" fill="clear">
                <ion-reorder></ion-reorder>
              </ion-button>
            </div>

            <ion-card
              v-if="element.type == 'note'"
            >
              <NoteComponent
                @change-value="
                  updateNoteComponent({
                    data: $event,
                    position: element.position,
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
            index:
              document.elements?.length != undefined
                ? document.elements.length
                : 0,
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
} from "@ionic/vue";
import {
  pricetagsOutline,
  timeOutline,
  trashOutline,
  addOutline,
  closeOutline,
  saveOutline,
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
import {
  Note,
  NewNote,
  NewDocument,
  Document,
} from "../../../utils/interfaces";
import { useNote } from "../../../composables/useNote";
import { DocumentElements } from "../../../utils/types";

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

  },

  props: { documentId: { type: String, default: undefined } },

  setup() {
    return {
      pageTitle: "Home",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      addOutline,
      closeOutline,
      saveOutline,
      format,
      useNote,
    };
  },

  data() {
    const document = {
      id: "",
      title: "Nuevo documento",
      elements: undefined,
    } as Document;
    let isDisabled = ref(true);
    const toggleReorder = () => {
      isDisabled.value = !isDisabled.value;
    };
    return {
      popoverReminderStartOpen: false,
      popoverReminderStartEvent: Event as any,
      popoverReminderEndOpen: false,
      popoverReminderEndEvent: Event as any,
      dateReminderStart: new Date().toISOString(),
      dateReminderEnd: new Date().toISOString(),
      reminderRepeat: "just",
      reminderToggle: false,
      document,
      elementsBak: undefined as any,
      isDisabled,
      toggleReorder,
    };
  },

  mounted() {
    const documentId = this.documentId;
    if (documentId != undefined) this.getDocument({ documentId });
    else this.createDocument();
  },

  methods: {
    removeElement(params: { id: number }) {
      // const id = params.id;
      // const elements = this.elementsSelected.filter((element) => {
      //   if (element.id != id) return element;
      // });
      // this.elementsSelected = elements;
    },

    async openPopoverAddElement(params: { ev: Event; index: number }) {
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

    insertElement(params: { id: number; type: DocumentElements }) {
      const type = params.type;
      const index = this.document.elements?.length;
      const documentId = this.document.id;

      if (!this.document.elements)
        this.document.elements = [
          {
            type: "note",
            position: 0,
            documentId,
            data: undefined,
          },
        ];
      else {
        this.document.elements?.push({
          type: "note",
          position: index == undefined ? 0 : index,
          documentId,
          data: undefined,
        });
      }
    },

    async createDocument() {
      const document = {
        title: "Nuevo documento",
      };

      try {
        this.document.id = (await useDocument().saveDocument({ document })).id;
      } catch (e) {
        console.log(e);
      }
    },

    openPopoverReminderStart(ev: Event) {
      this.popoverReminderStartEvent = ev;
      this.popoverReminderStartOpen = true;
    },

    openPopoverReminderEnd(ev: Event) {
      this.popoverReminderEndEvent = ev;
      this.popoverReminderEndOpen = true;
    },

    // saveNote(params: { documentId: string; note: NewNote }) {
    //   const documentId = params.documentId;
    //   const note = params.note;
    //   note.documentId = documentId;
    //
    //   useNote().addNote({ note });
    // },

    updateNoteComponent(params: { data: NewNote; position: number }) {
      const data = params.data;
      const position = params.position;

      if (this.document.elements) this.document.elements[position].data = data;
    },

    async updateDocument() {
      const document = this.document;
      await useDocument().updateDocument({ document });
      this.closeModal();
    },

    closeModal() {
      modalController.dismiss();
    },

    async getDocument(params: { documentId: string }) {
      const documentId = params.documentId;
      const document = await useDocument().getUserDocument({ documentId });
      this.document = document;
    },

    reorderElements(event: CustomEvent) {
      this.elementsBak = this.document.elements;
      let elements = this.document;
      const oldPosition = event.detail.from;
      const newPosition = event.detail.to;

      if (elements.elements != undefined) {
        const elementBak = elements.elements[oldPosition];
        if (oldPosition < newPosition) {
          const arr = elements.elements;
          const index = newPosition;
          arr.splice(index + 1, 0, elementBak);
          elements.elements.splice(oldPosition, 1);
          elements.elements = arr;
        } else {
          const arr = elements.elements;
          const index = newPosition;
          arr.splice(index, 0, elementBak);
          elements.elements.splice(oldPosition + 1, 1);
          elements.elements = arr;
        }
      }
      this.document = event.detail.complete(elements);
    },

  },
});
</script>
