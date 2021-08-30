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
          <ion-button>
            <ion-icon slot="start" :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-row style="padding-left:10px">
        <ion-col size="12">
          <ion-button style="--background:#E6DBFF;color:black">
            Citas
          </ion-button>
          <ion-button style="--background:#C9EAF3;color:black">
            Tareas
          </ion-button>

          <ion-button style="--background:#FFE6D0;color:black">
            Personal
          </ion-button>
          <ion-button style="--background:#EAFFEF;color:black">
            Sin recordatorio
          </ion-button>
        </ion-col>
      </ion-row>

      <ion-row>
        <ion-col size="12">
          <ion-card style="--background:#E6DBFF" v-on:click="openEvent()">
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
  IonButton,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { chevronBackOutline, addOutline } from "ionicons/icons";
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
    return { chevronBackOutline, addOutline, titulo: "29/8/2021" };
  },
  methods: {
    openEvent() {
      this.$router.push("evento");
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
