<template>
  <ion-card>
    <ion-item>
      <ion-label></ion-label>
    </ion-item>

    <table>
      <tr>
        <td><div contenteditable>I'm editable</div></td>
        <td><div contenteditable>I'm also editable</div></td>
      </tr>
      <tr>
        <td>I'm not editable</td>
      </tr>
    </table>
  </ion-card>
</template>

<script lang="ts">
import {
  IonItem,
  IonLabel,
} from "@ionic/vue";
import {
  pricetagsOutline,
  saveOutline,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import { defineComponent, } from "vue";

export default defineComponent({
  name: "TableComponent",
  components: {
    IonItem,
    IonLabel,
  },

  setup() {
    return {
      pageTitle: "Home",
      trashOutline,
      timeOutline,
      pricetagsOutline,
      saveOutline,
    };
  },
});
</script>
