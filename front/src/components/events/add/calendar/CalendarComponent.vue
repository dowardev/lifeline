<template>
  <!-- calendar -->
  <section class="calendar-section">
    <div class="calendar-header">
      <ion-button fill="clear" @click="previousDay()">
        <ion-icon :icon="chevronBackOutline"></ion-icon>
      </ion-button>

      <ion-button id="popoverDateSelector" fill="clear">{{
        format(new Date(currentDate), "P")
      }}</ion-button>

      <ion-button fill="clear" @click="nextDay()">
        <ion-icon :icon="chevronForwardOutline"></ion-icon>
      </ion-button>
    </div>

    <div class="calendar-body">
      <!-- <table class="schedule-table"> -->
      <!--   <thead> -->
      <!--     <tr> -->
      <!--       <th class="hour-column">Hora</th> -->
      <!--       <th class="event-column">Eventos</th> -->
      <!--     </tr> -->
      <!--   </thead> -->
      <!---->
      <!--   <tbody> -->
      <!--     <tr v-for="hour in hours" :key="hour"> -->
      <!--       <td class="hour-cell">{{ hour }}</td> -->
      <!--       <td class="event-cell"> -->
      <!--         <div -->
      <!--           v-for="event in filteredEvents({ hour: parseInt(hour) })" -->
      <!--           :key="event.id" -->
      <!--           class="event-item" -->
      <!--         > -->
      <!--           <ion-card class="card-event"> -->
      <!--             <ion-card-header> -->
      <!--               <ion-card-title>{{ event.title }}</ion-card-title> -->
      <!--             </ion-card-header> -->
      <!--             <ion-card-content> -->
      <!--               {{ format(new Date(event.date), "Pp") }} -->
      <!--             </ion-card-content> -->
      <!--           </ion-card> -->
      <!--         </div> -->
      <!--       </td> -->
      <!--     </tr> -->
      <!--   </tbody> -->
      <!-- </table> -->
    </div>
  </section>

  <!-- popovers -->
  <!-- popover reminders -->
  <ion-popover
    style="--width: 22rem"
    trigger="popoverDateSelector"
    trigger-action="click"
  >
    <ion-datetime
      ref="miniCalendar"
      presentation="date"
      @ion-change="
        currentDate = format(new Date($event.target.value as any), 'P') as any
      "
    >
      <ion-buttons slot="buttons">
        <ion-button color="danger" @click="(miniCalendar as any).$el.reset()"
          >Reiniciar</ion-button
        >
      </ion-buttons>
    </ion-datetime>
  </ion-popover>
</template>

<script setup lang="ts">
import { IonDatetime, IonPopover } from "@ionic/vue";
import { computed, ref } from "vue";
import { add, format, subDays } from "date-fns";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { Event, ScheduleElement } from "@/utils/interfaces";
import { useSchedule } from "@/composables/useSchedule";

const props = defineProps({
  events: { type: Array as () => Event[], default: () => [] },
});

const currentDate = ref(new Date());
const hours = Array.from(
  { length: 24 },
  (_, i) => `${i.toString().padStart(2, "0")}:00`
);
const miniCalendar = ref(null);

// computed
// const generateSchedule = computed(() => {
//   const schedule = useSchedule().getSchedule();
//   if (!schedule) return [];
//
//   const year = currentDate.value.getFullYear();
//   const month = currentDate.value.getMonth();
//   const day = currentDate.value.getDate();
//
//   const events = schedule[year]?.[month]?.[day];
//   if (!events) return [];
//   return events;
// });

// functions
const nextDay = () => {
  const date = currentDate;
  currentDate.value = add(new Date(date.value), {
    days: 1,
  });
};

const previousDay = () => {
  const date = currentDate;
  currentDate.value = subDays(new Date(date.value), 1);
};

// function filteredEvents(params: { hour: number }) {
//   return generateSchedule.value.filter((event) => {
//     const eventHour = new Date(event.date).getHours();
//     if (eventHour === params.hour) {
//       return true;
//     }
//     return false;
//   });
// }
</script>

<style scoped>
.calendar-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-header {
  display: flex;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 3;
}

.calendar-body {
  flex: 1;
  overflow: auto;
}

.schedule-table {
  border-collapse: collapse;
  width: 100%;
}

.schedule-table td,
.schedule-table th {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
}

.schedule-table th {
  font-weight: bold;
  position: sticky;
  top: 0px;
  background-color: var(--ion-background-color);
  z-index: 2;
}

.schedule-table .hour-column {
  width: 10%;
  background-color: var(--ion-background-color);
}

.schedule-table .event-column {
  width: 90%;
  background-color: var(--ion-background-color);
}

.schedule-table .hour-cell {
  background-color: var(--ion-background-color);
}

.schedule-table .event-cell {
  position: relative;
  min-height: 50px;
}

.schedule-table .event-item {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.card-event {
  border-style: solid;
  border-width: 1px;
  border-color: #ffb4b4;
}
</style>
