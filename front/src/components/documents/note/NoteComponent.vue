<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <div
    @contextmenu.prevent="openPopoverRightMenu({ ev: $event })"
    @press="openPopoverRightMenu({ ev: $event })"
  >
    <!-- nota -->
    <ion-item lines="none">
      <ion-textarea
        :value="inputValue"
        placeholder="Nota"
        :auto-grow="true"
        @ion-input="updateValue({ value: $event.detail.value as string })"
      ></ion-textarea>
    </ion-item>

    <!-- popovers -->
    <!-- popover tags -->
    <ion-popover trigger="click-trigger-tags" trigger-action="click">
      <ion-content>
        <ion-item>
          <ion-input placeholder="Nombre de la etiqueta"></ion-input>
        </ion-item>

        <div class="ion-padding-start" style="display: flex">
          <div class="ion-padding-end">
            <ion-text color="primary">ee</ion-text>
          </div>

          <div class="ion-padding-end">
            <ion-text color="primary">esse</ion-text>
          </div>
        </div>
      </ion-content>
    </ion-popover>

    <!-- popover reminders -->
    <ion-popover
      :trigger="`click-trigger-popover-calendar-${idElements}`"
      style="--width: 22rem"
      :is-open="isOpenPopoverReminders"
      @will-dismiss="isOpenPopoverReminders = false"
    >
      <RemindersComponent
        :data-reminders="data.reminder"
        @reminders="$emit('updateReminder', $event)"
      />
    </ion-popover>
    <!-- end popovers -->

    <!-- modals -->
    <!-- modal reminders -->
    <ion-modal
      :trigger="`click-trigger-modal-calendar-${idElements}`"
      :is-open="isOpenModalReminders"
      @will-dismiss="isOpenModalReminders = false"
    >
      <ion-page>
        <RemindersComponent
          :data-reminders="data.reminder"
          @reminders="$emit('updateReminder', $event)"
        />
      </ion-page>
    </ion-modal>
  </div>
</template>

<script setup lang="ts">
// 1. Imports (ionic/vue/ionicons)
import {
  IonContent,
  IonInput,
  IonItem,
  IonModal,
  IonPopover,
  IonText,
  IonTextarea,
  popoverController,
  isPlatform,
} from "@ionic/vue";
import { watch } from "vue";

// 2. Controllers / Composables
// (none)

// 3. Components
import NoteRightMenuComponent from "./rightMenu/noteRightMenuComponent.vue";
import RemindersComponent from "./reminders/RemindersComponent.vue";

// 4. Interface and types imports
import type { Note } from "../../../utils/interfaces";
import type { OptionsNoteRightMenu } from "../../../utils/types";

// 5. Main (props, emits)
const props = defineProps({
  data: { type: Object as () => Note, default: {} as Note },
});

const emitEvent = defineEmits([
  "updateValue",
  "addElement",
  "removeNote",
  "updateReminder",
]);

// 6. Vars and const
const idElements = new Date().getTime();
let inputValue = "";
let isOpenModalReminders = false;
let isOpenPopoverReminders = false;

// 7. Watch
watch(() => props.data, (newValue) => {
  const data = newValue;
  const content = data.content;
  if (!content) return;
  inputValue = content;
});

// 8. Computed
// (none)

// 9. OnMounted
const setData = (): void => {
  const content = props.data.content;
  inputValue = content as string;
};

setData();

// 10. Functions (named parameters pattern)
const updateValue = (params: { value: string }): void => {
  const value = params.value;
  emitEvent("updateValue", value);
};

const openPopoverRightMenu = async (params: { ev: Event }): Promise<void> => {
  const ev = params.ev;

  const popover = await popoverController.create({
    component: NoteRightMenuComponent,
    event: ev,
    showBackdrop: false,
  });
  await popover.present();

  const { role, data } = await popover.onDidDismiss();
  if (role == "confirm") optionMenu({ option: data.option });
};

const optionMenu = (params: { option: OptionsNoteRightMenu }): void => {
  const option = params.option;

  if (option == "add") emitEvent("addElement", option);
  if (option == "remove") emitEvent("removeNote", option);
  if (option == "reminders") {
    if (isPlatform("desktop")) isOpenPopoverReminders = true;
    else isOpenModalReminders = true;
  }
};
</script>
