<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Datetime in popover with cover element -->
      <ion-item button="true" id="open-date-input">
        <ion-label>Date</ion-label>
        <ion-text slot="end">{{date1}}</ion-text>
        <ion-popover trigger="open-date-input" :show-backdrop="false">
          <ion-datetime
            presentation="date-time"
            @ionChange="(ev: DatetimeCustomEvent) => date1 = formatDate(ev.detail.value)"
          />
        </ion-popover>
      </ion-item>
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
  IonDatetime,
  IonItem,
  IonPopover,
} from "@ionic/vue";
import {defineComponent, ref} from "vue";
import {format, parseISO} from "date-fns";

export default defineComponent({
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonDatetime,
    IonItem,
    IonPopover,
  },
  setup() {
    const customDatetime = ref();
    const date1 = "";
    const date2 = "";

    const confirm = () => {
      if (customDatetime.value === undefined) return;

      customDatetime.value.$el.confirm();
    };

    const reset = () => {
      if (customDatetime.value === undefined) return;

      customDatetime.value.$el.reset();
    };

    const formatDate = (value: string) => {
      return format(parseISO(value), "MMM dd yyyy");
    };

    return {
      customDatetime,
      confirm,
      reset,
    };
  },
});
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
