<template>
  <section>
    <ion-row>
      <ion-col>
        <ion-item fill="solid">
          <ion-select
            :value="optionRepearSelected"
            :interface="isPlatform('desktop') ? 'popover' : 'alert'"
            ok-text="Confirmar"
            cancel-text="Cancelar"
            @ion-change="
              optionRepearSelected = $event.target.value;
              save();
            "
          >
            <ion-select-option
              v-for="option in repeatOptions"
              :key="option.name"
              :value="option.name"
              >{{ option.text }}</ion-select-option
            >
          </ion-select>
        </ion-item>
      </ion-col>
    </ion-row>
  </section>

  <br />

  <!-- daily -->
  <section v-if="optionRepearSelected == 'daily'">
    <ion-row>
      <ion-col>
        <div style="display: flex; justify-content: space-around">
          <div>
            <ion-input
              ref="inputDailyFrecuency"
              fill="solid"
              label="Cada"
              label-placement="fixed"
              type="number"
              :error-text="vDaily$.formDaily.frecuency.$errors[0]?.$message as string"
              :class="[
                vDaily$.formDaily.frecuency.$errors.length == 0
                  ? 'ion-valid'
                  : 'ion-invalid',
              ]"
              :value="formDaily.frecuency.value"
              @ion-input="
                formDaily.frecuency.value = parseInt(
                  $event.target.value as string
                );
                save();
              "
              @ion-focus="
                ($refs.inputDailyFrecuency as any).$el.classList.add(
                  'ion-touched'
                );
                vDaily$.formDaily.frecuency.$touch();
              "
            ></ion-input>
          </div>

          <div style="margin-left: 16px">
            <div style="display: flex; align-items: center; height: 50px">
              <ion-label v-if="formDaily.frecuency.value > 1">dias</ion-label>
              <ion-label v-else>dia</ion-label>
            </div>
          </div>
        </div>
      </ion-col>
    </ion-row>
  </section>

  <!-- weekly -->
  <section v-if="optionRepearSelected == 'weekly'">
    <ion-row>
      <ion-col>
        <div style="display: flex; justify-content: space-around">
          <div>
            <ion-input
              ref="inputWeeklyFrecuency"
              fill="solid"
              label="Cada"
              label-placement="fixed"
              type="number"
              :error-text="vWeekly$.formWeekly.frecuency.$errors[0]?.$message as string"
              :class="[
                vWeekly$.formWeekly.frecuency.$errors.length == 0
                  ? 'ion-valid'
                  : 'ion-invalid',
              ]"
              :value="formWeekly.frecuency.value"
              @ion-input="
                formWeekly.frecuency.value = parseInt(
                  $event.target.value as string
                );
                save();
              "
              @ion-focus="
                ($refs.inputWeeklyFrecuency as any).$el.classList.add(
                  'ion-touched'
                );
                vWeekly$.formWeekly.frecuency.$touch();
              "
            ></ion-input>
          </div>

          <div style="margin-left: 16px">
            <div style="display: flex; align-items: center; height: 50px">
              <ion-label v-if="formWeekly.frecuency.value > 1"
                >semanas</ion-label
              >
              <ion-label v-else>semana</ion-label>
            </div>
          </div>
        </div>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col>
        <ion-list>
          <ion-list-header>
            <ion-label>Los dias:</ion-label>
          </ion-list-header>

          <div
            class="ion-padding-start"
            @click="vWeekly$.formWeekly.days.$touch()"
          >
            <ion-button
              v-for="day in formWeekly.days.value"
              :key="day.name"
              :fill="day.selected ? 'solid' : 'outline'"
              @click="
                day.selected = !day.selected;
                save();
              "
              >{{ day.text }}</ion-button
            >
          </div>

          <!-- error -->
          <div
            style="color: var(--ion-color-danger); font-size: 12px"
            class="ion-padding-start"
          >
            {{ vWeekly$.formWeekly.days.$errors[0]?.$message }}
          </div>
        </ion-list>
      </ion-col>
    </ion-row>
  </section>

  <!-- monthly -->
  <section v-if="optionRepearSelected == 'monthly'">
    <ion-row>
      <ion-col>
        <div style="display: flex; justify-content: space-around">
          <div>
            <ion-input
              ref="inputMontlyFrecuency"
              fill="solid"
              label="Cada"
              label-placement="fixed"
              type="number"
              :error-text="vMontly$.formMontly.frecuency.$errors[0]?.$message as string"
              :class="[
                vMontly$.formMontly.frecuency.$errors.length == 0
                  ? 'ion-valid'
                  : 'ion-invalid',
              ]"
              :value="formMontly.frecuency.value"
              @ion-input="
                formMontly.frecuency.value = parseInt(
                  $event.target.value as string
                );
                save();
              "
              @ion-focus="
                ($refs.inputMontlyFrecuency as any).$el.classList.add(
                  'ion-touched'
                );
                vMontly$.formMontly.frecuency.$touch();
              "
            ></ion-input>
          </div>

          <div style="margin-left: 16px">
            <div style="display: flex; align-items: center; height: 50px">
              <ion-label v-if="formMontly.frecuency.value > 1">meses</ion-label>
              <ion-label v-else>mes</ion-label>
            </div>
          </div>
        </div>
      </ion-col>
    </ion-row>
  </section>

  <!-- annually -->
  <section v-if="optionRepearSelected == 'annually'">
    <ion-row>
      <ion-col>
        <div style="display: flex; justify-content: space-around">
          <div>
            <ion-input
              ref="inputAnnualyFrecuency"
              fill="solid"
              label="Cada"
              label-placement="fixed"
              type="number"
              :error-text="vAnnualy$.formAnnualy.frecuency.$errors[0]?.$message as string"
              :class="[
                vAnnualy$.formAnnualy.frecuency.$errors.length == 0
                  ? 'ion-valid'
                  : 'ion-invalid',
              ]"
              :value="formAnnualy.frecuency.value"
              @ion-input="
                formAnnualy.frecuency.value = parseInt(
                  $event.target.value as string
                );
                save();
              "
              @ion-focus="
                ($refs.inputAnnualyFrecuency as any).$el.classList.add(
                  'ion-touched'
                );
                vAnnualy$.formAnnualy.frecuency.$touch();
              "
            ></ion-input>
          </div>

          <div style="margin-left: 16px">
            <div style="display: flex; align-items: center; height: 50px">
              <ion-label v-if="formAnnualy.frecuency.value > 1">años</ion-label>
              <ion-label v-else>año</ion-label>
            </div>
          </div>
        </div>
      </ion-col>
    </ion-row>
  </section>
</template>

<script setup lang="ts">
import {
  IonSelect,
  IonSelectOption,
  IonInput,
  IonItem,
  IonButton,
  isPlatform,
} from "@ionic/vue";
import useVuelidate from "@vuelidate/core";
import { helpers, numeric, required } from "@vuelidate/validators";
import { onMounted, ref } from "vue";

const props = defineProps({
  data: {
    type: Object,
    default: () => {
      return {
        frecuency: 1,
        type: "daily",
        daysWeek: [],
      };
    },
  },
});

const emits = defineEmits(["updateData"]);

// inputs
const inputDailyFrecuency = ref(null);
const inputWeeklyFrecuency = ref(null);
const inputMontlyFrecuency = ref(null);
const inputAnnualyFrecuency = ref(null);

const repeatOptions = ref([
  {
    name: "daily",
    text: "Diariamente",
  },
  {
    name: "weekly",
    text: "Semanalmente",
  },
  {
    name: "monthly",
    text: "Mensualmente",
  },
  {
    name: "annually",
    text: "Anualmente",
  },
]);
const optionRepearSelected = ref("daily");

const formDaily = {
  frecuency: ref(1),
};
const formWeekly = {
  frecuency: ref(1),
  days: ref([
    { name: "monday", text: "Lunes", selected: false },
    { name: "tuesday", text: "Martes", selected: false },
    { name: "wednesday", text: "Miércoles", selected: false },
    { name: "thursday", text: "Jueves", selected: false },
    { name: "friday", text: "Viernes", selected: false },
    { name: "saturday", text: "Sábado", selected: false },
    { name: "sunday", text: "Domingo", selected: false },
  ]),
};
const formMontly = {
  frecuency: ref(1),
};
const formAnnualy = {
  frecuency: ref(1),
};

const messageError = {
  required: "Campo requerido",
  numeric: "Solamente puede contener numeros",
};
const rulesDaily = {
  formDaily: {
    frecuency: {
      required: helpers.withMessage(messageError.required, required),
      numeric: helpers.withMessage(messageError.numeric, numeric),
    },
  },
};
const rulesWeekly = {
  formWeekly: {
    frecuency: {
      required: helpers.withMessage(messageError.required, required),
      numeric: helpers.withMessage(messageError.numeric, numeric),
    },
    days: {
      required: helpers.withMessage(messageError.required, (value: any) =>
        value.some((day: any) => day.selected)
      ),
    },
  },
};
const rulesMontly = {
  formMontly: {
    frecuency: {
      required: helpers.withMessage(messageError.required, required),
      numeric: helpers.withMessage(messageError.numeric, numeric),
    },
  },
};
const rulesAnnualy = {
  formAnnualy: {
    frecuency: {
      required: helpers.withMessage(messageError.required, required),
      numeric: helpers.withMessage(messageError.numeric, numeric),
    },
  },
};
const vDaily$ = useVuelidate(rulesDaily, { formDaily });
const vWeekly$ = useVuelidate(rulesWeekly, { formWeekly });
const vMontly$ = useVuelidate(rulesMontly, { formMontly });
const vAnnualy$ = useVuelidate(rulesAnnualy, { formAnnualy });

// mounted
onMounted(() => {
  setCurrentDateWeek();
  optionRepearSelected.value = props.data.type;
  if (props.data.type == "daily")
    formDaily.frecuency.value = props.data.frecuency;

  if (props.data.type == "weekly") {
    formWeekly.frecuency.value = props.data.frecuency;
    formWeekly.days.value = formWeekly.days.value.map((element) => {
      const result = props.data.daysWeek.find((item: string) => {
        if (item == element.name) return item;
      });
      if (result) element.selected = true;
      return element;
    });
  }

  if (props.data.type == "monthly")
    formMontly.frecuency.value = props.data.frecuency;

  if (props.data.type == "annually")
    formAnnualy.frecuency.value = props.data.frecuency;
});

// functions
function save() {
  const option = optionRepearSelected.value;

  let data = { type: option } as {
    frecuency: number;
    type: "unique" | "daily" | "weekly" | "monthly" | "annually";
    daysWeek?: string[];
  };

  if (option == "daily") {
    const response = getDailyData();
    data.frecuency = response.frecuency;
  }
  if (option == "weekly") {
    const response = getWeeklyData();
    data.frecuency = response.frecuency;
    data.daysWeek = response.days;
  }
  if (option == "monthly") {
    const response = getMontlyData();
    data.frecuency = response.frecuency;
  }
  if (option == "annually") {
    const response = getAnnuallyData();
    data.frecuency = response.frecuency;
  }

  emits("updateData", data);
}

function getDailyData() {
  const frecuency = formDaily.frecuency.value;
  return { frecuency };
}

function getWeeklyData(): { frecuency: number; days: string[] } {
  const frecuency = formWeekly.frecuency.value;
  const daysSelected = formWeekly.days.value
    .filter((day) => day.selected)
    .map((day) => day.name);
  return { frecuency, days: daysSelected };
}

function getMontlyData() {
  const frecuency = formMontly.frecuency.value;
  return { frecuency };
}

function getAnnuallyData() {
  const frecuency = formAnnualy.frecuency.value;
  return { frecuency };
}

function setCurrentDateWeek() {
  const today = new Date();
  const dayNumber = today.getDay();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[dayNumber];
  formWeekly.days.value = formWeekly.days.value.map((day) => {
    if (day.name == dayName) day.selected = true;
    return day;
  });
}
</script>
