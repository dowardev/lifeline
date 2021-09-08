<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-item v-if="logged == true">
          <ion-avatar slot="start">
            <img :src="userData.img" />
          </ion-avatar>
          <ion-label>{{ userData.user }}</ion-label>
          <ion-button slot="end" fill="clear">
            <ion-icon :icon="settingsOutline"></ion-icon>
          </ion-button>
        </ion-item>
        <ion-item v-if="logged == false">
          <ion-button fill="clear" @click="openRoute('/sesion')">
            Iniciar sesion
          </ion-button>
          <ion-button fill="clear" @click="openRoute('/registro')">
            Registrarse
          </ion-button>
        </ion-item>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="homeOutline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-item>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="cloudDownloadOutline"></ion-icon>
          <ion-label>Modulos</ion-label>
        </ion-item>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="documentOutline"></ion-icon>
          <ion-label>Notas</ion-label>
        </ion-item>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="checkboxOutline"></ion-icon>
          <ion-label>Tareas</ion-label>
        </ion-item>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="cogOutline"></ion-icon>
          <ion-label>Programacion</ion-label>
        </ion-item>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="briefcaseOutline"></ion-icon>
          <ion-label>Proyectos</ion-label>
        </ion-item>
        <ion-item button v-on:click="openRoute('/')">
          <ion-icon slot="start" :icon="helpOutline"></ion-icon>
          <ion-label>Soporte</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  menuController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  settingsOutline,
  homeOutline,
  documentOutline,
  checkboxOutline,
  briefcaseOutline,
  helpOutline,
  cogOutline,
  cloudDownloadOutline,
} from "ionicons/icons/";
import user from "../../services/user.vue";
import eventBus from "../../EventBus";

export default defineComponent({
  name: "Menu",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
  },
  setup() {
    const { getUserLogged } = user();
    return {
      settingsOutline,
      homeOutline,
      documentOutline,
      checkboxOutline,
      briefcaseOutline,
      helpOutline,
      menuController,
      cogOutline,
      cloudDownloadOutline,
      getUserLogged,
    };
  },
  data() {
    return {
      logged: false,
      userData: {
        img: require("../../../public/assets/otros/user.svg"),
        user: "Usuario",
      },
    };
  },
  mounted() {
    this.getUser();
    eventBus().emitter.on("content-refresh", () => {
      this.getUser();
      eventBus().emitter.all.clear();
    });
  },
  methods: {
    openRoute(route: string) {
      this.menuController.close();
      this.$router.push(route);
    },
    getUser() {
      this.getUserLogged().then((response) => {
        this.logged = true;
        this.userData.user = response.data.user;
      });
    },
  },
});
</script>
