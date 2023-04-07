<template>
  <ion-header mode="ios" class="ion-no-border">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeReminders()">
          <ion-icon :icon="closeOutline"></ion-icon>
        </ion-button>
      </ion-buttons>

      <ion-title>{{ pageTitle }}</ion-title>

      <ion-buttons slot="end">
        <ion-button @click="closeReminders()">
          <ion-icon :icon="saveOutline"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <section>
      <ion-accordion-group ref="accordionGroupDate">
        <!-- date start -->
        <ion-accordion value="date-start">
          <ion-item slot="header">
            <ion-label
              >Fecha inicial {{ format(new Date(dateReminderStart), "Pp") }}
            </ion-label>
          </ion-item>

          <div slot="content">
            <ion-datetime
              ref="datetimeStart"
              @ion-change="dateReminderStart = $event.detail.value as string"
            >
              <ion-item slot="buttons" lines="none">
                <ion-button
                  color="danger"
                  fill="clear"
                  @click="cancelDateStart({ nameAccordion: 'date-start' })"
                  >Cancelar</ion-button
                >

                <ion-button
                  color="primary"
                  fill="solid"
                  @click="confirmDateStart({ nameAccordion: 'date-end' })"
                  >Confirmar</ion-button
                >
              </ion-item>
            </ion-datetime>
          </div>
        </ion-accordion>

        <!-- date end -->
        <ion-accordion value="date-end">
          <ion-item slot="header">
            <ion-label
              >Fecha inicial {{ format(new Date(dateReminderEnd), "Pp") }}
            </ion-label>
          </ion-item>

          <div slot="content" class="ion-padding">
            <ion-datetime
              ref="datetimeEnd"
              @ion-change="dateReminderEnd = $event.detail.value as string"
            >
              <ion-item slot="buttons" lines="none">
                <ion-button
                  color="danger"
                  fill="clear"
                  @click="cancelDateEnd({ nameAccordion: 'date-end' })"
                  >Cancelar</ion-button
                >

                <ion-button
                  color="primary"
                  fill="solid"
                  @click="confirmDateEnd({ nameAccordion: 'date-reminder' })"
                  >Confirmar</ion-button
                >
              </ion-item>
            </ion-datetime>
          </div>
        </ion-accordion>

        <!-- reminder -->
        <ion-accordion value="date-reminder">
          <ion-item slot="header">
            <ion-label>Recordatorios </ion-label>
          </ion-item>

          <div slot="content" class="ion-padding">
            <ion-item v-for="(repeat, index) in reminderRepeatBak" :key="index">
              <ion-checkbox
                label-placement="end"
                :value="repeat.value"
                :checked="repeat.isChecked"
                >{{ repeat.text }}</ion-checkbox
              >
            </ion-item>

            <div style="float: right">
              <ion-item slot="buttons" lines="none">
                <ion-button
                  color="danger"
                  fill="clear"
                  @click="cancelDateEnd({ nameAccordion: 'date-end' })"
                  >Cancelar</ion-button
                >

                <ion-button
                  color="primary"
                  @click="confirmDateStart({ nameAccordion: 'date-reminder' })"
                  >Confirmar</ion-button
                >
              </ion-item>
            </div>
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </section>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  modalController,
  IonDatetime,
  IonAccordion,
  IonAccordionGroup,
  IonCheckbox,
} from "@ionic/vue";
import {
  closeOutline,
  moveOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import { defineComponent, ref } from "vue";
import { format } from "date-fns";

export default defineComponent({
  name: "MenuOptComponent",

  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonDatetime,
    IonAccordion,
    IonAccordionGroup,
    IonCheckbox,
  },

  emits: ["closeReminders"],

  setup() {
    const accordionGroupDate = ref(null);
    const toggleAccordionDate = (params: { nameAccordion: string }) => {
      const nameAccordion = params.nameAccordion;

      if (!accordionGroupDate.value) {
        return;
      }
      const nativeEl = (accordionGroupDate as any).value.$el;

      if (nativeEl.value === nameAccordion) {
        nativeEl.value = undefined;
      } else {
        nativeEl.value = nameAccordion;
      }
    };

    const datetimeStart = ref();
    const cancelDateStart = (params: { nameAccordion: string }) => {
      const nameAccordion = params.nameAccordion;
      datetimeStart.value.$el.cancel();
      toggleAccordionDate({ nameAccordion });
    };
    const confirmDateStart = (params: { nameAccordion: string }) => {
      const nameAccordion = params.nameAccordion;
      datetimeStart.value.$el.confirm();
      toggleAccordionDate({ nameAccordion });
    };

    const datetimeEnd = ref();
    const cancelDateEnd = (params: { nameAccordion: string }) => {
      const nameAccordion = params.nameAccordion;
      datetimeEnd.value.$el.cancel();
      toggleAccordionDate({ nameAccordion });
    };
    const confirmDateEnd = (params: { nameAccordion: string }) => {
      const nameAccordion = params.nameAccordion;
      datetimeEnd.value.$el.confirm();
      toggleAccordionDate({ nameAccordion });
    };

    return {
      closeOutline,
      pageTitle: "Recordatorios",
      saveOutline,
      moveOutline,
      timeOutline,
      format,
      accordionGroupDate,
      toggleAccordionDate,
      datetimeStart,
      confirmDateStart,
      cancelDateStart,
      datetimeEnd,
      confirmDateEnd,
      cancelDateEnd,
    };
  },

  data() {
    const reminderRepeat = [
      { value: "just", text: "A tiempo", isChecked: false },
      { value: "5mb", text: "5 minutos antes", isChecked: false },
      { value: "10mb", text: "10 minutos antes", isChecked: false },
      { value: "30mb", text: "30 minutos antes", isChecked: false },
      { value: "1hb", text: "1 hora antes", isChecked: false },
      { value: "1db", text: "1 dia antes", isChecked: false },
    ];
    return {
      popoverReminderStartOpen: false,
      popoverReminderStartEvent: Event as any,
      popoverReminderEndOpen: false,
      popoverReminderEndEvent: Event as any,
      dateReminderStart: new Date().toISOString(),
      dateReminderEnd: new Date().toISOString(),
      reminderRepeat,
      reminderRepeatBak: reminderRepeat,
      hours: Array<{ hour: string }>,
    };
  },

  computed: {
    generateCalendar() {
      const hours = [];
      for (let i = 0; i < 24; i++) {
        hours.push({
          hour: i,
        });
      }
      return hours;
    },
  },

  methods: {
    closeModal() {
      return modalController.dismiss();
    },

    openPopoverReminderStart(ev: Event) {
      this.popoverReminderStartEvent = ev;
      this.popoverReminderStartOpen = true;
    },

    openPopoverReminderEnd(ev: Event) {
      this.popoverReminderEndEvent = ev;
      this.popoverReminderEndOpen = true;
    },

    closeReminders() {
      this.$emit("closeReminders");
    },
  },
});
</script>
