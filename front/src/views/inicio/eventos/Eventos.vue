<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon slot="start" :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="createEvent()">
            <ion-icon slot="start" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- <ion-refresher slot="fixed" @ionRefresh="refreshContent($event)"> -->
      <!--   <ion-refresher-content></ion-refresher-content> -->
      <!-- </ion-refresher> -->

      <!-- <ion-row> -->
      <!--   <ion-col size="12"> -->
      <!--     <ion-item button="true" id="open-date-input"> -->
      <!--       <ion-label>Date</ion-label> -->
      <!-- <ion-text slot="end">{{ date1 }}</ion-text> -->
      <!--       <ion-popover trigger="open-date-input" :show-backdrop="false"> -->
      <!--         <ion-datetime -->
      <!--           presentation="date" -->
      <!--           @ionChange="(ev: DatetimeCustomEvent) => date1 = formatDate(ev.detail.value)" -->
      <!--         /> -->
      <!--       </ion-popover> -->
      <!--     </ion-item> -->

      <!-- Datetime in popover with input -->
      <!-- <ion-item> -->
      <!-- <ion-input :value="date2" /> -->
      <!-- <ion-button fill="clear" id="open-date-input-2"> -->
      <!--   <ion-icon icon="calendar" /> -->
      <!-- </ion-button> -->
      <!-- <ion-popover trigger="open-date-input-2" :show-backdrop="false"> -->
      <!--   <ion-datetime -->
      <!--     presentation="date" -->
      <!-- @ionChange="(ev: DatetimeCustomEvent) => date2 = formatDate(ev.detail.value)" -->
      />
      <!--   </ion-popover> -->
      <!-- </ion-item> -->

      <!--     <ion-item> -->
      <!--       <ion-label>Tipo de contenido</ion-label> -->
      <!--       <ion-select -->
      <!--         multiple="true" -->
      <!--         cancel-text="Cancelar" -->
      <!--         ok-text="Confirmar!" -->
      <!--         @ionChange="prueba($event)" -->
      <!--       > -->
      <!--         <ion-select-option value="all">Todo</ion-select-option> -->
      <!--         <ion-select-option value="events">Eventos</ion-select-option> -->
      <!--         <ion-select-option value="notes">Notas</ion-select-option> -->
      <!--         <ion-select-option value="tasks">Tareas</ion-select-option> -->
      <!--       </ion-select> -->
      <!--     </ion-item> -->
      <!--   </ion-col> -->
      <!-- </ion-row> -->

      <!-- <ion-row> -->
      <!--   <ion-col v-for="event in events" :key="event" size="12"> -->
      <!--     <ion-row> -->
      <!--       <ion-col size="12" size-md="4" size-lg="6"> -->
      <!--         <ion-card -->
      <!--           :class="{ cardEvent: event.type == 'event' }" -->
      <!--           v-on:click="openEvent(event.id)" -->
      <!--         > -->
      <!--           <ion-card-header> -->
      <!--             <ion-card-title> -->
      <!--               {{ event.title }} -->
      <!--               <ion-icon -->
      <!--                 v-if="event.reminders.length > 0" -->
      <!--                 style="float: right" -->
      <!--                 :icon="notificationsOutline" -->
      <!--               ></ion-icon> -->
      <!--             </ion-card-title> -->
      <!--           </ion-card-header> -->
      <!--           <ion-card-content> -->
      <!--             <p> -->
      <!--               <small> -->
      <!--                 {{ event.timeStart.dateFormatted }} - -->
      <!--                 {{ event.timeEnd.dateFormatted }} -->
      <!--               </small> -->
      <!--             </p> -->
      <!--             <p> -->
      <!--               <small>{{ event.repeats.frecuency }}</small> -->
      <!--             </p> -->
      <!--           </ion-card-content> -->
      <!--         </ion-card> -->
      <!--       </ion-col> -->
      <!--     </ion-row> -->
      <!--   </ion-col> -->
      <!-- </ion-row> -->

      <!--  <ion-row>
        <ion-col size="12">
          <ion-card style="--background:#C9EAF3">
            <ion-card-header>
              <ion-card-title>Titulo Evento</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              9:00 a.m. - 10:00 a.m.
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12">
          <ion-card style="--background:#EAFFEF">
            <ion-card-header>
              <ion-card-title>Titulo Evento</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              9:00 a.m. - 10:00 a.m.
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12">
          <ion-card style="--background:#FFE6D0">
            <ion-card-header>
              <ion-card-title>Titulo Evento</ion-card-title>
            </ion-card-header>
            <ion-card-content> </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>-->
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
  IonButton,
  IonRefresher,
  IonSelect,
  IonPopover,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  addOutline,
  notificationsOutline,
  menuOutline,
  calendarOutline,
  documentOutline,
  checkboxOutline,
} from "ionicons/icons";
import { useRoute } from "vue-router";
import eventService from "../../../services/event.vue";
import userService from "../../../services/user.vue";
import { Storage } from "@ionic/storage";

export default defineComponent({
  name: "Eventos",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    // IonSelect,
    // IonPopover,
  },
  setup() {
    const route = useRoute();
    const date = route.params.date as string;
    const titulo = date.replaceAll("-", "/");
    return {
      chevronBackOutline,
      addOutline,
      titulo,
      IonRefresher,
      notificationsOutline,
      menuOutline,
      calendarOutline,
      documentOutline,
      checkboxOutline,
    };
  },
  data() {
    const storage = new Storage();
    storage.create();
    return {
      events: [] as Array<any>,
      storage,
    };
  },
  mounted() {
    this.getEvents();
  },
  methods: {
    openEvent(id: number) {
      this.$router.push({ name: "Evento", params: { id } });
    },
    createEvent() {
      this.$router.push({ name: "CreateEvent" });
    },
    async getEvents() {
      const events = await eventService()
        .getEvents()
        .then((response: any) => {
          return response;
        });

      events.data.forEach(async (element: any) => {
        element.timeStart = this.formatDate(element.time_start);
        element.timeEnd = this.formatDate(element.time_end);
        element.type = "event";
        element.repeats.frecuency = await userService().translate(
          element.repeats.frecuency
        );
      });

      this.events = events.data;
      this.storage.set("events", JSON.stringify(events.data));
    },
    formatDate(date: string) {
      return eventService().formatDateTime(date, "");
    },
    refreshContent(event: any) {
      setTimeout(async () => {
        this.getEvents();
      }, 2000);
    },
    prueba(e: any) {
      console.log(e.detail.value);
    },
  },
});
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
.cardEvent {
  --background: #e6dbff;
}
.optionselected {
  color: #3880ff;
}
</style>
