<template>
  <ion-page>
    <ion-header
      :translucent="true"
      collapse="fade"
      mode="ios"
      class="ion-no-border"
    >
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-input
        label="ddd"
        label-placement="floating"
        fill="solid"
        :value="name"
        @ion-input="name = $event.target.value as string"
      ></ion-input>

      {{ v$.name }}
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  popoverController,
  IonInput,
} from "@ionic/vue";
import { computed, defineComponent, ref } from "vue";
import MenuComponent from "./MenuComponent.vue";
import { minLength, required } from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
  },

  setup() {
    const name = ref("");
    const requiredNameLength = ref(2);
    const rules = computed(() => ({
      name: {
        required,
      },
    }));

    const v$ = useVuelidate(rules, { name });
    return {
      pageTitle: "Home",
      name,
      requiredNameLength,
      v$,
    };
  },
  methods: {
    async openPopover(ev: Event) {
      const popover = await popoverController.create({
        component: MenuComponent,
        event: ev,
        showBackdrop: false,
      });
      await popover.present();
    },
  },
});
</script>
