<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="closeModal()">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ capitalizeFirstLetter($t("message.repeat")) }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="validate" @click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-item>
        <ion-label>{{ capitalizeFirstLetter($t("message.repeat")) }}</ion-label>
        <ion-select v-model="repeatData.frequencySelect" interface="popover">
          <ion-select-option
            v-for="option in setFrecuencyOptions"
            :key="option.name"
            :value="option.name"
          >
            {{ capitalizeFirstLetter(option.value) }}
          </ion-select-option>
        </ion-select>
      </ion-item>

      <!-- <section v-if="repeatData.frequencySelect == 'unique'"></section> -->

      <section v-if="repeatData.frequencySelect == 'daily'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{
                capitalizeFirstLetter($t("message.every"))
              }}</ion-label>
              <ion-select v-model="repeatData.daily.every" interface="popover">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">
                    {{ $tc("message.day", 1) }}
                  </div>
                  <div v-if="parseInt(item) > 1">
                    {{ $tc("message.day", 2) }}
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
              <ion-label>{{
                capitalizeFirstLetter($t("message.every"))
              }}</ion-label>
              <ion-select v-model="repeatData.weekly.every" interface="popover">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">
                    {{ $tc("message.week", 1) }}
                  </div>
                  <div v-if="parseInt(item) > 1">
                    {{ $tc("message.week", 2) }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{
                capitalizeFirstLetter($tc("message.day", 2))
              }}</ion-label>
              <ion-select
                :multiple="true"
                @ion-change="repeatData.weekly.days = $event.detail.value"
              >
                <ion-select-option
                  v-for="day in setDaysNames"
                  :key="day.name"
                  :value="day.name"
                >
                  {{ day.value }}
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
              <ion-label>{{
                capitalizeFirstLetter($t("message.every"))
              }}</ion-label>
              <ion-select v-model="repeatData.monthly.every" value="1">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">
                    {{ $tc("message.month", 1) }}
                  </div>
                  <div v-if="parseInt(item) > 1">
                    {{ $tc("message.month", 2) }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{
                capitalizeFirstLetter($t("message.type"))
              }}</ion-label>
              <ion-select v-model="repeatData.monthly.tipoMonth">
                <ion-select-option value="day">
                  {{ capitalizeFirstLetter($tc("message.day", 1)) }}
                </ion-select-option>
                <ion-select-option value="week"
                  >{{ capitalizeFirstLetter($tc("message.week", 1)) }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <div v-if="repeatData.monthly.tipoMonth == 'day'">
              <ion-item>
                <ion-label>
                  {{ capitalizeFirstLetter($tc("message.dayOfTheMonth", 2)) }}
                </ion-label>
                <ion-select
                  ion-change="repeatData.monthly.day.dayMonth=$event.detail.value"
                  :multiple="true"
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
                <ion-label>{{
                  capitalizeFirstLetter($tc("message.week", 1))
                }}</ion-label>
                <ion-select v-model="repeatData.monthly.weekly.week">
                  <ion-select-option
                    v-for="week in setSelectWeekOptions"
                    :key="week.name"
                    :value="week.name"
                  >
                    {{ week.value }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label>{{
                  capitalizeFirstLetter($tc("message.day", 1))
                }}</ion-label>
                <ion-select v-model="repeatData.monthly.weekly.dayMonth">
                  <ion-select-option
                    v-for="day in setSelectOptionsDay"
                    :key="day.name"
                    :value="day.name"
                    >{{ day.value }}</ion-select-option
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
              <ion-label>{{
                capitalizeFirstLetter($t("message.every"))
              }}</ion-label>
              <ion-select v-model="repeatData.annually.every" value="1">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">
                    {{ capitalizeFirstLetter($tc("message.year", 1)) }}
                  </div>
                  <div v-if="parseInt(item) > 1">
                    {{ capitalizeFirstLetter($tc("message.year", 2)) }}
                  </div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{
                capitalizeFirstLetter($tc("message.month", 2))
              }}</ion-label>
              <ion-select v-model="repeatData.annually.month">
                <ion-select-option
                  v-for="month in setMonthsNames"
                  :key="month.position"
                  :value="month.position"
                  >{{ month.value }}</ion-select-option
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
import { closeOutline, saveOutline } from "ionicons/icons";
import { capitalizeFirstLetter as capitalizeFirstLetterService } from "../../../../services/system";

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
    repeatsProps: {
      type: Array<any>(),
      default: { frequency: "unique", name: "Unico", data: {} },
    },
  },

  setup() {
    const frequency = [];
    for (let i = 1; i <= 50; i++) {
      frequency.push(i.toString());
    }
    const daysMonth = [];
    for (let i = 1; i <= 31; i++) {
      daysMonth.push(i);
    }
    return {
      closeOutline,
      frequency,
      daysMonth,
      saveOutline,
      capitalizeFirstLetter: capitalizeFirstLetterService,
    };
  },

  data() {
    return {
      currentDay: 0,
      repeatData: {
        frequencySelect: "unique",
        daily: {
          every: "1",
        },
        weekly: {
          every: "1",
          days: ["monday"],
        },
        monthly: {
          every: "1",
          tipoMonth: "day",
          day: {
            dayMonth: [1],
          },
          weekly: {
            every: "1",
            week: "first",
            dayMonth: "allWeek",
          },
        },
        annually: {
          every: "1",
          checkAnnually: false,
          month: "1",
        },
      },
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
    setFrecuencyOptions() {
      return [
        {
          name: "unique",
          value: this.$t("message.unique"),
        },
        {
          name: "daily",
          value: this.$t("message.daily"),
        },
        {
          name: "weekly",
          value: this.$t("message.weekly"),
        },
        {
          name: "monthly",
          value: this.$t("message.monthly"),
        },
        {
          name: "annually",
          value: this.$t("message.annually"),
        },
      ];
    },
    setSelectWeekOptions() {
      return [
        {
          name: "first",
          value: this.$t("message.first"),
        },
        {
          name: "second",
          value: this.$t("message.second"),
        },
        {
          name: "third",
          value: this.$t("message.third"),
        },
        {
          name: "fourth",
          value: this.$t("message.fourth"),
        },
        {
          name: "last",
          value: this.$t("message.last"),
        },
      ];
    },
    setDaysNames() {
      return [
        {
          name: "monday",
          value: this.$t("message.monday"),
        },
        {
          name: "tuesday",
          value: this.$t("message.tuesday"),
        },
        {
          name: "wednesday",
          value: this.$t("message.wednesday"),
        },
        {
          name: "thursday",
          value: this.$t("message.thursday"),
        },
        {
          name: "friday",
          value: this.$t("message.friday"),
        },
        {
          name: "saturday",
          value: this.$t("message.saturday"),
        },
        {
          name: "sunday",
          value: this.$t("message.sunday"),
        },
      ];
    },
    setMonthsNames() {
      return [
        {
          position: "1",
          name: "January",
          value: this.$t("message.january"),
        },
        {
          position: "2",
          name: "February",
          value: this.$t("message.february"),
        },
        {
          position: "3",
          name: "March",
          value: this.$t("message.march"),
        },
        {
          position: "4",
          name: "April",
          value: this.$t("message.april"),
        },
        {
          position: "5",
          name: "May",
          value: this.$t("message.may"),
        },
        {
          position: "6",
          name: "June",
          value: this.$t("message.june"),
        },
        {
          position: "7",
          name: "July",
          value: this.$t("message.july"),
        },
        {
          position: "8",
          name: "August",
          value: this.$t("message.august"),
        },
        {
          position: "9",
          name: "September",
          value: this.$t("message.september"),
        },
        {
          position: "10",
          name: "October",
          value: this.$t("message.october"),
        },
        {
          position: "11",
          name: "November",
          value: this.$t("message.november"),
        },
        {
          position: "12",
          name: "December",
          value: this.$t("message.december"),
        },
      ];
    },
    setSelectOptionsDay() {
      return [
        {
          name: "monday",
          value: this.$t("message.monday"),
        },
        {
          name: "tuesday",
          value: this.$t("message.tuesday"),
        },
        {
          name: "wednesday",
          value: this.$t("message.wednesday"),
        },
        {
          name: "thursday",
          value: this.$t("message.thursday"),
        },
        {
          name: "friday",
          value: this.$t("message.friday"),
        },
        {
          name: "saturday",
          value: this.$t("message.saturday"),
        },
        {
          name: "sunday",
          value: this.$t("message.sunday"),
        },
        {
          name: "l-v",
          value: this.$t("message.businessDay"),
        },
        {
          name: "weekend",
          value: this.$t("message.weekend"),
        },
      ];
    },
  },

  mounted() {
    this.setData();
  },

  methods: {
    setData() {
      this.repeatData.frequencySelect = this.repeatsProps.frequency;
      (this.repeatData as any)[this.repeatsProps.frequency] =
        this.repeatsProps.data;
    },

    save() {
      const frequency = this.repeatData.frequencySelect;
      let frequencyName = "";
      let data = {};

      this.setFrecuencyOptions.forEach((element) => {
        if (element.name == frequency) {
          frequencyName = element.value;
          data = (this.repeatData as any)[element.name];
        }
      });

      modalController.dismiss({ frequency, frequencyName, data });
    },
    // async getFileTranslate() {
    //   this.fileTranslate = [await userService().translate()];
    // },
    convertFirstLetterLowercase(word: string) {
      return word.charAt(0).toLowerCase() + word.slice(1);
    },

    closeModal() {
      modalController.dismiss();
    },
  },
});
</script>
