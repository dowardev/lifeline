<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

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
          <ion-button @click="toggleReorder()"> Terminar </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content
      v-if="
        documentUrl != undefined &&
        documentComposable.getUserDocument({ documentId: documentUrl }) != undefined
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
              :error-text="v$.titleValue.$errors[0]?.$message as string"
              :class="v$.titleValue.$errors.length == 0 ? 'ion-valid' : 'ion-invalid'"
              :value="titleValue"
              ref="inputTitle"
              @ion-input="titleValue = $event.detail.value as string"
              @ion-blur="updateTitle()"
              @ion-focus="(inputTitle as any)?.$el?.classList.add('ion-touched'); v$.titleValue.$touch();"
            ></ion-input>
          </ion-col>
        </ion-row>
      </section>

      <!-- elements -->
      <section>
        <ion-reorder-group
          v-if="docElements.length > 0"
          :disabled="isReorderDisabled"
          @ion-item-reorder="reorderElements($event)"
        >
          <ion-list
            v-for="(element, indexElement) in docElements"
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
                        documentId: String(documentComposable.getUserDocument({
                          documentId: documentUrl!,
                        })?.id ?? 0),
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
        mode="ios"
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
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonPage,
  IonPopover,
  IonReorder,
  IonReorderGroup,
  IonRow,
  IonTitle,
  IonToolbar,
  isPlatform,
  popoverController,
} from "@ionic/vue";
import {
  addOutline,
  closeOutline,
  ellipsisHorizontalOutline,

} from "ionicons/icons";
import { computed, ref } from "vue";
import useVuelidate from "@vuelidate/core";
import { helpers, maxLength, required } from "@vuelidate/validators";
import { useRoute, useRouter } from "vue-router";
// 2. Controllers / Composables
import { useDocument } from "../../../composables/useDocument";
import { useNote } from "../../../composables/useNote";
import { useReminder } from "../../../composables/useReminder";
import { useNoteStore } from "../../../store/noteStore";
import { NotificationPermissionError } from "../../../controllers/reminderController";
import { showToast } from "@/utils/toast";
const documentComposable = useDocument();
const noteComposable = useNote();
const reminderComposable = useReminder();
const noteStore = useNoteStore();
const route = useRoute();
const router = useRouter();

// 3. Components
import PopOverAddElements from "./PopOverAddElements.vue";
import NoteComponent from "../note/NoteComponent.vue";
// import TableComponent from "../table/TableComponent.vue";
import ListComponent from "../list/ListComponent.vue";
import TodoComponent from "../todo/TodoComponent.vue";
import RichTextEditor from "../rich_text/RichTextComponent.vue";
import MenuOptComponent from "./menu-document/MenuOptComponent.vue";

// 4. Interface and types imports
import type {
  OptionsMainMenuDocument,
  TypeDocumentElement,
} from "../../../utils/types";
import type { Note } from "@/utils/interfaces";

// 5. Main (props, emits)
// (none)

// 6. Vars and const
const pageTitle = "Agregar documento";
const isDisabled = ref(true);
const toggleReorder = (): void => {
  isDisabled.value = !isDisabled.value;
};
const isReorderDisabled = isDisabled;
let documentUrl = route.params.url as string;
let documentId = "";
const titleValue = ref("");
const inputTitle = ref<any>(null);
let hasShownNoteReminderToast = false;

const docElements = computed(() => {
  const doc = documentComposable.getUserDocument({ documentId: documentUrl })
  return (doc?.elements || []) as unknown as Array<Record<string, unknown>>
})

// 7. Watch
// (none)

// 8. Computed
// (none)

const start = async (): Promise<void> => {
  await documentComposable.loadDocuments();
  // Load notes for the document so a persisted note reminder can be found/upserted on reload.
  await noteComposable.loadNotes();
  documentId = String(documentComposable.getUserDocument({ documentId: documentUrl })?.id ?? "");
  titleValue.value = documentComposable.getUserDocument({ documentId: documentUrl })?.title ?? "";
};

const rules = {
  titleValue: {
    required: helpers.withMessage("Campo requerido", required),
    maxLength: helpers.withMessage("Máximo 255 caracteres", maxLength(255)),
  },
};
const v$ = useVuelidate(rules, { titleValue });

// 9. OnMounted
if (documentUrl) {
  start();
}

// 10. Functions (named parameters pattern)

const removeElement = (params: { index: number | string; documentId: string }): void => {
  const index = Number(params.index);
  const documentId = params.documentId;

  documentComposable.removeElement({ index, documentId });
};

const openPopoverAddElement = async (params: { ev: Event }): Promise<void> => {
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

const insertElement = (params: { id: number; type: TypeDocumentElement }): void => {
  const type = params.type;
  if (!documentId) return;

  const element = {
    type,
    documentId,
    data: undefined,
  };

  documentComposable.insertElement({ documentId, element });

  const document = documentComposable.getUserDocument({ documentId });
  if (!document?.elements) return;
  documentComposable.updateDocument({
    id: document.id,
    elements: document.elements,
  });
};

const updateNoteValue = (params: {
  data: { value: string };
  index: number | string;
  documentId: string;
}): void => {
  const data = params.data;
  const index = Number(params.index);
  const documentId = params.documentId;
  documentComposable.updateNoteValue({ data, index, documentId });
};

const closePage = (): void => {
  router.go(-1);
};

const reorderElements = (event: CustomEvent): void => {
  const documentId = documentUrl;
  let document = documentComposable.getUserDocument({ documentId });
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

const updateTitle = async (): Promise<void> => {
  if (v$.value.$invalid) return;
  const title = titleValue.value;
  const document = documentComposable.getUserDocument({ documentId });
  const url = `${title.replace(" ", "-")}-${documentId}`;

  if (!document) return;
  document.title = title;
  document.url = url;

  await documentComposable.updateDocument({
    id: document.id,
    title: document.title,
  });

  router.replace(url);
};

const setOptionMainMenu = (params: {
  option: OptionsMainMenuDocument | undefined;
  data?: any;
}): void => {
  const option = params.option;
  if (option == undefined) return;

  if (option == "order") toggleReorder();
};

const setNoteReminders = async (params: {
  data: { dateStart: string; dateEnd: string };
  index: number | string;
  documentId: string;
}): Promise<void> => {
  const data = params.data;
  const index = Number(params.index);
  const documentId = params.documentId;

  // Store update (in-memory element reminder).
  await documentComposable.updateNoteReminder({ data, index, documentId });

  const document = documentComposable.getUserDocument({ documentId });
  const title = document?.title ?? "";

  // Collapse all note-element reminders into a single note reminder: the EARLIEST
  // dateStart wins (D2 / FR-27).
  const elements = (document?.elements ?? []) as Array<{ reminders?: { dateStart?: string } }>;
  const starts = elements
    .map((element) => element.reminders?.dateStart)
    .filter((value): value is string => Boolean(value && value.trim() !== ""))
    .sort();

  const note = noteStore.notes.find((n) => String(n.document_id) === documentId);

  // Clear path: when the last element reminder is removed.
  if (starts.length === 0) {
    if (note?.id) {
      const existingIds = note.id_reminders ?? [];
      await reminderComposable
        .cancelNoteReminders({ ids: existingIds })
        .catch(() => undefined);
      await noteComposable.updateNote({
        id: note.id,
        reminder: null as unknown as string,
        id_reminders: [],
      });
    }
    return;
  }

  const earliestStart = starts[0];

  // Upsert the Note row for this document (create if absent, else update).
  let noteId: number | string;
  if (note?.id) {
    noteId = note.id;
    await noteComposable.updateNote({ id: noteId, reminder: earliestStart });
  } else {
    const created = await noteComposable.createNote({
      title,
      document_id: Number(documentId),
      reminder: earliestStart,
    });
    noteId = created.id;
  }

  // Schedule the note reminder and persist the scheduled ids.
  const existingIds = note?.id_reminders ?? [];
  let ids: number[] = [];
  try {
    const result = await reminderComposable.scheduleNoteReminders({
      noteId,
      title,
      message: "",
      reminderDate: new Date(earliestStart),
      notifications: [],
      existingIds,
    });
    ids = result.ids;
  } catch (error) {
    if (!(error instanceof NotificationPermissionError)) throw error;
  }
  await noteComposable.updateNote({ id: noteId, id_reminders: ids });

  // One-time local-only toast.
  if (!hasShownNoteReminderToast) {
    hasShownNoteReminderToast = true;
    await showToast({
      message:
        "El recordatorio del elemento se guarda solo en este dispositivo; el recordatorio de la nota se sincroniza",
    });
  }
};
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
