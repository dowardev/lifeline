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
      <ion-refresher slot="fixed" @ionRefresh="refreshContent($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-row style="padding-left: 10px">
        <ion-col size="12">
          <ion-button style="--background: #e6dbff; color: black">
            Citas
          </ion-button>
          <ion-button style="--background: #c9eaf3; color: black">
            Tareas
          </ion-button>

          <ion-button style="--background: #ffe6d0; color: black">
            Personal
          </ion-button>
          <ion-button style="--background: #eaffef; color: black">
            Sin recordatorio
          </ion-button>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col
          v-for="event in events"
          :key="event"
          size="12"
          size-md="6"
          size-lg="4"
        >
          <ion-card style="--background: #e6dbff" v-on:click="openEvent()">
            <ion-card-header>
              <ion-card-title>{{ event.title }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>
                <small> {{ event.time_start }} - {{ event.time_end }} </small>
              </p>
              <p>
                <small> {{ event.repeats.frecuency }} </small>
              </p>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

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
      </ion-row> -->
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
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, addOutline } from "ionicons/icons";
import { useRoute } from "vue-router";
import events from "../../../services/event.vue";

export default defineComponent({
  name: "Eventos",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
  },
  setup() {
    const route = useRoute();
    const date = route.params.date as string;
    const titulo = date.replaceAll("-", "/");
    return { chevronBackOutline, addOutline, titulo, IonRefresher };
  },
  data() {
    return { events: [] as Array<any> };
  },
  mounted() {
    this.getEvents();
  },
  methods: {
    openEvent() {
      this.$router.push({ name: "Evento", params: { id: 0 } });
    },
    createEvent() {
      this.$router.push({ name: "CreateEvent" });
    },
    async getEvents() {
      const eventsResponse = await events()
        .getEvents()
        .then((response: any) => {
          return response;
        });
      console.log(eventsResponse.data);
      this.events = eventsResponse.data;
    },
    refreshContent(event: any) {
      setTimeout(async () => {
        this.getEvents();
      }, 2000);
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
</style>

function await(arg0: any) { throw new Error("Function not implemented."); }
function await(arg0: any) { throw new Error("Function not implemented."); }
