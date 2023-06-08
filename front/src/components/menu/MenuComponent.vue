<template>
  <ion-page :class="{ 'component-container': isPlatform('desktop') }">
    <ion-content>
      <ion-item v-if="logged == true" lines="none" class="transparent">
        <ion-avatar slot="start">
          <img :src="imageKeyPath" />
        </ion-avatar>
        <ion-label class="labelOptionMenu">{{ userData.user }}</ion-label>
        <ion-button slot="end" fill="clear">
          <ion-icon :icon="settingsOutline"></ion-icon>
        </ion-button>
      </ion-item>

      <ion-item v-if="logged == false" class="transparent" lines="none">
        <ion-button fill="clear" @click="openRoute('/login')">{{
          capitalizeFirstLetter($t("message.login"))
        }}</ion-button>
        <ion-button fill="clear" @click="openRoute('/signup')">{{
          capitalizeFirstLetter($t("message.signup"))
        }}</ion-button>
      </ion-item>

      <!-- home -->
      <ion-item lines="none" class="transparent" button @click="openRoute('/')">
        <div slot="start">
          <ion-icon
            :icon="homeOutline"
            :class="{
              iconOptionSelected: $route.path == '/home',
              iconOptionNoSelected: $route.path != '/home',
            }"
          ></ion-icon>
        </div>

        <ion-label class="labelOptionMenu"> Inicio </ion-label>
      </ion-item>

      <!-- calendar -->
      <ion-item
        lines="none"
        class="transparent"
        button
        @click="openRoute('/calendar')"
      >
        <div slot="start">
          <ion-icon
            :icon="calendarOutline"
            :class="{
              iconOptionSelected: $route.path == '/calendar',
              iconOptionNoSelected: $route.path != '/calendar',
            }"
          ></ion-icon>
        </div>

        <ion-label class="labelOptionMenu"> Calendario</ion-label>
      </ion-item>

      <!-- integrations -->
      <ion-accordion-group>
        <ion-accordion>
          <ion-item slot="header">
            <div slot="start">
              <ion-icon
                :icon="extensionPuzzleOutline"
                :class="{
                  iconOptionSelected: $route.path == '/integrations',
                  iconOptionNoSelected: $route.path != '/integrations',
                }"
              ></ion-icon>
            </div>
            <ion-label>Integraciones</ion-label>
          </ion-item>

          <div slot="content" class="ion-padding-start">
            <ion-item lines="none" button>
              <ion-icon slot="start" :icon="hourglassOutline"></ion-icon>
              <ion-label>Wakatime</ion-label>
            </ion-item>
          </div>

          <div slot="content" class="ion-padding-start">
            <ion-item lines="full" button @click="openRoute('/integrations')">
              <ion-icon slot="start" :icon="addOutline"></ion-icon>
              <ion-label>Agregar</ion-label>
            </ion-item>
          </div>
        </ion-accordion>
      </ion-accordion-group>

      <!-- module -->
      <ion-item
        lines="none"
        class="transparent"
        button
        disabled
        @click="openRoute('/')"
      >
        <div slot="start">
          <ion-icon :icon="cloudDownloadOutline"></ion-icon>
        </div>

        <ion-label class="labelOptionMenu">
          {{ capitalizeFirstLetter($tc("message.module", 2)) }}
        </ion-label>
      </ion-item>

      <!-- documents -->
      <ion-item
        lines="none"
        class="transparent"
        button
        @click="$router.push({ name: 'DocumentsPage' })"
      >
        <div slot="start">
          <ion-icon
            :icon="documentOutline"
            :class="{
              iconOptionSelected: $route.path == '/documents',
              iconOptionNoSelected: $route.path != '/documents',
            }"
          ></ion-icon>
        </div>

        <ion-label class="labelOptionMenu"> Documentos </ion-label>
      </ion-item>

      <!-- tareas -->
      <ion-item
        lines="none"
        class="transparent"
        button
        @click="openRoute('/tasks')"
      >
        <div slot="start">
          <ion-icon
            :icon="checkboxOutline"
            :class="{
              iconOptionSelected: $route.path == '/tasks',
              iconOptionNoSelected: $route.path != '/tasks',
            }"
          ></ion-icon>
        </div>

        <ion-label class="labelOptionMenu">
          {{ capitalizeFirstLetter($tc("message.task", 2)) }}
        </ion-label>
      </ion-item>

      <!-- programming -->
      <ion-item
        lines="none"
        class="transparent"
        button
        disabled
        @click="openRoute('/')"
      >
        <div slot="start">
          <ion-icon :icon="cogOutline"></ion-icon>
        </div>

        <ion-label class="labelOptionMenu">
          {{ capitalizeFirstLetter($t("message.programming")) }}
        </ion-label>
      </ion-item>

      <!-- projects -->
      <ion-item
        lines="none"
        class="transparent"
        button
        disabled
        @click="openRoute('/')"
      >
        <div slot="start">
          <ion-icon :icon="briefcaseOutline"></ion-icon>
        </div>

        <ion-label class="labelOptionMenu">
          {{ capitalizeFirstLetter($tc("message.projects", 2)) }}
        </ion-label>
      </ion-item>

      <!-- support -->
      <ion-item
        lines="none"
        class="transparent"
        button
        disabled
        @click="openRoute('/')"
      >
        <div slot="start">
          <ion-icon :icon="helpOutline"></ion-icon>
        </div>

        <ion-label class="labelOptionMenu">
          {{ capitalizeFirstLetter($t("message.support")) }}
        </ion-label>
      </ion-item>

      <ion-item
        lines="none"
        class="transparent"
        button
        @click="openRoute('/policies')"
      >
        <div slot="start">
          <ion-icon :icon="documentTextOutline"></ion-icon>
        </div>

        <ion-label class="labelOptionMenu"> Politicas </ion-label>
      </ion-item>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button
            v-if="isPlatform('desktop')"
            fill="clear"
            color="primary"
            @click="openModalDesktop()"
          >
            <ion-icon :icon="brushOutline"></ion-icon>
          </ion-button>

          <ion-button
            v-if="!isPlatform('desktop')"
            fill="clear"
            color="primary"
            @click="openModalMobile()"
          >
            <ion-icon :icon="brushOutline"></ion-icon>
          </ion-button>

          <!-- <ion-button id="click-trigger" color="primary"> -->
          <!--   <ion-icon :icon="languageOutline"></ion-icon> -->
          <!-- </ion-button> -->
          <ion-popover
            trigger="click-trigger"
            trigger-action="click"
            :dismiss-on-select="true"
          >
            <ion-content>
              <ion-item button @click="changeLanguage('es')">
                <ion-label>Español</ion-label>
              </ion-item>
              <ion-item button @click="changeLanguage('en')">
                <ion-label>English</ion-label>
              </ion-item>
            </ion-content>
          </ion-popover>

          <ion-button v-if="logged == true" fill="clear" color="primary">
            <ion-icon :icon="exitOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonPage,
  IonToolbar,
  menuController,
  isPlatform,
  modalController,
  IonFooter,
} from "@ionic/vue";
import {
  addOutline,
  brushOutline,
  calendarOutline,
  documentTextOutline,
  exitOutline,
  extensionPuzzleOutline,
  hourglass,
  hourglassOutline,
} from "ionicons/icons";
import { computed, onMounted, ref } from "vue";
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
import ThemeSelectorComponent from "./theme/ThemeMenuComponent.vue";
// import sesionService from "../../services/sesion";
// import systemService from "../../services/system";
import { USER_MENU } from "../../services/graphql";
import userAvatar from "../../assets/otros/user.png";
import { capitalizeFirstLetter } from "../../services/system";
import { setLanguage } from "../../services/system";
import { useSystem } from "@/composables/useSystem";
import userImage from "@/assets/otros/user.png";
import userImageGruvbox from "@/assets/otros/user-gruvbox.png";
import { useRouter } from "vue-router";

const router = useRouter();

const logged = ref(false);
const userData = {
  img: userAvatar,
  user: "Usuario",
};

// computed
const imageKeyPath = computed(() => {
  const theme = useSystem().getTheme();
  let image = "";
  if (theme == "nord" || "light") image = userImage;
  if (theme == "gruvbox") image = userImageGruvbox;
  return image;
});

// mounted
onMounted(() => {
  getUser();
});

// functions
const openRoute = (route: string) => {
  menuController.close();
  router.push(route);
};

const getUser = async () => {
  try {
    const { user } = await getUserService({
      graphql: { name: USER_MENU, fragment: "UserMenu" },
    });
    logged.value = true;
    userData.user = user;
  } catch (e: any) {
    if (e.message == "Unauthorized") return;
    // openToastErrror(e);
    console.error(e);
  }
};

const openModalDesktop = async () => {
  const modal = await modalController.create({
    component: ThemeSelectorComponent,
    cssClass: "my-custom-class",
    componentProps: {
      title: "New Title",
    },
  });
  return modal.present();
};

const openModalMobile = async () => {
  const modal = await modalController.create({
    component: ThemeSelectorComponent,
    initialBreakpoint: 0.5,
    breakpoints: [0, 0.5, 1],
  });
  return modal.present();
};

const changeLanguage = (language: string) => {
  // $i18n.locale = language;
  setLanguage(language);
};
</script>

<style scoped>
/* .color-menu, */
/* ion-toolbar { */
/*   --background: #252729; */
/* } */
/* .text-menu-color { */
/*   color: white; */
/* } */
/* .icon-menu-color { */
/*   color: white; */
/* } */
/* ion-title[size="large"] { */
/*   font-size: 34px; */
/* } */
/**/
/* ion-app.md .header-collapse-condense { */
/*   display: block; */
/* } */

.labelOptionMenu {
  color: var(--ion-color-primary);
}

.iconOptionSelected {
  background: var(--ion-color-primary);
  border-radius: 6px;
  padding: 8px;
  color: white;
}

.iconOptionNoSelected {
  padding: 8px;
}
</style>
