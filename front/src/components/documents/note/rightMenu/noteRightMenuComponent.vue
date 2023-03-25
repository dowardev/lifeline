<template>
  <ion-content>
    <div>
      <!-- reminders -->
      <ion-button fill="clear">
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
        <ion-button fill="clear" color="danger">
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

type Option = "delete";
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
addOutline
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
      if (option == "delete") this.deleteOption();
    },

    deleteOption() {
      this.showDeleteOption = false;
      this.intervalDeleteId = setInterval(() => {
        this.progress += 0.01;
        if (this.progress > 1) {
          clearInterval(this.intervalDeleteId);
          setTimeout(async () => {
            this.progress = 0;
            await this.closeModal({
              data: { option: "delete" },
              role: "confirm",
            });
          }, 1000);
        }
      }, 30);
    },

    async cancelDelete() {
      clearInterval(this.intervalDeleteId);
      await this.closeModal({ data: { option: "delete" }, role: "cancel" });
    },

    async closeModal(params: { data: { option: Option }; role: Role }) {
      const data = params.data;
      const role = params.role;
      await popoverController.dismiss(data, role);
    },
  },
});
</script>
