<template>
  <ion-page>
    <ion-item v-if="isContentEditable == false" lines="none">
      <ion-button slot="end" fill="clear" @click="isContentEditable = true">
        <ion-icon :icon="createOutline"></ion-icon>
      </ion-button>
    </ion-item>

    <ion-item v-if="isContentEditable == true" lines="none">
      <ion-button slot="end" fill="clear" @click="isContentEditable = false">
        <ion-icon :icon="closeOutline"></ion-icon>
      </ion-button>
    </ion-item>

    <ion-item v-if="isContentEditable == true">
      <ion-textarea v-model="content"></ion-textarea>
    </ion-item>

    <!-- preview -->
    <div class="ion-padding-start">
      <Markdown v-if="isContentEditable == false" :source="content"></Markdown>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTextarea } from "@ionic/vue";
// markdown
import Markdown from "vue3-markdown-it";
import "highlight.js/styles/monokai.css";
import { closeOutline, createOutline } from "ionicons/icons";
import { ref } from "vue";

const props = defineProps({
  contentEditable: { type: Boolean, default: false },
});

const content = ref("# e");
let isContentEditable = false;

// mounted
if (props.contentEditable == true) isContentEditable = true;
</script>
