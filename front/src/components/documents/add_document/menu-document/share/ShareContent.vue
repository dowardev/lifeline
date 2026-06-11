<template>
  <ion-segment v-model="mainSegment" :scrollable="true">
    <ion-segment-button value="url">
      <ion-icon :icon="linkOutline"></ion-icon>
      <ion-label>Compartir</ion-label>
    </ion-segment-button>

    <ion-segment-button value="guests">
      <ion-icon :icon="mailOutline"></ion-icon>
      <ion-label>Invitados</ion-label>
    </ion-segment-button>
  </ion-segment>

  <!-- url -->
  <section v-if="mainSegment == 'url'">
    <ion-item>
      <ion-toggle>Publico</ion-toggle>

      <ion-button
        id="helpButtonUrl"
        slot="end"
        size="default"
        fill="clear"
        @click="copyToClipboard({ phrase: url })"
      >
        <ion-icon :icon="helpCircleOutline"></ion-icon>
      </ion-button>

      <ion-popover
        trigger="helpButtonUrl"
        :trigger-action="isPlatform('desktop') ? 'hover' : 'click'"
      >
        <ion-content class="ion-padding"
          ><ion-label>
            Aquellos que cuenten con el enlace podrán acceder al documento
            mientras esta opción se encuentre activada.</ion-label
          ></ion-content
        >
      </ion-popover>
    </ion-item>

    <div class="center">
      <img :src="generateQR" alt="" />
    </div>

    <ion-row>
      <ion-col size="12">
        <ion-input
          label="Url"
          label-placement="floating"
          :readonly="true"
          :value="url"
        ></ion-input>
      </ion-col>

      <ion-col size="12">
        <ion-button expand="block" @click="copyToClipboard({ phrase: url })">
          <ion-icon slot="start" :icon="copyOutline"></ion-icon>
          Copiar
        </ion-button>
      </ion-col>
    </ion-row>
  </section>

  <!-- guests -->
  <section v-if="mainSegment == 'guests'">
    <ion-row>
      <ion-col>
        <ion-input
          label="Correo electronico"
          label-placement="floating"
          :readonly="true"
        ></ion-input>
      </ion-col>

      <ion-col size="10">
        <ion-button expand="block" @click="copyToClipboard({ phrase: url })">
          <ion-icon slot="start" :icon="addOutline"></ion-icon>
          Agregar
        </ion-button>
      </ion-col>

      <ion-col size="2">
        <ion-button
          id="helpButtonGuests"
          size="default"
          fill="clear"
          @click="copyToClipboard({ phrase: url })"
        >
          <ion-icon :icon="helpCircleOutline"></ion-icon>
        </ion-button>

        <ion-popover
          trigger="helpButtonGuests"
          :trigger-action="isPlatform('desktop') ? 'hover' : 'click'"
        >
          <ion-content class="ion-padding"
            ><ion-label
              >Los usuarios aquí listados recibirán una invitación para poder
              acceder al documento.</ion-label
            ></ion-content
          >
        </ion-popover>
      </ion-col>
    </ion-row>

    <ion-list>
      <ion-card>
        <ion-item lines="full">
          <ion-label>hola@hola.com</ion-label>
          <ion-button color="danger" fill="clear">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-item>

        <ion-item lines="full">
          <ion-label>hola@hola.com</ion-label>
          <ion-button color="danger" fill="clear">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-card>
    </ion-list>
  </section>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonButton,
  isPlatform,
} from "@ionic/vue";
import {
  addOutline,
  closeOutline,
  copyOutline,
  helpCircleOutline,
  linkOutline,
  mailOutline,
} from "ionicons/icons";
import { computed, ref } from "vue";
import { copyToClipboard as copyToClipboardService } from "../../../../../services/system";

const props = defineProps({ url: { type: String, default: "" } });

const mainSegment = ref("url");

// computed
const generateQR = computed(() => {
  return (
    "https://chart.googleapis.com/chart?cht=qr&chs=" +
    300 +
    "x" +
    300 +
    "&chl=" +
    encodeURIComponent(props.url)
  );
});

// functions
const copyToClipboard = async (params: { phrase: string }) => {
  const phrase = params.phrase;
  await copyToClipboardService({ text: phrase });
};
</script>
