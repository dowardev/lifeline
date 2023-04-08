<template>
  <HeaderShareComponent @close-share="closeShare()" />

  <ion-content v-if="isPlatform('desktop')">
    <ContentShareComponent :url="url" />
  </ion-content>

  <ion-page v-if="isPlatform('mobile') || isPlatform('mobileweb')" id="prueba">
    <HeaderShareComponent @close-share="closeShare()" />

    <ion-content>
      <ContentShareComponent :url="url" />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, isPlatform, IonPage } from "@ionic/vue";
import { defineComponent } from "vue";
import ContentShareComponent from "./ShareContent.vue";
import HeaderShareComponent from "./ShareHeader.vue";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    ContentShareComponent,
    IonPage,
    HeaderShareComponent,
  },

  props: { url: { type: String, default: "" } },

  emits: ["closeShare"],

  setup() {
    return {
      isPlatform,
    };
  },

  data() {
    return {
      mainSegment: "url",
    };
  },

  methods: {
    closeShare() {
      this.$emit("closeShare");
    },
  },
});
</script>
