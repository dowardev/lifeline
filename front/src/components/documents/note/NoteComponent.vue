<template>
  <div
    @contextmenu.prevent="openPopoverRightMenu({ ev: $event })"
    @press="openPopoverRightMenu({ ev: $event })"
  >
    <!-- nota -->
    <ion-item>
      <ion-textarea
        v-model="inputValue"
        placeholder="Nota"
        @ion-blur="updateValue()"
      ></ion-textarea>
    </ion-item>

    <!-- time -->
    <ion-item lines="none">
      <ion-button
        v-if="isPlatform('desktop')"
        :id="`click-trigger-popover-calendar-${idElements}`"
        size="small"
        fill="clear"
      >
        <ion-icon :icon="timeOutline"></ion-icon>
      </ion-button>

      <ion-button
        v-if="!isPlatform('desktop')"
        :id="`click-trigger-modal-calendar-${idElements}`"
        size="small"
        fill="clear"
      >
        <ion-icon :icon="timeOutline"></ion-icon>
      </ion-button>

      <!-- tags -->
      <ion-button id="click-trigger-tags" size="small" fill="clear">
        <ion-icon :icon="pricetagsOutline"></ion-icon>
      </ion-button>
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
      trigger-action="click"
      style="--width: 22rem"
    >
      <RemindersComponent />
    </ion-popover>
    <!-- end popovers -->

    <!-- modals -->
    <!-- modal reminders -->
    <ion-modal :trigger="`click-trigger-modal-calendar-${idElements}`">
      <ion-page>
        <RemindersComponent />
      </ion-page>
    </ion-modal>
  </div>
</template>

<script lang="ts">
import {
  IonContent,
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
    IonContent,
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
    },
  },
});
</script>
