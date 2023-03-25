<template>
  <ion-content>
    <div>
      <!-- reminders -->
      <ion-button fill="clear" @click='selectOption({option:"add"})'>
        <ion-icon :icon="addOutline" color="danger"> </ion-icon>
      </ion-button>

      <!-- reminders -->
      <ion-button fill="clear">
        <ion-icon :icon="timeOutline" color="danger"> </ion-icon>
      </ion-button>

      <!-- tags -->
      <ion-button fill="clear">
        <ion-icon :icon="pricetagOutline" color="danger"> </ion-icon>
      </ion-button>

      <!-- cancel -->
      <div style="float: right">
        <ion-button fill="clear" color="danger" @click='selectOption({option:"remove"})'>
          <ion-icon :icon="closeOutline"> </ion-icon>
        </ion-button>
      </div>
    </div>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  popoverController,
  IonItem,
  IonButton,
  IonLabel,
} from "@ionic/vue";
import {
  addOutline,
  closeOutline,
  pricetagOutline,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import { defineComponent, ref } from "vue";

type Option = "add"|'remove';
type Role = "confirm" | "cancel";

export default defineComponent({
  name: "MenuRightComponent",

  components: { IonContent, IonItem, IonButton, IonLabel },

  setup() {
    let progress = ref(0);
    return {
      trashOutline,
      progress,
      timeOutline,
      pricetagOutline,
      closeOutline,
      addOutline,
    };
  },

  data() {
    return {
      showDeleteOption: true,
      intervalDeleteId: null as any,
    };
  },

  methods: {
    selectOption(params: { option: Option }) {
      const option = params.option;
      if (option == "add") this.addOption();
      if (option == "remove") this.removeOption();
    },

    async addOption() {
      await this.closeModal({
        data: { option: "add" },
        role: "confirm",
      });
    },

    async removeOption() {
      await this.closeModal({
        data: { option: "remove" },
        role: "confirm",
      });
    },

    async closeModal(params: { data: { option: Option }; role: Role }) {
      const data = params.data;
      const role = params.role;
      await popoverController.dismiss(data, role);
    },
  },
});
</script>
