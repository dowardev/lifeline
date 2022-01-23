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
          <ion-button v-on:click="save()">
            <ion-icon slot="start" :icon="saveOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar v-if="fileTranslate[0] != null">
        <ion-item>
          <ion-label>{{ fileTranslate[0]["frecuency"] }}</ion-label>
          <ion-select v-model="repeatData.frecuencySelect">
            <ion-select-option
              v-for="option in frecuencyOptions"
              :key="option"
              :value="option"
              >{{
                fileTranslate[0]["repeatsOptions"][option]
              }}</ion-select-option
            >
          </ion-select>
        </ion-item>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" v-if="fileTranslate[0] != null">
      <section v-if="repeatData.frecuencySelect == 'unique'">
        <div class="ion-padding">
          <p v-if="repeatData.daily.every == 1">
            <small>{{ fileTranslate[0]["repeatsMessages"]["unique"] }}</small>
          </p>
        </div>
      </section>

      <section v-if="repeatData.frecuencySelect == 'daily'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{ fileTranslate[0]["every"] }}</ion-label>
              <ion-select v-model="repeatData.daily.every">
                <ion-select-option
                  v-for="item in frecuency"
                  :key="item"
                  :value="item"
                  >{{ item }}</ion-select-option
                >
              </ion-select>
            </ion-item>
          </ion-col>
          <div class="ion-padding">
            <p v-if="repeatData.daily.every == 1">
              <small>
                {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                {{ convertFirstLetterLowercase(fileTranslate[0]["day"]) }}
              </small>
            </p>
            <p v-if="repeatData.daily.every > 1">
              <small>
                {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                {{ repeatData.daily.every }}
                {{ convertFirstLetterLowercase(fileTranslate[0]["days"]) }}
              </small>
            </p>
          </div>
        </ion-row>
      </section>

      <section v-if="repeatData.frecuencySelect == 'weekly'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>Cada</ion-label>
              <ion-select v-model="repeatData.weekly.every">
                <ion-select-option
                  v-for="item in frecuency"
                  :key="item"
                  :value="item"
                  >{{ item }}</ion-select-option
                >
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>{{ fileTranslate[0]["day(s)"] }}</ion-label>
              <ion-select multiple="true" v-model="repeatData.weekly.days">
                <ion-select-option value="monday">
                  {{ fileTranslate[0]["monday"] }}
                </ion-select-option>
                <ion-select-option value="thuesday">
                  {{ fileTranslate[0]["thuesday"] }}
                </ion-select-option>
                <ion-select-option value="wednesday">
                  {{ fileTranslate[0]["wednesday"] }}
                </ion-select-option>
                <ion-select-option value="thursday">
                  {{ fileTranslate[0]["thuesday"] }}
                </ion-select-option>
                <ion-select-option value="friday">
                  {{ fileTranslate[0]["friday"] }}
                </ion-select-option>
                <ion-select-option value="saturday">
                  {{ fileTranslate[0]["saturday"] }}
                </ion-select-option>
                <ion-select-option value="sunday">
                  {{ fileTranslate[0]["sunday"] }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
          <div class="ion-padding">
            <p>
              <small v-if="repeatData.weekly.every == 1">
                {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                {{ convertFirstLetterLowercase(fileTranslate[0]["week"]) }}
              </small>
              <small v-if="repeatData.weekly.every > 1">
                {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                {{ repeatData.weekly.every }}
                {{ convertFirstLetterLowercase(fileTranslate[0]["weeks"]) }}
              </small>
              <small v-if="repeatData.weekly.days.length == 1">
                ({{
                  convertFirstLetterLowercase(
                    fileTranslate[0][convertFirstLetterLowercase(day)]
                  )
                }})
              </small>
              <small v-if="repeatData.weekly.days.length > 1">
                ({{
                  convertFirstLetterLowercase(
                    fileTranslate[0]["repeatsMessages"]["multipleDays"]
                  )
                }})
              </small>
            </p>
          </div>
        </ion-row>
      </section>

      <section v-if="repeatData.frecuencySelect == 'monthly'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{ fileTranslate[0]["every"] }}</ion-label>
              <ion-select value="1" v-model="repeatData.monthly.every">
                <ion-select-option
                  v-for="item in frecuency"
                  :key="item"
                  :value="item"
                  >{{ item }}</ion-select-option
                >
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
                  {{ fileTranslate[0]["repeatsMessages"]["daysOfMonth"] }}
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
              <div class="ion-padding">
                <p>
                  <small v-if="repeatData.monthly.every == 1">
                    {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                    {{
                      convertFirstLetterLowercase(fileTranslate[0]["month"]) +
                      " "
                    }}
                  </small>
                  <small v-if="repeatData.monthly.every > 1">
                    {{
                      fileTranslate[0]["repeatsMessages"][
                        "repeatMontlyMoreDay"
                      ][0]
                    }}
                    {{ repeatData.monthly.every }}
                    {{
                      fileTranslate[0]["repeatsMessages"][
                        "repeatMontlyMoreDay"
                      ][1] + " "
                    }}
                  </small>
                  <small v-if="repeatData.monthly.day.dayMonth.length == 1">
                    ({{ repeatData.monthly.day.dayMonth + "°" }})
                  </small>
                  <small v-if="repeatData.monthly.day.dayMonth.length > 1">
                    ({{ fileTranslate[0]["repeatsMessages"]["multipleDays"] }})
                  </small>
                </p>
              </div>
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
              <div class="ion-padding">
                <p v-if="repeatData.monthly.every == 1">
                  <small>
                    {{
                      fileTranslate[0]["repeatsMessages"]["repeatMontlyWeek"]
                    }}
                    {{
                      convertFirstLetterLowercase(
                        fileTranslate[0]["weekRepeats"][
                          repeatData.monthly.weekly.week
                        ]
                      )
                    }}
                    {{ convertFirstLetterLowercase(fileTranslate[0]["week"]) }}
                    ({{
                      convertFirstLetterLowercase(
                        fileTranslate[0][repeatData.monthly.weekly.dayMonth]
                      )
                    }})
                  </small>
                </p>
                <p v-if="repeatData.monthly.every > 1">
                  <small
                    >El evento se repetira cada
                    {{ repeatData.monthly.every }} meses en la
                    {{ repeatData.monthly.weekly.week }} semana({{
                      repeatData.monthly.weekly.dayMonth
                    }})
                  </small>
                </p>
              </div>
            </div>
          </ion-col>
        </ion-row>
      </section>

      <section v-if="repeatData.frecuencySelect == 'annually'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>{{ fileTranslate[0]["every"] }}</ion-label>
              <ion-select value="1" v-model="repeatData.annually.every">
                <ion-select-option
                  v-for="item in frecuency"
                  :key="item"
                  :value="item"
                  >{{ item }}</ion-select-option
                >
              </ion-select>
            </ion-item>
            <ion-list>
              <ion-list-header>
                <ion-label>{{ fileTranslate[0]["monthsToRepeat"] }}</ion-label>
                <ion-toggle
                  v-model="repeatData.annually.checkAnnually"
                  :checked="repeatData.annually.checkAnnually == true"
                ></ion-toggle>
              </ion-list-header>
              <ion-item :disabled="repeatData.annually.checkAnnually == false">
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
            </ion-list>
          </ion-col>
          <div class="ion-padding">
            <p>
              <small v-if="repeatData.annually.every == 1">
                {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                {{ convertFirstLetterLowercase(fileTranslate[0]["year"]) }}
              </small>
              <small v-if="repeatData.annually.every > 1">
                {{ fileTranslate[0]["repeatsMessages"]["repeatFrecuency"] }}
                {{ repeatData.annually.every }}
                {{ convertFirstLetterLowercase(fileTranslate[0]["years"]) }}
              </small>
              <small v-if="repeatData.annually.checkAnnually == true">
                ({{
                  convertFirstLetterLowercase(
                    monthNames[repeatData.annually.month].name
                  )
                }}
                {{ currentDay }})
              </small>
            </p>
          </div>
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
  IonToggle,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../EventBus";
import userService from "../../../../services/user.vue";

export default defineComponent({
  name: "Repetir",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption,
    IonToggle,
  },
  props: {
    repeatsProps: { type: Array<any>(), default: [] },
    day: { type: String, default: "" },
  },
  setup() {
    const frecuency = [];
    for (let i = 1; i <= 50; i++) {
      frecuency.push(i);
    }
    const daysMonth = [];
    for (let i = 1; i <= 31; i++) {
      daysMonth.push(i);
    }
    // TODO: search correct
    const weeksMonthSelect = ["first", "second", "third", "quarter", "last"];
    const dayMonthSelect = [
      "monday",
      "thuesday",
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
      { position: 1, name: "Enero", value: "enero" },
      { position: 2, name: "Febrero", value: "febrero" },
      { position: 3, name: "Marzo", value: "marzo" },
      { position: 4, name: "Abril", value: "abril" },
      { position: 5, name: "Mayo", value: "mayo" },
      { position: 6, name: "Junio", value: "junio" },
      { position: 7, name: "Julio", value: "julio" },
      { position: 8, name: "Agosto", value: "agosto" },
      { position: 9, name: "Septiembre", value: "septiembre" },
      { position: 10, name: "Octubre", value: "octubre" },
      { position: 11, name: "Noviembre", value: "noviembre" },
      { position: 12, name: "Diciembre", value: "diciembre" },
    ];
    return {
      chevronBackOutline,
      frecuency,
      daysMonth,
      weeksMonthSelect,
      dayMonthSelect,
      monthNames,
      saveOutline,
    };
  },
  data() {
    const frecuencyOptions = [
      "unique",
      "daily",
      "weekly",
      "monthly",
      "annually",
    ];
    return {
      currentDay: 0,
      repeatData: {
        frecuencySelect: "unique",
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
      frecuencyOptions,
    };
  },
  mounted() {
    this.getFileTranslate().then(() => {
      if (this.repeatsProps.frecuency != "") {
        this.repeatData.frecuencySelect = "unique";
        if (this.repeatsProps.frecuency != "unique") {
          this.repeatData.frecuencySelect = this.repeatsProps.frecuency;
          if (this.repeatsProps.frecuency == "daily") {
            this.repeatData.daily = this.repeatsProps.data;
          }
          if (this.repeatsProps.frecuency == "weekly") {
            this.repeatData.weekly = this.repeatsProps.data;
          }
          if (this.repeatsProps.frecuency == "monthly") {
            this.repeatData.monthly = this.repeatsProps.data;
          }
          if (this.repeatsProps.frecuency == "annually") {
            this.repeatData.annually = this.repeatsProps.data;
          }
        }
      }
    });

    this.setCurrentDay();
    eventBus().emitter.on("get-repeat-event", (response: any) => {
      this.repeatData.frecuencySelect = "unique";
      if (response.reminders.frecuency != "unique") {
        this.repeatData.frecuencySelect = response.reminders.frecuency;
        if (response.reminders.frecuency == "daily") {
          this.repeatData.daily = response.reminders.data;
        }
        if (response.reminders.frecuency == "weekly") {
          this.repeatData.weekly = response.reminders.data;
        }
        if (response.reminders.frecuency == "monthly") {
          this.repeatData.monthly = response.reminders.data;
        }
        if (response.reminders.frecuency == "annually") {
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
      let frecuency = "unique";
      let data = {};

      if (this.repeatData.frecuencySelect == "daily") {
        frecuency = "daily";
        data = JSON.parse(JSON.stringify(this.repeatData.daily));
      }
      if (this.repeatData.frecuencySelect == "weekly") {
        frecuency = "weekly";
        data = JSON.parse(JSON.stringify(this.repeatData.weekly));
      }
      if (this.repeatData.frecuencySelect == "monthly") {
        frecuency = "monthly";
        data = JSON.parse(JSON.stringify(this.repeatData.monthly));
      }
      if (this.repeatData.frecuencySelect == "annually") {
        frecuency = "annually";
        data = JSON.parse(JSON.stringify(this.repeatData.annually));
      }
      modalController.dismiss({
        frecuency,
        data,
      });
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
