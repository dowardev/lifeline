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
        <RemindersComponent @reminders="$emit('updateReminder', $event)" />
      </ion-page>
    </ion-modal>
  </div>
</template>

<script lang="ts">
import {
  IonItem,
  IonPopover,
  IonTextarea,
  popoverController,
  isPlatform,
  IonModal,
} from "@ionic/vue";
import {
  pricetagsOutline,
  saveOutline,
  timeOutline,
  trashOutline,
  closeOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import { NewNote, Note } from "../../../utils/interfaces";
import NoteRightMenuComponent from "./rightMenu/noteRightMenuComponent.vue";
import { OptionsNoteRightMenu } from "../../../utils/types";
import { format } from "date-fns";
import RemindersComponent from "./reminders/RemindersComponent.vue";

export default defineComponent({
  name: "NoteComponent",
  components: {
    IonItem,
    IonPopover,
    IonTextarea,
    IonModal,
    RemindersComponent,
  },

  props: { data: { type: Object as () => Note, default: {} as Note } },

  emits: ["updateValue", "addElement", "removeNote", "updateReminder"],

  setup() {
    return {
      pageTitle: "NoteComponent",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      saveOutline,
      format,
      idElements: new Date().getTime(),
      isPlatform,
      closeOutline,
    };
  },

  data() {
    return {
      inputValue: "",
      isOpenModalReminders: false,
      isOpenPopoverReminders: false,
    };
  },

  watch: {
    data(newVal) {
      const data = newVal;
      const content = data.content;
      this.inputValue = content;
    },
  },

  mounted() {
    this.setData();
  },

  methods: {
    updateValue(params: { value: string }) {
      const value = params.value;
      this.$emit("updateValue", value);
    },

    async openPopoverRightMenu(params: { ev: Event }) {
      const ev = params.ev;

      const popover = await popoverController.create({
        component: NoteRightMenuComponent,
        event: ev,
        showBackdrop: false,
      });
      await popover.present();

      const { role, data } = await popover.onDidDismiss();
      if (role == "confirm") this.optionMenu({ option: data.option });
    },

    setData() {
      const data = this.data;
      const content = data.content;

      this.inputValue = content as string;
    },

    optionMenu(params: { option: OptionsNoteRightMenu }) {
      const option = params.option;

      if (option == "add") this.$emit("addElement", option);
      if (option == "remove") this.$emit("removeNote", option);
      if (option == "reminders") {
        if (isPlatform("desktop")) this.isOpenPopoverReminders = true;
        else this.isOpenModalReminders = true;
      }
    },
  },
});
</script>
