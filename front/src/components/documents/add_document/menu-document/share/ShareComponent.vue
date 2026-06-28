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
// 1. Imports (ionic/vue/ionicons)
import { IonContent, isPlatform, IonPage } from "@ionic/vue";

// 2. Controllers / Composables
// (none)

// 3. Components
import ContentShareComponent from "./ShareContent.vue";
import HeaderShareComponent from "./ShareHeader.vue";

// 4. Interface and types imports
// (none)

// 5. Main (props, emits)
const props = defineProps({ url: { type: String, default: "" } });

const emitEvent = defineEmits(["closeShare"]);

// 6. Vars and const
// (none)

// 7. Watch
// (none)

// 8. Computed
// (none)

// 9. OnMounted
// (none)

// 10. Functions (named parameters pattern)
const closeShare = (): void => {
  emitEvent("closeShare");
};
</script>
