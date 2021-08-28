<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
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
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[0].selected,
                  }"
                  v-if="fechas[0].day != ''"
                >
                  {{ fechas[0].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[1].selected,
                  }"
                  v-if="fechas[1].day != ''"
                >
                  {{ fechas[1].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[2].selected,
                  }"
                  v-if="fechas[2].day != ''"
                >
                  {{ fechas[2].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[3].selected,
                  }"
                  v-if="fechas[3].day != ''"
                >
                  {{ fechas[3].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[4].selected,
                  }"
                  v-if="fechas[4].day != ''"
                >
                  {{ fechas[4].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[5].selected,
                  }"
                  v-if="fechas[5].day != ''"
                >
                  {{ fechas[5].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[6].selected,
                  }"
                  v-if="fechas[6].day != ''"
                >
                  {{ fechas[6].day }}
                </ion-button>
              </td>
            </tr>
            <tr>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[7].selected,
                  }"
                  v-if="fechas[7].day != ''"
                >
                  {{ fechas[7].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[8].selected,
                  }"
                  v-if="fechas[8].day != ''"
                >
                  {{ fechas[8].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[9].selected,
                  }"
                  v-if="fechas[9].day != ''"
                >
                  {{ fechas[9].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[10].selected,
                  }"
                  v-if="fechas[10].day != ''"
                >
                  {{ fechas[10].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[11].selected,
                  }"
                  v-if="fechas[11].day != ''"
                >
                  {{ fechas[11].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[12].selected,
                  }"
                  v-if="fechas[12].day != ''"
                >
                  {{ fechas[12].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[13].selected,
                  }"
                  v-if="fechas[13].day != ''"
                >
                  {{ fechas[13].day }}
                </ion-button>
              </td>
            </tr>
            <tr>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[14].selected,
                  }"
                  v-if="fechas[14].day != ''"
                >
                  {{ fechas[14].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[15].selected,
                  }"
                  v-if="fechas[15].day != ''"
                >
                  {{ fechas[15].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[16].selected,
                  }"
                  v-if="fechas[16].day != ''"
                >
                  {{ fechas[16].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[17].selected,
                  }"
                  v-if="fechas[17].day != ''"
                >
                  {{ fechas[17].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[18].selected,
                  }"
                  v-if="fechas[18].day != ''"
                >
                  {{ fechas[18].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[19].selected,
                  }"
                  v-if="fechas[19].day != ''"
                >
                  {{ fechas[19].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[20].selected,
                  }"
                  v-if="fechas[20].day != ''"
                >
                  {{ fechas[20].day }}
                </ion-button>
              </td>
            </tr>
            <tr>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[21].selected,
                  }"
                  v-if="fechas[21].day != ''"
                >
                  {{ fechas[21].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[22].selected,
                  }"
                  v-if="fechas[22].day != ''"
                >
                  {{ fechas[22].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[23].selected,
                  }"
                  v-if="fechas[23].day != ''"
                >
                  {{ fechas[23].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[24].selected,
                  }"
                  v-if="fechas[24].day != ''"
                >
                  {{ fechas[24].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[25].selected,
                  }"
                  v-if="fechas[25].day != ''"
                >
                  {{ fechas[25].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[26].selected,
                  }"
                  v-if="fechas[26].day != ''"
                >
                  {{ fechas[26].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[27].selected,
                  }"
                  v-if="fechas[27].day != ''"
                >
                  {{ fechas[27].day }}
                </ion-button>
              </td>
            </tr>
            <tr>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[28].selected,
                  }"
                  v-if="fechas[28].day != ''"
                >
                  {{ fechas[28].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[29].selected,
                  }"
                  v-if="fechas[29].day != ''"
                >
                  {{ fechas[29].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[30].selected,
                  }"
                  v-if="fechas[30].day != ''"
                >
                  {{ fechas[30].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[31].selected,
                  }"
                  v-if="fechas[31].day != ''"
                >
                  {{ fechas[31].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[32].selected,
                  }"
                  v-if="fechas[32].day != ''"
                >
                  {{ fechas[32].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[33].selected,
                  }"
                  v-if="fechas[33].day != ''"
                >
                  {{ fechas[33].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[34].selected,
                  }"
                  v-if="fechas[34].day != ''"
                >
                  {{ fechas[34].day }}
                </ion-button>
              </td>
            </tr>
            <tr>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[35].selected,
                  }"
                  v-if="fechas[35].day != ''"
                >
                  {{ fechas[35].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[36].selected,
                  }"
                  v-if="fechas[36].day != ''"
                >
                  {{ fechas[36].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[37].selected,
                  }"
                  v-if="fechas[37].day != ''"
                >
                  {{ fechas[37].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[38].selected,
                  }"
                  v-if="fechas[38].day != ''"
                >
                  {{ fechas[38].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[39].selected,
                  }"
                  v-if="fechas[39].day != ''"
                >
                  {{ fechas[39].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[40].selected,
                  }"
                  v-if="fechas[40].day != ''"
                >
                  {{ fechas[40].day }}
                </ion-button>
              </td>
              <td>
                <ion-button
                  fill="clear"
                  :class="{
                    buttonDaySelected: fechas[41].selected,
                  }"
                  v-if="fechas[41].day != ''"
                >
                  {{ fechas[41].day }}
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
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
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
  },
  setup() {
    return { chevronBackOutline, chevronForwardOutline, todayOutline };
  },
  mounted() {
    this.today();
    this.daySelected = this.currentDay;
    this.monthSelected = this.currentMonth;
    this.yearSelected = this.currentYear;
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
      this.createMonth();
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
    /*   selectDay(){

    } */
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
