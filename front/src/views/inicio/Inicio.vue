<template>
  <ion-page>
    <ion-header class="ion-no-border" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="firstMenu" mode="md"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ $t("message.Start") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="$router.push('/event/add')">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" id="open-main-calendar">
            <ion-icon :icon="calendarOutline"></ion-icon>
          </ion-button>
          <ion-button
            fill="clear"
            id="open-main-calendar"
            @click="($refs.eventComponent as any).getEvents()"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar class="ion-no-border" :translucent="true">
        <ion-segment v-model="mainSegment">
          <ion-segment-button value="calendar">
            <ion-label>Calendario</ion-label>
          </ion-segment-button>
          <ion-segment-button value="asigned" disabled>
            <ion-label>Asignado</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <section>
        <ion-popover trigger="open-main-calendar" :show-backdrop="false">
          <ion-datetime
            presentation="date"
            @ionChange="selectDay($event)"
            ref="mainCalendar"
            v-model="date"
          >
          </ion-datetime>
          <ion-item>
            <ion-button @click="resetCalendar()" slot="end" fill="clear"
              >Reset</ion-button
            >
          </ion-item>
        </ion-popover>
      </section>

      <section>
        <Eventos
          v-if="mainSegment == 'calendar'"
          ref="eventComponent"
        ></Eventos>
      </section>

      <section v-if="mainSegment == 'asigned'">
        <ion-row>
          <ion-col size="12"> </ion-col>
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
  IonButton,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonDatetime,
  IonPopover,
} from "@ionic/vue";
import { defineComponent, ref } from "vue";
import {
  calendarOutline,
  documentTextOutline,
  addOutline,
  refreshOutline,
} from "ionicons/icons";
import Eventos from "../eventos/Eventos.vue";
import eventBus from "../../EventBus";
import { formatISO } from "date-fns";

export default defineComponent({
  name: "InicioPage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonTitle,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonButton,
    Eventos,
    IonButtons,
    IonDatetime,
    IonPopover,
  },
  setup() {
    const customDatetime = ref();
    const reset = () => {
      if (customDatetime.value === undefined) return;

      customDatetime.value.$el.reset();
    };
    return { calendarOutline, documentTextOutline, addOutline, refreshOutline };
  },
  data() {
    const date = formatISO(new Date());
    return { mainSegment: "calendar", date };
  },
  methods: {
    async resetCalendar() {
      (
        this.$refs.mainCalendar as InstanceType<typeof HTMLFormElement>
      ).$el.reset();
    },
    selectDay(e: any) {
      const date = e.detail.value;
      this.date = date;
      eventBus().emitter.emit("select-day", { date });
    },
  },
});
</script>
