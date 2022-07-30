<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios">
      <ion-toolbar class="color-menu">
        <ion-item lines="none" v-if="logged == true" class="transparent">
          <ion-avatar slot="start">
            <img :src="userData.img" />
          </ion-avatar>
          <ion-label class="text-menu-color">{{ userData.user }}</ion-label>
          <ion-button slot="end" fill="clear">
            <ion-icon :icon="settingsOutline"></ion-icon>
          </ion-button>
        </ion-item>

        <ion-item v-if="logged == false" class="transparent" lines="none">
          <ion-button fill="clear" @click="openRoute('/login')"
            >Iniciar sesion</ion-button
          >
          <ion-button fill="clear" @click="openRoute('/signup')"
            >Registrarse</ion-button
          >
        </ion-item>
      </ion-toolbar>
    </ion-header>

    <ion-content class="color-menu">
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="homeOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Inicio</ion-label>
      </ion-item>
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="cloudDownloadOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Modulos</ion-label>
      </ion-item>
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="documentOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Notas</ion-label>
      </ion-item>
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="checkboxOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Tareas</ion-label>
      </ion-item>
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="cogOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Programacion</ion-label>
      </ion-item>
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="briefcaseOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Proyectos</ion-label>
      </ion-item>
      <ion-item
        lines="none"
        button
        v-on:click="openRoute('/')"
        class="color-menu"
      >
        <ion-icon
          class="icon-menu-color"
          slot="start"
          :icon="helpOutline"
        ></ion-icon>
        <ion-label class="text-menu-color">Soporte</ion-label>
      </ion-item>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <ion-item lines="none" class="transparent">
          <ion-button
            slot="end"
            fill="clear"
            @click="openModalDesktop()"
            v-if="!androidPlatform && !iosPlatform"
          >
            <ion-icon :icon="brushOutline"></ion-icon>
          </ion-button>
          <ion-button
            slot="end"
            fill="clear"
            @click="openModalMobile()"
            v-if="androidPlatform || iosPlatform"
          >
            <ion-icon :icon="brushOutline"></ion-icon>
          </ion-button>
          <ion-button
            fill="clear"
            slot="end"
            @click="logout()"
            v-if="logged == true"
          >
            <ion-icon :icon="exitOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  menuController,
  isPlatform,
  modalController,
  IonFooter,
  alertController,
} from "@ionic/vue";
import { brushOutline, exitOutline } from "ionicons/icons";
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
import { getUser as getUserService } from "../../services/user";
// import eventBus from "../../EventBus";
import { Storage } from "@ionic/storage";
const store = new Storage();
store.create();
import DarkMode from "./darkmode/DarkMode.vue";
// import sesionService from "../../services/sesion";
// import systemService from "../../services/system";
import { USER_MENU } from "../../services/graphql";

export default defineComponent({
  name: "MenuComponent",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonFooter,
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
      brushOutline,
      androidPlatform: isPlatform("android"),
      iosPlatform: isPlatform("ios"),
      exitOutline,
    };
  },

  data() {
    return {
      logged: false,
      userData: {
        img: require("../../../public/assets/otros/user.png"),
        user: "Usuario",
      },
    };
  },

  mounted() {
    this.getUser();
    // eventBus().emitter.on("content-refresh", () => {
    //   this.getUser();
    //   eventBus().emitter.all.clear();
    // });
  },

  methods: {
    openRoute(route: string) {
      this.menuController.close();
      this.$router.push(route);
    },

    async getUser() {
      try {
        const { user } = await getUserService({
          graphql: { name: USER_MENU, fragment: "UserMenu" },
        });
        this.logged = true;
        this.userData.user = user;
      } catch (e: any) {
        if (e.message == "Unauthorized") return;
        // openToastErrror(e);
        console.error(e);
      }
    },

    async openModalDesktop() {
      const modal = await modalController.create({
        component: DarkMode,
        cssClass: "my-custom-class",
        componentProps: {
          title: "New Title",
        },
      });
      return modal.present();
    },
    async openModalMobile() {
      const modal = await modalController.create({
        component: DarkMode,
        initialBreakpoint: 0.5,
        breakpoints: [0, 0.5, 1],
      });
      return modal.present();
    },
    async logout() {
      // const alert = await alertController.create({
      //   cssClass: "my-custom-class",
      //   header: "Cerrar sesion",
      //   message: "¿Continuar?",
      //   buttons: [
      //     {
      //       text: "Si",
      //       id: "confirm-button",
      //       handler: () => {
      //         sesionService()
      //           .logout()
      //           .then((response) => {
      //             systemService().openToast("Hasta pronto", "success");
      //           })
      //           .catch((e) => {
      //             systemService().openToast("Ocurrio un error", "danger");
      //           });
      //       },
      //     },
      //     {
      //       text: "No",
      //       role: "cancel",
      //       handler: (blah) => {
      //         console.log("Confirm Cancel:", blah);
      //       },
      //     },
      //   ],
      // });
      // return alert.present();
    },
  },
});
</script>

<style scoped>
.color-menu,
ion-toolbar {
  --background: #252729;
}
.text-menu-color {
  color: white;
}
.icon-menu-color {
  color: white;
}
ion-title[size="large"] {
  font-size: 34px;
}

ion-app.md .header-collapse-condense {
  display: block;
}
</style>
