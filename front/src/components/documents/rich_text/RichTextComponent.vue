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
// 1. Imports (ionic/vue/ionicons)
import {
  IonButton,
  IonIcon,
  IonItem,
  IonPage,
  IonTextarea,
} from "@ionic/vue";
import { closeOutline, createOutline } from "ionicons/icons";
import { ref } from "vue";

// 2. Controllers / Composables
// (none)

// 3. Components
import Markdown from "vue3-markdown-it";
import "highlight.js/styles/monokai.css";

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
const props = defineProps({
  contentEditable: { type: Boolean, default: false },
});

// 6. Vars and const
const content = ref("# e");
let isContentEditable = false;

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
if (props.contentEditable == true) isContentEditable = true;

// 10. Functions (named parameters pattern)
// (none)
</script>
