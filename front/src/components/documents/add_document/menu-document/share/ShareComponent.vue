<template>
  <HeaderShareComponent
    v-if="isPlatform('desktop')"
    @close-share="closeShare()"
  />

  <ion-content
    v-if="isPlatform('desktop')"
    class="ion-padding-start ion-padding-end ion-padding-bottom"
  >
    <ContentShareComponent :url="props.url" />
  </ion-content>

  <ion-page v-if="!isPlatform('desktop')">
    <HeaderShareComponent @close-share="closeShare()" />

    <ion-content class="ion-padding-start ion-padding-end ion-padding-bottom">
      <ContentShareComponent :url="props.url" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, isPlatform, IonPage } from "@ionic/vue";
import ContentShareComponent from "./ShareContent.vue";
import HeaderShareComponent from "./ShareHeader.vue";

const props = defineProps({ url: { type: String, default: "" } });

const emitEvent = defineEmits(["closeShare"]);

const closeShare = () => {
  emitEvent("closeShare");
};
</script>
