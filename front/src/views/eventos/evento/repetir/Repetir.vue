<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Repetir</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="save()" :disabled="validate">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar v-if="fileTranslate[0] != null">
        <ion-item>
          <ion-label>{{ fileTranslate[0]["frequency"] }}</ion-label>
          <ion-select v-model="repeatData.frequencySelect">
            <ion-select-option
              v-for="option in frequencyOptions"
              :key="option"
              :value="option"
            >
              {{ fileTranslate[0][option] }}
            </ion-select-option>
          </ion-select>
        </ion-item>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" v-if="fileTranslate[0] != null">
      <section v-if="repeatData.frequencySelect == 'unique'"></section>

      <section v-if="repeatData.frequencySelect == 'daily'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{ fileTranslate[0]["every"] }}</ion-label>
              <ion-select v-model="repeatData.daily.every">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="item == 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["day"]) }}
                  </div>
                  <div v-if="item > 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["days"]) }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
        </ion-row>
      </section>

      <section v-if="repeatData.frequencySelect == 'weekly'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>Cada</ion-label>
              <ion-select v-model="repeatData.weekly.every">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="item == 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["week"]) }}
                  </div>
                  <div v-if="item > 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["weeks"]) }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{ fileTranslate[0]["day(s)"] }}</ion-label>
              <ion-select multiple="true" v-model="repeatData.weekly.days">
                <ion-select-option v-for="day in days" :key="day" :value="day">
                  {{ fileTranslate[0][day] }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
        </ion-row>
      </section>

      <section v-if="repeatData.frequencySelect == 'monthly'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{ fileTranslate[0]["every"] }}</ion-label>
              <ion-select value="1" v-model="repeatData.monthly.every">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="item == 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["month"]) }}
                  </div>
                  <div v-if="item > 1">
                    {{
                      convertFirstLetterLowercase(fileTranslate[0]["months"])
                    }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{ fileTranslate[0]["type"] }}</ion-label>
              <ion-select v-model="repeatData.monthly.tipoMonth">
                <ion-select-option value="day">
                  {{ fileTranslate[0]["day"] }}
                </ion-select-option>
                <ion-select-option value="week">
                  {{ fileTranslate[0]["week"] }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <div v-if="repeatData.monthly.tipoMonth == 'day'">
              <ion-item>
                <ion-label>
                  {{ fileTranslate[0]["daysOfMonth"] }}
                </ion-label>
                <ion-select
                  multiple="true"
                  v-model="repeatData.monthly.day.dayMonth"
                >
                  <ion-select-option
                    v-for="day in daysMonth"
                    :key="day"
                    :value="day"
                    >{{ day }}</ion-select-option
                  >
                </ion-select>
              </ion-item>
            </div>
            <div v-if="repeatData.monthly.tipoMonth == 'week'">
              <ion-item>
                <ion-label>{{ fileTranslate[0]["week"] }}</ion-label>
                <ion-select v-model="repeatData.monthly.weekly.week">
                  <ion-select-option
                    v-for="week in weeksMonthSelect"
                    :key="week"
                    :value="week"
                  >
                    {{ fileTranslate[0]["weekRepeats"][week] }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label>{{ fileTranslate[0]["day"] }}</ion-label>
                <ion-select v-model="repeatData.monthly.weekly.dayMonth">
                  <ion-select-option
                    v-for="day in dayMonthSelect"
                    :key="day"
                    :value="day"
                    >{{ fileTranslate[0][day] }}</ion-select-option
                  >
                </ion-select>
              </ion-item>
            </div>
          </ion-col>
        </ion-row>
      </section>

      <section v-if="repeatData.frequencySelect == 'annually'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{ fileTranslate[0]["every"] }}</ion-label>
              <ion-select value="1" v-model="repeatData.annually.every">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="item == 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["year"]) }}
                  </div>
                  <div v-if="item > 1">
                    {{ convertFirstLetterLowercase(fileTranslate[0]["years"]) }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{ fileTranslate[0]["month"] }}</ion-label>
              <ion-select v-model="repeatData.annually.month">
                <ion-select-option
                  v-for="month in monthNames"
                  :key="month"
                  :value="month.position"
                  >{{ month.name }}</ion-select-option
                >
              </ion-select>
            </ion-item>
          </ion-col>
        </ion-row>
      </section>
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
  IonSelect,
  IonSelectOption,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../EventBus";
import userService from "../../../../services/user.vue";

export default defineComponent({
  name: "RepetirPage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
  },
  props: {
    repeatsProps: { type: Array<any>(), default: [] },
    day: { type: String, default: "" },
  },
  setup() {
    const frequency = [];
    for (let i = 1; i <= 50; i++) {
      frequency.push(i);
    }
    const daysMonth = [];
    for (let i = 1; i <= 31; i++) {
      daysMonth.push(i);
    }
    const weeksMonthSelect = ["first", "second", "third", "fourth", "last"];
    const dayMonthSelect = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "l-v",
      "weekend",
      "allWeek",
    ];
    const monthNames = [
      { position: 1, name: "January", value: "january" },
      { position: 2, name: "February", value: "february" },
      { position: 3, name: "March", value: "march" },
      { position: 4, name: "April", value: "april" },
      { position: 5, name: "May", value: "may" },
      { position: 6, name: "June", value: "june" },
      { position: 7, name: "July", value: "july" },
      { position: 8, name: "August", value: "august" },
      { position: 9, name: "September", value: "september" },
      { position: 10, name: "October", value: "october" },
      { position: 11, name: "November", value: "november" },
      { position: 12, name: "December", value: "december" },
    ];
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    return {
      chevronBackOutline,
      frequency,
      daysMonth,
      weeksMonthSelect,
      dayMonthSelect,
      monthNames,
      saveOutline,
      days,
    };
  },
  data() {
    const frequencyOptions = [
      "unique",
      "daily",
      "weekly",
      "monthly",
      "annually",
    ];
    return {
      currentDay: 0,
      repeatData: {
        frequencySelect: "unique",
        daily: {
          every: 1,
        },
        weekly: {
          every: 1,
          days: ["monday"],
        },
        monthly: {
          every: 1,
          tipoMonth: "day",
          day: {
            dayMonth: [1],
          },
          weekly: {
            every: 1,
            week: "first",
            dayMonth: "allWeek",
          },
        },
        annually: {
          every: 1,
          checkAnnually: false,
          month: 1,
        },
      },
      fileTranslate: Object(),
      frequencyOptions,
    };
  },
  computed: {
    validate() {
      let p = false;
      if (
        this.repeatData.frequencySelect == "weekly" &&
        this.repeatData.weekly.days.length == 0
      ) {
        p = true;
      }
      if (
        this.repeatData.frequencySelect == "monthly" &&
        this.repeatData.monthly.tipoMonth == "day" &&
        this.repeatData.monthly.day.dayMonth.length == 0
      ) {
        p = true;
      }
      return p;
    },
  },
  mounted() {
    this.getFileTranslate().then(() => {
      if (this.repeatsProps.frequency != "") {
        this.repeatData.frequencySelect = "unique";
        if (this.repeatsProps.frequency != "unique") {
          this.repeatData.frequencySelect = this.repeatsProps.frequency;
          if (this.repeatsProps.frequency == "daily") {
            this.repeatData.daily = this.repeatsProps.data;
          }
          if (this.repeatsProps.frequency == "weekly") {
            this.repeatData.weekly = this.repeatsProps.data;
          }
          if (this.repeatsProps.frequency == "monthly") {
            this.repeatData.monthly = this.repeatsProps.data;
          }
          if (this.repeatsProps.frequency == "annually") {
            this.repeatData.annually = this.repeatsProps.data;
          }
        }
      }
    });

    this.setCurrentDay();
    eventBus().emitter.on("get-repeat-event", (response: any) => {
      this.repeatData.frequencySelect = "unique";
      if (response.reminders.frequency != "unique") {
        this.repeatData.frequencySelect = response.reminders.frequency;
        if (response.reminders.frequency == "daily") {
          this.repeatData.daily = response.reminders.data;
        }
        if (response.reminders.frequency == "weekly") {
          this.repeatData.weekly = response.reminders.data;
        }
        if (response.reminders.frequency == "monthly") {
          this.repeatData.monthly = response.reminders.data;
        }
        if (response.reminders.frequency == "annually") {
          this.repeatData.annually = response.reminders.data;
        }
      }
    });
  },
  methods: {
    setCurrentDay() {
      const d = new Date();
      const day = d.getDate();
      this.currentDay = day;
    },
    save() {
      let frequency = "unique";
      let data = {};

      if (this.repeatData.frequencySelect == "daily") {
        frequency = "daily";
        data = JSON.parse(JSON.stringify(this.repeatData.daily));
      }
      if (this.repeatData.frequencySelect == "weekly") {
        frequency = "weekly";
        data = JSON.parse(JSON.stringify(this.repeatData.weekly));
      }
      if (this.repeatData.frequencySelect == "monthly") {
        frequency = "monthly";
        data = JSON.parse(JSON.stringify(this.repeatData.monthly));
      }
      if (this.repeatData.frequencySelect == "annually") {
        frequency = "annually";
        data = JSON.parse(JSON.stringify(this.repeatData.annually));
      }
      modalController.dismiss({ frequency, data });
    },
    async getFileTranslate() {
      this.fileTranslate = [await userService().translate()];
    },
    convertFirstLetterLowercase(word: string) {
      return word.charAt(0).toLowerCase() + word.slice(1);
    },
  },
});
</script>
