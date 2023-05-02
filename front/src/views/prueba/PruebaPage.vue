<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>Día</th>
          <th>Número</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(day, index) in days" :key="index">
          <td>{{ day.name }} {{ day.number }}</td>
        </tr>
      </tbody>
    </table>
    <p>Hoy es {{ currentDay }}</p>
    <div>
      <button @click="previousWeek">Anterior</button>
      <button @click="nextWeek">Siguiente</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { startOfWeek, addDays, format } from "date-fns";

interface Day {
  name: string;
  number: number;
}

const currentDate = new Date();
const currentDayName = format(currentDate, "EEEE");
const currentDayNumber = currentDate.getDate();

const days = ref(getDaysForCurrentWeek());
const currentDay = `${currentDayName} ${currentDayNumber}`;

function getDaysForCurrentWeek(): Day[] {
  const firstDayOfWeek = startOfWeek(currentDate);
  const daysOfWeek: Day[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(firstDayOfWeek, i);
    const name = format(day, "EEEE");
    const number = day.getDate();
    daysOfWeek.push({ name, number });
  }

  return daysOfWeek;
}

function previousWeek() {
  if (currentDate.getMonth() === 0 && currentDate.getDate() <= 7) {
    return;
  }
  currentDate.setDate(currentDate.getDate() - 7);
  days.value = getDaysForCurrentWeek();
}

function nextWeek() {
  currentDate.setDate(currentDate.getDate() + 7);
  days.value = getDaysForCurrentWeek();
}
</script>
