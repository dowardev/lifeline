<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Recodartorios</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-list>
            <ion-item v-for="reminder in reminders" :key="reminder">
              <ion-checkbox
                slot="start"
                @update:modelValue="reminder.check = $event"
                :modelValue="reminder.check"
              ></ion-checkbox>
              <ion-label>{{ reminder.label }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-col>
      </ion-row>
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
  IonCheckbox,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../../EventBus";
export default defineComponent({
  name: "Reminders",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCheckbox,
  },
  setup() {
    return { chevronBackOutline, saveOutline };
  },
  data() {
    return { reminders: [] as Array<any> };
  },
  mounted() {
    eventBus().emitter.on("get-reminder-event", (response: any) => {
      this.reminders = response.reminders;
    });
  },
  methods: {
    save() {
      const reminders: any[] = [];
      this.reminders.forEach((element) => {
        if (element.check == true) {
          reminders.push(element.label);
        }
      });
      eventBus().emitter.emit("set-reminder-event", {
        reminders: JSON.parse(JSON.stringify(this.reminders)),
      });
      this.$router.go(-1);
    },
  },
});
</script>
