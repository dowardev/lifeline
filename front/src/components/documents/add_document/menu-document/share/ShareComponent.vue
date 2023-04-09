<template>
  <HeaderShareComponent
    v-if="isPlatform('desktop')"
    @close-share="closeShare()"
  />

  <ion-content v-if="isPlatform('desktop')" class="ion-padding-start ion-padding-end ion-padding-bottom">
    <ContentShareComponent :url="url" />
  </ion-content>

  <ion-page v-if="!isPlatform('desktop')">
    <HeaderShareComponent @close-share="closeShare()" />

    <ion-content class="ion-padding-start ion-padding-end ion-padding-bottom">
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
