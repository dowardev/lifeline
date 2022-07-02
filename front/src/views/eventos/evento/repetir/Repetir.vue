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

      <ion-toolbar>
        <ion-item>
          <ion-label>Frecuencia</ion-label>
          <ion-select v-model="repeatData.frequencySelect" interface="popover">
            <ion-select-option
              v-for="option in frequencyOptions"
              :key="option.name"
              :value="option.name"
            >
              {{ option.value }}
            </ion-select-option>
          </ion-select>
        </ion-item>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <section v-if="repeatData.frequencySelect == 'unique'"></section>

      <section v-if="repeatData.frequencySelect == 'daily'">
        <ion-row>
          <ion-col size="12">
            <ion-item>
              <ion-label>Cada</ion-label>
              <ion-select v-model="repeatData.daily.every" interface="popover">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">dia</div>
                  <div v-if="parseInt(item) > 1">dias</div>
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
              <ion-select v-model="repeatData.weekly.every" interface="popover">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">semana</div>
                  <div v-if="parseInt(item) > 1">semanas</div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>Dia(s)</ion-label>
              <ion-select :multiple="true" v-model="repeatData.weekly.days">
                <ion-select-option
                  v-for="day in days"
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
              <ion-label>Cada</ion-label>
              <ion-select value="1" v-model="repeatData.monthly.every">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">mes</div>
                  <div v-if="parseInt(item) > 1">meses</div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>Tipo</ion-label>
              <ion-select v-model="repeatData.monthly.tipoMonth">
                <ion-select-option value="day"> dia </ion-select-option>
                <ion-select-option value="week"> semana </ion-select-option>
              </ion-select>
            </ion-item>
            <div v-if="repeatData.monthly.tipoMonth == 'day'">
              <ion-item>
                <ion-label> Dias del mes </ion-label>
                <ion-select
                  :multiple="true"
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
                <ion-label>Semana</ion-label>
                <ion-select v-model="repeatData.monthly.weekly.week">
                  <ion-select-option
                    v-for="week in weeksMonthSelect"
                    :key="week.name"
                    :value="week.name"
                  >
                    {{ week.value }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label>Dia</ion-label>
                <ion-select v-model="repeatData.monthly.weekly.dayMonth">
                  <ion-select-option
                    v-for="day in dayMonthSelect"
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
              <ion-label>Cada</ion-label>
              <ion-select value="1" v-model="repeatData.annually.every">
                <ion-select-option
                  v-for="item in frequency"
                  :key="item"
                  :value="item"
                >
                  {{ item }}
                  <div v-if="parseInt(item) == 1">año</div>
                  <div v-if="parseInt(item) > 1">años</div>
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>Mes</ion-label>
              <ion-select v-model="repeatData.annually.month">
                <ion-select-option
                  v-for="month in monthNames"
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
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../EventBus";
// import userService from "../../../../services/user";

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
      frequency.push(i.toString());
    }
    const daysMonth = [];
    for (let i = 1; i <= 31; i++) {
      daysMonth.push(i);
    }
    const weeksMonthSelect = [
      { name: "first", value: "primera" },
      { name: "second", value: "segunda" },
      { name: "third", value: "tercera" },
      { name: "fourth", value: "cuarta" },
      { name: "last", value: "ultima" },
    ];
    const dayMonthSelect = [
      { name: "monday", value: "Lunes" },
      { name: "tuesday", value: "Martes" },
      { name: "wednesday", value: "Miercoles" },
      { name: "thursday", value: "Jueves" },
      { name: "friday", value: "Friday" },
      { name: "saturday", value: "Sabado" },
      { name: "sunday", value: "Domingo" },
      { name: "l-v", value: "Dias habiles" },
      { name: "weekend", value: "Fin de semana" },
    ];
    const monthNames = [
      { position: "1", name: "January", value: "Enero" },
      { position: "2", name: "February", value: "Febrero" },
      { position: "3", name: "March", value: "Marzo" },
      { position: "4", name: "April", value: "Abril" },
      { position: "5", name: "May", value: "Mayo" },
      { position: "6", name: "June", value: "Junio" },
      { position: "7", name: "July", value: "Julio" },
      { position: "8", name: "August", value: "Agosto" },
      { position: "9", name: "September", value: "Septiembre" },
      { position: "10", name: "October", value: "Octubre" },
      { position: "11", name: "November", value: "Noviembre" },
      { position: "12", name: "December", value: "Diciembre" },
    ];
    const days = [
      { name: "monday", value: "Lunes" },
      { name: "tuesday", value: "Martes" },
      { name: "wednesday", value: "Miercoles" },
      { name: "thursday", value: "Jueves" },
      { name: "friday", value: "Viernes" },
      { name: "saturday", value: "Sabado" },
      { name: "sunday", value: "Domingo" },
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
      { name: "unique", value: "Unico" },
      { name: "daily", value: "Diario" },
      { name: "weekly", value: "Semanal" },
      { name: "monthly", value: "Mensual" },
      { name: "annually", value: "Anual" },
    ];
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
    // async getFileTranslate() {
    //   this.fileTranslate = [await userService().translate()];
    // },
    convertFirstLetterLowercase(word: string) {
      return word.charAt(0).toLowerCase() + word.slice(1);
    },
  },
});
</script>
