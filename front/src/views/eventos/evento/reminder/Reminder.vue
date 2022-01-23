<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ translateFile["Reminders"] }}</ion-title>
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
              <ion-label v-if="translateFile['remindersOptions'] != null">{{
                translateFile["remindersOptions"][reminder.name]
              }}</ion-label>
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
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import userService from "../../../../services/user.vue";

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
  props: {
    remindersProps: { type: Array<any>(), default: [] },
  },
  setup() {
    return { chevronBackOutline, saveOutline };
  },
  data() {
    const reminders = [
      {
        check: false,
        name: "just",
      },
      {
        check: false,
        name: "5mn",
      },
      {
        check: false,
        name: "15mn",
      },
      {
        check: false,
        name: "30mn",
      },
      {
        check: false,
        name: "1hr",
      },
      {
        check: false,
        name: "4hr",
      },
      {
        check: false,
        name: "1d",
      },
      {
        check: false,
        name: "2d",
      },
      {
        check: false,
        name: "1s",
      },
    ];
    return { reminders, translateFile: Object() };
  },
  mounted() {
    this.translate().then(() => {
      if (this.remindersProps.length != 0) {
        this.reminders.forEach((reminder: any) => {
          this.remindersProps.forEach((res: any) => {
            if (reminder.name == res) {
              reminder.check = true;
            }
          });
        });
      }
    });
  },
  methods: {
    save() {
      const reminders = Array<any>();
      this.reminders.forEach((element) => {
        if (element.check == true) {
          reminders.push(element.name);
        }
      });
      modalController.dismiss({ reminders });
    },
    async translate() {
      this.translateFile = await userService().translate();
    },
  },
});
</script>
