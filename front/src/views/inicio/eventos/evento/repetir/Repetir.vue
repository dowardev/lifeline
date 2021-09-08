<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
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
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="12">
          <ion-item>
            <ion-label>Frecuencia</ion-label>
            <ion-select v-model="repeatData.frecuencySelect">
              <ion-select-option value="unique">Evento unico</ion-select-option>
              <ion-select-option value="daily">Diariamente</ion-select-option>
              <ion-select-option value="weekly">Semanalmente</ion-select-option>
              <ion-select-option value="monthly"
                >Mensualmente</ion-select-option
              >
              <ion-select-option value="annually">Anualmente</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-col>
      </ion-row>

      <div class="ion-padding" v-if="repeatData.frecuencySelect == 'unique'">
        <p v-if="repeatData.daily.every == 1">
          <small>El evento se repetira unicamente una vez</small>
        </p>
      </div>

      <ion-row v-if="repeatData.frecuencySelect == 'daily'">
        <ion-col size="12">
          <ion-item>
            <ion-label>Cada</ion-label>
            <ion-select value="1" v-model="repeatData.daily.every">
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
            <small>El evento se repetira cada dia</small>
          </p>
          <p v-if="repeatData.daily.every > 1">
            <small
              >El evento se repetira cada
              {{ repeatData.daily.every }} dias</small
            >
          </p>
        </div>
      </ion-row>

      <ion-row v-if="repeatData.frecuencySelect == 'weekly'">
        <ion-col size="12">
          <ion-item>
            <ion-label>Cada</ion-label>
            <ion-select value="1" v-model="repeatData.weekly.every">
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
              <ion-label>Dias a repetir</ion-label>
              <ion-toggle
                v-model="repeatData.weekly.checkWeek"
                :checked="repeatData.weekly.checkWeek == true"
              ></ion-toggle>
            </ion-list-header>
            <ion-item :disabled="repeatData.weekly.checkWeek == false">
              <ion-label>Dia(s)</ion-label>
              <ion-select multiple="true" v-model="repeatData.weekly.days">
                <ion-select-option value="lunes">Lunes</ion-select-option>
                <ion-select-option value="martes">Martes</ion-select-option>
                <ion-select-option value="miercoles"
                  >Miercoles</ion-select-option
                >
                <ion-select-option value="jueves">Jueves</ion-select-option>
                <ion-select-option value="viernes">Viernes</ion-select-option>
                <ion-select-option value="sabado">Sabado</ion-select-option>
                <ion-select-option value="domingo">Domingo</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-col>
        <div class="ion-padding">
          <p v-if="repeatData.weekly.every == 1">
            <small>El evento se repetira cada semana los dias</small>
          </p>
          <p v-if="repeatData.weekly.every > 1">
            <small
              >El evento se repetira cada
              {{ repeatData.weekly.every }} semanas</small
            >
          </p>
        </div>
      </ion-row>

      <ion-row v-if="repeatData.frecuencySelect == 'monthly'">
        <ion-col size="12">
          <ion-item>
            <ion-label>Cada</ion-label>
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
            <ion-label>Tipo</ion-label>
            <ion-select v-model="repeatData.monthly.tipoMonth">
              <ion-select-option value="day">Dia</ion-select-option>
              <ion-select-option value="week">Semana</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item v-if="repeatData.monthly.tipoMonth == 'day'">
            <ion-label>Dia(s) del mes</ion-label>
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
          <ion-item v-if="repeatData.monthly.tipoMonth == 'week'">
            <ion-label>Semana</ion-label>
            <ion-select v-model="repeatData.monthly.weekly.week">
              <ion-select-option
                v-for="week in weeksMonthSelect"
                :key="week"
                :value="week.value"
                >{{ week.label }}</ion-select-option
              >
            </ion-select>
          </ion-item>
          <ion-item v-if="repeatData.monthly.tipoMonth == 'week'">
            <ion-label>Dia</ion-label>
            <ion-select v-model="repeatData.monthly.weekly.dayMonth">
              <ion-select-option
                v-for="day in dayMonthSelect"
                :key="day"
                :value="day.value"
                >{{ day.label }}</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-col>
        <div class="ion-padding" v-if="repeatData.monthly.tipoMonth == 'day'">
          <p v-if="repeatData.monthly.every == 1">
            <small>El evento se repetira cada mes el dia </small>
            <small v-for="day in repeatData.monthly.day.dayMonth" :key="day">{{
              day + "° "
            }}</small>
          </p>
          <p v-if="repeatData.monthly.every > 1">
            <small
              >El evento se repetira cada {{ repeatData.monthly.every }} meses
              el dia
            </small>
            <small v-for="day in repeatData.monthly.day.dayMonth" :key="day">{{
              day + "° "
            }}</small>
          </p>
        </div>
        <div class="ion-padding" v-if="repeatData.monthly.tipoMonth == 'week'">
          <p v-if="repeatData.monthly.every == 1">
            <small
              >El evento se repetira cada mes en la
              {{ repeatData.monthly.weekly.week }} semana({{
                repeatData.monthly.weekly.dayMonth
              }})
            </small>
          </p>
          <p v-if="repeatData.monthly.every > 1">
            <small
              >El evento se repetira cada {{ repeatData.monthly.every }} meses
              en la {{ repeatData.monthly.weekly.week }} semana({{
                repeatData.monthly.weekly.dayMonth
              }})
            </small>
          </p>
        </div>
      </ion-row>

      <ion-row v-if="repeatData.frecuencySelect == 'annually'">
        <ion-col size="12">
          <ion-item>
            <ion-label>Cada</ion-label>
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
              <ion-label>Meses a repetir</ion-label>
              <ion-toggle
                v-model="repeatData.annually.checkAnnually"
                :checked="repeatData.annually.checkAnnually == true"
              ></ion-toggle>
            </ion-list-header>
            <ion-item :disabled="repeatData.annually.checkAnnually == false">
              <ion-label>Mes</ion-label>
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
          <p v-if="repeatData.annually.every == 1">
            <small>El evento se repetira cada año</small>
            <small v-if="repeatData.annually.checkAnnually == true">
              el {{ currentDay }} de
              {{ monthNames[repeatData.annually.month].name }}</small
            >
          </p>
          <p v-if="repeatData.annually.every > 1">
            <small
              >El evento se repetira cada
              {{ repeatData.annually.every }} años</small
            >
            <small v-if="repeatData.annually.checkAnnually == true">
              el {{ currentDay }} de
              {{ monthNames[repeatData.annually.month].name }}</small
            >
          </p>
        </div>
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
  IonSelect,
  IonSelectOption,
  IonToggle,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, saveOutline } from "ionicons/icons";
import eventBus from "../../../../../EventBus";

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
  setup() {
    const frecuency = [];
    for (let i = 1; i <= 50; i++) {
      frecuency.push(i.toString());
    }
    const daysMonth = [];
    for (let i = 1; i <= 31; i++) {
      daysMonth.push(i.toString());
    }
    const weeksMonthSelect = [
      { label: "Primera", value: "primera" },
      { label: "Segunda", value: "segunda" },
      { label: "Tercera", value: "tercera" },
      { label: "Cuarta", value: "cuarta" },
      { label: "Ultima", value: "ultima" },
    ];
    const dayMonthSelect = [
      { label: "Lunes", value: "lunes" },
      { label: "Martes", value: "martes" },
      { label: "Miercoles", value: "miercoles" },
      { label: "Jueves", value: "jueves" },
      { label: "Viernes", value: "viernes" },
      { label: "Sabado", value: "sabado" },
      { label: "Domingo", value: "domingo" },
      { label: "Lunes - Viernes", value: "l-v" },
      { label: "Fin de semana", value: "fin_semana" },
      { label: "Toda la semana", value: "toda" },
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
    return {
      currentDay: 0,
      repeatData: {
        frecuencySelect: "unique",
        daily: {
          every: "1",
        },
        weekly: {
          every: "1",
          checkWeek: false,
          days: ["lunes"],
        },
        monthly: {
          every: "1",
          tipoMonth: "day",
          day: {
            dayMonth: "1",
          },
          weekly: {
            every: "1",
            week: "primera",
            dayMonth: "toda",
          },
        },
        annually: {
          every: "1",
          checkAnnually: false,
          month: 1 as any,
        },
      },
    };
  },
  mounted() {
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
      let frecuency = "unico";
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
      eventBus().emitter.emit("set-repeat-event", {
        frecuency,
        data,
      });
      this.$router.go(-1);
    },
  },
});
</script>
