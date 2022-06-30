<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ fileTranslate["Reminders"] }}</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" v-if="fileTranslate[0] != null">
      <ion-row>
        <ion-col size="12">
          <ion-list>
            <ion-item v-for="reminder in reminders" :key="reminder">
              <ion-checkbox
                slot="start"
                @update:modelValue="reminder.check = $event"
                :modelValue="reminder.check"
              ></ion-checkbox>
              <ion-label>
                {{ fileTranslate[0][reminder.name] }}
              </ion-label>
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
  name: "RemindersPage",
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
        name: "5mnb",
      },
      {
        check: false,
        name: "15mnb",
      },
      {
        check: false,
        name: "30mnb",
      },
      {
        check: false,
        name: "1hrb",
      },
      {
        check: false,
        name: "4hrb",
      },
      {
        check: false,
        name: "1db",
      },
      {
        check: false,
        name: "2db",
      },
      {
        check: false,
        name: "1sb",
      },
    ];
    return { reminders, fileTranslate: Object() };
  },
  mounted() {
    // this.translate().then(() => {
    //   if (this.remindersProps.length != 0) {
    //     this.reminders.forEach((reminder: any) => {
    //       this.remindersProps.forEach((res: any) => {
    //         if (reminder.name == res) {
    //           reminder.check = true;
    //         }
    //       });
    //     });
    //   }
    // });
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
    // async translate() {
    //   this.fileTranslate = [await userService().translate()];
    // },
  },
});
</script>
