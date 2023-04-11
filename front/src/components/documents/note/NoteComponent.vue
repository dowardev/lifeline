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
    <ion-item>
      <ion-button
        :id="`click-trigger-calendar-${idElements}`"
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

    <ion-popover
      :trigger="`click-trigger-calendar-${idElements}`"
      trigger-action="click"
      style="--width: 22rem"
    >
      <ion-content>
        <ion-segment v-model="reminderSegment">
          <ion-segment-button value="date-start">Inicio</ion-segment-button>
          <ion-segment-button value="date-end">Final</ion-segment-button>
        </ion-segment>

        <section v-if="reminderSegment == 'date-start'">
          <ion-datetime
            ref="datetimeStart"
            v-model="dateReminderStart"
            @ion-change="dateReminderStart = $event.detail.value as string"
          >
            <ion-buttons slot="buttons">
              <ion-button color="danger" @click="resetStart()"
                >Reiniciar</ion-button
              >
              <ion-button color="primary" @click="cancelStart()"
                >Cancelar</ion-button
              >
              <ion-button fill="solid" color="primary" @click="confirmStart()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-datetime>
        </section>

        <section v-if="reminderSegment == 'date-end'">
          <ion-datetime
            ref="datetimeEnd"
            v-model="dateReminderEnd"
            @ion-change="dateReminderEnd = $event.detail.value as string"
          >
            <ion-buttons slot="buttons">
              <ion-button color="danger" @click="resetEnd()"
                >Reiniciar</ion-button
              >
              <ion-button color="primary" @click="cancelEnd()"
                >Cancelar</ion-button
              >
              <ion-button fill="solid" color="primary" @click="confirmEnd()"
                >Confirmar</ion-button
              >
            </ion-buttons>
          </ion-datetime>
        </section>
      </ion-content>
    </ion-popover>

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
  </div>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonPopover,
  IonDatetime,
  IonTextarea,
  popoverController,
  IonSegment,
  IonSegmentButton,
} from "@ionic/vue";
import {
  pricetagsOutline,
  saveOutline,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import { defineComponent, ref } from "vue";
import { NewNote } from "../../../utils/interfaces";
import NoteRightMenuComponent from "./rightMenu/noteRightMenuComponent.vue";
import { OptionsNoteRightMenu } from "../../../utils/types";
import { format } from "date-fns";

export default defineComponent({
  name: "NoteComponent",
  components: {
    IonContent,
    IonItem,
    IonPopover,
    IonDatetime,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
  },

  props: { data: { type: Object as () => NewNote, default: {} as NewNote } },

  emits: ["changeValue", "addElement", "removeNote"],

  setup() {
    const datetimeStart = ref();
    const resetStart = () => datetimeStart.value.$el.reset();
    const cancelStart = () => datetimeStart.value.$el.cancel();
    const confirmStart = () => {
      datetimeStart.value.$el.confirm();
      reminderSegment.value = "date-end";
    };

    const datetimeEnd = ref();
    const resetEnd = () => datetimeEnd.value.$el.reset();
    const cancelEnd = () => {
      datetimeEnd.value.$el.cancel();
      reminderSegment.value = "date-start";
    };
    const confirmEnd = () => {
      datetimeEnd.value.$el.confirm();
    };

    const reminderSegment = ref("date-start");

    return {
      pageTitle: "Home",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      saveOutline,
      format,
      idElements: new Date().getTime(),
      datetimeStart,
      resetStart,
      cancelStart,
      confirmStart,
      datetimeEnd,
      resetEnd,
      cancelEnd,
      confirmEnd,
      reminderSegment,
    };
  },

  data() {
    return {
      inputValue: "",
      dateReminderStart: new Date().toISOString(),
      dateReminderEnd: new Date().toISOString(),
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
