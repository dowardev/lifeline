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
import {
  IonItem,
  IonPopover,
  IonTextarea,
  popoverController,
  isPlatform,
  IonModal,
} from "@ionic/vue";
import { watch } from "vue";
import { Note } from "../../../utils/interfaces";
import NoteRightMenuComponent from "./rightMenu/noteRightMenuComponent.vue";
import { OptionsNoteRightMenu } from "../../../utils/types";
import RemindersComponent from "./reminders/RemindersComponent.vue";

const props = defineProps({
  data: { type: Object as () => Note, default: {} as Note },
});

const emitEvent = defineEmits([
  "updateValue",
  "addElement",
  "removeNote",
  "updateReminder",
]);

const idElements = new Date().getTime();
let inputValue = "";
let isOpenModalReminders = false;
let isOpenPopoverReminders = false;

watch(props.data, (newValue, oldValue) => {
  const data = newValue;
  const content = data.content;
  if (!content) return;
  inputValue = content;
});

// functions
const updateValue = (params: { value: string }) => {
  const value = params.value;
  emitEvent("updateValue", value);
};

const openPopoverRightMenu = async (params: { ev: Event }) => {
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

const setData = () => {
  const content = props.data.content;

  inputValue = content as string;
};

const optionMenu = (params: { option: OptionsNoteRightMenu }) => {
  const option = params.option;

  if (option == "add") emitEvent("addElement", option);
  if (option == "remove") emitEvent("removeNote", option);
  if (option == "reminders") {
    if (isPlatform("desktop")) isOpenPopoverReminders = true;
    else isOpenModalReminders = true;
  }
};

// mounted
setData();
</script>
