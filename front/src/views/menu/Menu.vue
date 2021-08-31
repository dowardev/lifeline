<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-item>
          <ion-avatar slot="start">
            <img src="../../../public/assets/otros/user.svg" />
          </ion-avatar>
          <ion-label>Usuario</ion-label>
          <ion-button slot="end" fill="clear">
            <ion-icon :icon="settingsOutline"></ion-icon>
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
export default defineComponent({
  name: "Menu",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
  },
  setup() {
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
    };
  },
  methods: {
    openRoute(route: string) {
      this.menuController.close();
      this.$router.push(route);
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
