<template>
  <ion-content>
    <ion-item
      v-if="showDeleteOption"
      button
      @click="selectOption({ option: 'delete' })"
    >
      <ion-icon slot="start" :icon="trashOutline" color="danger"> </ion-icon>
      <ion-label>Eliminar</ion-label>
    </ion-item>

    <ion-item v-if="!showDeleteOption" button>
      <ion-progress-bar :value="progress"></ion-progress-bar>
      <ion-button slot="end" fill="clear" @click="cancelDelete()"
        >Cancelar</ion-button
      >
    </ion-item>
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
import { trashOutline } from "ionicons/icons";
import { defineComponent, ref } from "vue";

type Option = "delete";
type Role = "confirm" | "cancel";

export default defineComponent({
  name: "MenuRightComponent",

  components: { IonContent, IonItem, IonButton, IonLabel },

  setup() {
    let progress = ref(0);
    return { trashOutline, progress };
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
          clearInterval(this.intervalDeleteId)
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
