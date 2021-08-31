<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="firstMenu" mode="md"></ion-menu-button>
        </ion-buttons>
        <ion-title>Inicio</ion-title>
        <ion-buttons slot="end">
          <ion-button v-on:click="today()">
            <ion-icon :icon="todayOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row>
        <ion-col size="6">
          <ion-item lines="none">
            <ion-button
              fill="clear"
              slot="start"
              v-on:click="previousDate()"
              :disabled="buttonPreviousDate == false"
            >
              <ion-icon :icon="chevronBackOutline"></ion-icon>
            </ion-button>
            <ion-select
              :interface-options="customPopoverOptions"
              interface="popover"
              v-model="monthSelected.position"
            >
              <ion-select-option
                :value="month.position"
                v-for="month in monthNames"
                v-bind:key="month"
                >{{ month.name }}</ion-select-option
              >
            </ion-select>
          </ion-item>
        </ion-col>
        <ion-col size="6">
          <ion-item lines="none">
            <ion-select
              :interface-options="customPopoverOptions"
              interface="popover"
              v-model="yearSelected"
            >
              <ion-select-option
                :value="year"
                v-for="year in years"
                v-bind:key="year"
                >{{ year }}</ion-select-option
              >
            </ion-select>
            <ion-button
              fill="clear"
              slot="end"
              v-on:click="nextDate()"
              :disabled="buttonNextDate == false"
            >
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-col>
      </ion-row>

      <ion-row class="ion-padding">
        <ion-col size="12" class="center">
          <table style="width:100%">
            <tr class="days">
              <td>
                <ion-button fill="clear">
                  L
                </ion-button>
              </td>
              <td>
                <ion-button fill="clear">
                  M
                </ion-button>
              </td>
              <td>
                <ion-button fill="clear">
                  M
                </ion-button>
              </td>
              <td>
                <ion-button fill="clear">
                  J
                </ion-button>
              </td>
              <td>
                <ion-button fill="clear">
                  V
                </ion-button>
              </td>
              <td>
                <ion-button fill="clear">
                  S
                </ion-button>
              </td>
              <td>
                <ion-button fill="clear">
                  D
                </ion-button>
              </td>
            </tr>

            <tr>
              <td v-for="date in [0, 1, 2, 3, 4, 5, 6]" :key="date">
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[date].selected,
                  }"
                  v-if="fechas[date].day != ''"
                  v-on:click="selectDay()"
                >
                  {{ fechas[date].day }}
                </ion-button>
              </td>
            </tr>

            <tr>
              <td v-for="date in [7, 8, 9, 10, 11, 12, 13]" :key="date">
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[date].selected,
                  }"
                  v-if="fechas[date].day != ''"
                  v-on:click="selectDay()"
                >
                  {{ fechas[date].day }}
                </ion-button>
              </td>
            </tr>

            <tr>
              <td v-for="date in [14, 15, 16, 17, 18, 19, 20]" :key="date">
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[date].selected,
                  }"
                  v-if="fechas[date].day != ''"
                  v-on:click="selectDay()"
                >
                  {{ fechas[date].day }}
                </ion-button>
              </td>
            </tr>

            <tr>
              <td v-for="date in [21, 22, 23, 24, 25, 26, 27]" :key="date">
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[date].selected,
                  }"
                  v-if="fechas[date].day != ''"
                  v-on:click="selectDay()"
                >
                  {{ fechas[date].day }}
                </ion-button>
              </td>
            </tr>

            <tr>
              <td v-for="date in [28, 29, 30, 31, 32, 33, 34]" :key="date">
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[date].selected,
                  }"
                  v-if="fechas[date].day != ''"
                  v-on:click="selectDay()"
                >
                  {{ fechas[date].day }}
                </ion-button>
              </td>
            </tr>

            <tr>
              <td v-for="date in [35, 36, 37, 38, 39, 40, 41]" :key="date">
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[date].selected,
                  }"
                  v-if="fechas[date].day != ''"
                  v-on:click="selectDay()"
                >
                  {{ fechas[date].day }}
                </ion-button>
              </td>
            </tr>
          </table>
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
  IonItem,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonMenuButton,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  chevronForwardOutline,
  todayOutline,
} from "ionicons/icons";
export default defineComponent({
  name: "Inicio",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonButton,
    IonMenuButton,
  },
  setup() {
    return { chevronBackOutline, chevronForwardOutline, todayOutline };
  },
  mounted() {
    this.today();
  },
  data() {
    const fechas = [
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 1, selected: false },
      { day: 2, selected: false },
      { day: 3, selected: false },
      { day: 4, selected: false },
      { day: 5, selected: false },
      { day: 6, selected: false },
      { day: 7, selected: false },
      { day: 8, selected: false },
      { day: 9, selected: false },
      { day: 10, selected: false },
      { day: 11, selected: false },
      { day: 12, selected: false },
      { day: 13, selected: false },
      { day: 14, selected: false },
      { day: 15, selected: false },
      { day: 16, selected: false },
      { day: 17, selected: false },
      { day: 18, selected: false },
      { day: 19, selected: false },
      { day: 20, selected: false },
      { day: 21, selected: false },
      { day: 22, selected: false },
      { day: 23, selected: false },
      { day: 24, selected: false },
      { day: 25, selected: false },
      { day: 26, selected: false },
      { day: 27, selected: false },
      { day: 28, selected: false },
      { day: 29, selected: false },
      { day: 30, selected: false },
      { day: 31, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
      { day: 0, selected: false },
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
      fechas,
      monthNames,
      years: [0],
      monthSelected: {} as any,
      yearSelected: 0,
      daySelected: 0,
      buttonNextDate: true,
      buttonPreviousDate: true,
      currentDay: 0,
      currentMonth: {} as any,
      currentYear: 0,
    };
  },
  methods: {
    today() {
      this.setCurrentDay();
      this.setCurrentMonth();
      this.setCurrentYear();
      this.generateYears();
      this.daySelected = this.currentDay;
      this.monthSelected = this.currentMonth;
      this.yearSelected = this.currentYear;
      this.createMonth();
    },
    createMonth() {
      const today =
        this.currentYear +
        "/" +
        this.currentMonth.position +
        "/" +
        this.currentDay;

      let day = this.daySelected;
      const month = this.monthSelected.position;
      const year = this.yearSelected;
      const days = ["do", "lu", "ma", "mi", "ju", "vi", "sa"];
      if (day >= 0 && day <= 9) {
        day = parseInt("0" + day);
      }
      const date = year + "/" + month + "/" + day;
      const dayName = days[new Date(date).getDay()];
      const daysMonth = this.daysInMonth(month, year);

      const dates = [];
      let dayNumber = 0;
      if (dayName == "lu") {
        dayNumber = 1;
      }
      if (dayName == "ma") {
        dayNumber = 2;
      }
      if (dayName == "mi") {
        dayNumber = 3;
      }
      if (dayName == "ju") {
        dayNumber = 4;
      }
      if (dayName == "vi") {
        dayNumber = 5;
      }
      if (dayName == "sa") {
        dayNumber = 6;
      }
      if (dayName == "do") {
        dayNumber = 7;
      }
      for (let i = 0; i < dayNumber; i++) {
        dates.push({ day: 0, selected: false });
      }

      if (today != date) {
        for (let i = 1; i <= daysMonth; i++) {
          dates.push({ day: i, selected: false });
        }
      } else {
        for (let i = 1; i <= daysMonth; i++) {
          if (i != this.daySelected) {
            dates.push({ day: i, selected: false });
          } else {
            dates.push({ day: i, selected: true });
          }
        }
      }

      for (let i = dates.length; i < 42; i++) {
        dates.push({ day: 0, selected: false });
      }
      this.fechas = dates;
    },
    daysInMonth(month: number, year: number) {
      return new Date(year, month, 0).getDate();
    },
    setCurrentMonth() {
      const d = new Date();
      const month = this.monthNames[d.getMonth()];
      this.currentMonth = month;
    },
    setCurrentYear() {
      const d = new Date();
      const year = d.getFullYear();
      this.currentYear = year;
    },
    setCurrentDay() {
      const d = new Date();
      const day = d.getUTCDate();
      this.fechas.forEach((element) => {
        if (element.day == day) {
          element.selected = true;
          this.currentDay = element.day;
        }
      });
    },
    generateYears() {
      const max = this.yearSelected + 11;
      const years = [];
      for (let i = 2000; i < max; i++) {
        years.push(i);
      }
      this.years = years;
    },
    previousDate() {
      const monthPosition = this.monthSelected.position - 1;
      if (monthPosition > 1) {
        this.monthSelected = this.monthNames[monthPosition - 1];
      } else {
        const yearMin = 2000;
        if (this.yearSelected == yearMin && monthPosition == 1) {
          this.buttonPreviousDate = false;
        }
        if (monthPosition == 1) {
          this.monthSelected = this.monthNames[monthPosition - 1];
        } else {
          this.monthSelected = this.monthNames[11];
          this.yearSelected -= 1;
        }
      }
      this.createMonth();
    },
    nextDate() {
      const monthPosition = this.monthSelected.position + 1;
      if (monthPosition < 12) {
        this.monthSelected = this.monthNames[this.monthSelected.position];
      } else {
        const d = new Date();
        const yearMax = d.getFullYear() + 10;
        if (this.yearSelected == yearMax && monthPosition == 12) {
          this.buttonNextDate = false;
        }
        if (monthPosition == 12) {
          this.monthSelected = this.monthNames[this.monthSelected.position];
        } else {
          this.monthSelected = this.monthNames[0];
          this.yearSelected += 1;
        }
      }
      this.createMonth();
    },
    selectDay() {
      this.$router.push("/eventos");
    },
  },
});
</script>

<style scoped>
.center {
  display: flex;
  justify-content: center;
}
/* .days > td > ion-button {
  color: black;
} */
.buttonDaySelected {
  box-shadow: rgb(38, 57, 77) 0px 20px 30px -10px;
  --background: #357af2;
  color: white;
}
</style>
