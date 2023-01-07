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

<script lang="ts">
import { defineComponent } from "vue";
import { IonTextarea } from "@ionic/vue";
// markdown
import Markdown from "vue3-markdown-it";
import "highlight.js/styles/monokai.css";
import { closeOutline, createOutline } from "ionicons/icons";

export default defineComponent({
  name: "TodoComponent",
  components: { IonTextarea, Markdown },

  props: { contentEditable: { type: Boolean, default: false } },

  setup() {
    return {
      pageTitle: "Home",
      createOutline,
      closeOutline,
    };
  },

  data() {
    return {
      content: "# e",
      isContentEditable: false,
    };
  },

  mounted() {
    if (this.contentEditable == true) this.isContentEditable = true;
  },
});
</script>
