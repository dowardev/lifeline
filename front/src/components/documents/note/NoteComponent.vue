<template>
  <div
    @contextmenu.prevent="openPopoverRightMenu({ ev: $event })"
    @press="openPopoverRightMenu({ ev: $event })"
  >
    <!-- nota -->
    <ion-item lines="none">
      <ion-textarea
        v-model="inputValue"
        placeholder="Nota"
        @ion-blur="updateValue()"
        :auto-grow="true"
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
      <RemindersComponent />
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
        <RemindersComponent />
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
import { NewNote } from "../../../utils/interfaces";
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

  props: { data: { type: Object as () => NewNote, default: {} as NewNote } },

  emits: ["changeValue", "addElement", "removeNote"],

  setup() {
    return {
      pageTitle: "Home",
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

  mounted() {
    this.setData();
  },

  methods: {
    updateValue() {
      const value = this.inputValue;

      const note = { content: value } as NewNote;
      this.$emit("changeValue", note);
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

      this.inputValue = content == undefined ? "" : content;
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
