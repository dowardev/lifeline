<template>
  <ion-page>
    <ion-content>
      <section class="menu">
        <div class="menu-container">
          <!-- session -->
          <section>
            <div>
              <!-- logged -->
              <ion-item
                v-if="useUser().isLogged.value == true"
                lines="none"
                class="transparent"
              >
                <ion-avatar slot="start">
                  <img :src="imageKeyPath" />
                </ion-avatar>

                <ion-label class="labelOptionMenu">{{
                  useUser().user.value.user
                }}</ion-label>

                <ion-button
                  slot="end"
                  fill="clear"
                  @click="
                    eventOpenPopoverUserOptions = $event;
                    isOpenPopoverUserOptions = true;
                  "
                >
                  <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </div>

            <div>
              <!-- no logged -->
              <ion-item
                v-if="useUser().isLogged.value == false"
                class="transparent"
                lines="none"
              >
                <ion-button fill="clear" @click="openRoute('/login')">
                  Iniciar sesión
                </ion-button>
                <ion-button fill="clear" @click="openRoute('/signup')"
                  >Registrar</ion-button
                >
              </ion-item>
            </div>
          </section>

          <ion-card>
            <!-- navigation -->
            <section class="ion-padding-top ion-padding-bottom">
              <div>
                <!-- home -->
                <ion-item
                  lines="none"
                  class="transparent"
                  button
                  @click="openRoute('/')"
                >
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
              </div>

              <div>
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
              </div>

              <!-- integrations -->
              <div>
                <ion-accordion-group>
                  <ion-accordion>
                    <ion-item slot="header">
                      <div slot="start">
                        <ion-icon
                          :icon="extensionPuzzleOutline"
                          :class="{
                            iconOptionSelected: $route.path == '/integrations',
                            iconOptionNoSelected:
                              $route.path != '/integrations',
                          }"
                        ></ion-icon>
                      </div>
                      <ion-label>Integraciones</ion-label>
                    </ion-item>

                    <div slot="content" class="ion-padding-start">
                      <ion-item lines="none" button>
                        <ion-icon
                          slot="start"
                          :icon="hourglassOutline"
                        ></ion-icon>
                        <ion-label>Wakatime</ion-label>
                      </ion-item>
                    </div>

                    <div slot="content" class="ion-padding-start">
                      <ion-item
                        lines="full"
                        button
                        @click="openRoute('/integrations')"
                      >
                        <ion-icon slot="start" :icon="addOutline"></ion-icon>
                        <ion-label>Agregar</ion-label>
                      </ion-item>
                    </div>
                  </ion-accordion>
                </ion-accordion-group>
              </div>

              <div>
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

                  <ion-label class="labelOptionMenu"> Tareas </ion-label>
                </ion-item>
              </div>

              <div>
                <!-- tareas -->
                <ion-item
                  lines="none"
                  class="transparent"
                  button
                  @click="openRoute('/policies')"
                >
                  <div slot="start">
                    <ion-icon
                      :icon="documentTextOutline"
                      :class="{
                        iconOptionSelected: $route.path == '/policies',
                        iconOptionNoSelected: $route.path != '/policies',
                      }"
                    ></ion-icon>
                  </div>

                  <ion-label class="labelOptionMenu"> Politicas </ion-label>
                </ion-item>
              </div>
            </section>

            <!-- more options -->
            <section>
              <div>
                <ion-accordion-group>
                  <ion-accordion value="first">
                    <ion-item
                      slot="header"
                      class="accordion-more-options-background-color"
                    >
                      <ion-label>Mas opciones</ion-label>
                    </ion-item>

                    <!-- contribute -->
                    <div slot="content" class="center">
                      <!-- about -->
                      <ion-button
                        fill="clear"
                        color="primary"
                        @click="openRoute('/about')"
                      >
                        <ion-icon :icon="informationOutline"></ion-icon>
                      </ion-button>

                      <!-- support -->
                      <ion-button
                        disabled
                        fill="clear"
                        color="primary"
                        @click="openRoute('/about')"
                      >
                        <ion-icon :icon="helpOutline"></ion-icon>
                      </ion-button>

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
                    </div>
                  </ion-accordion>
                </ion-accordion-group>
              </div>
            </section>
          </ion-card>
        </div>
      </section>

      <!-- popovers -->
      <!-- <ion-popover -->
      <!--   trigger="click-trigger" -->
      <!--   trigger-action="click" -->
      <!--   :dismiss-on-select="true" -->
      <!-- > -->
      <!--   <ion-content> -->
      <!--     <ion-item button @click="changeLanguage('es')"> -->
      <!--       <ion-label>Español</ion-label> -->
      <!--     </ion-item> -->
      <!--     <ion-item button @click="changeLanguage('en')"> -->
      <!--       <ion-label>English</ion-label> -->
      <!--     </ion-item> -->
      <!--   </ion-content> -->
      <!-- </ion-popover> -->

      <ion-popover
        :is-open="isOpenPopoverUserOptions"
        :dismiss-on-select="true"
        :event="eventOpenPopoverUserOptions"
        @did-dismiss="isOpenPopoverUserOptions = false"
      >
        <ion-item lines="none" button disabled>
          <ion-icon slot="start" :icon="personOutline"></ion-icon
          ><ion-label>Panel usuario</ion-label>
        </ion-item>

        <ion-item lines="none" button @click="logout()">
          <ion-icon slot="start" :icon="logOutOutline"></ion-icon
          ><ion-label>Cerrar sesión</ion-label>
        </ion-item>
      </ion-popover>
    </ion-content>
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
  IonPopover,
} from "@ionic/vue";
import {
  addOutline,
  brushOutline,
  calendarOutline,
  documentTextOutline,
  ellipsisVerticalOutline,
  extensionPuzzleOutline,
  hourglassOutline,
  informationOutline,
  logOutOutline,
  personOutline,
} from "ionicons/icons";
import { computed, onMounted, reactive, ref } from "vue";
import { homeOutline, checkboxOutline, helpOutline } from "ionicons/icons/";
import { Storage } from "@ionic/storage";
const store = new Storage();
store.create();
import ThemeSelectorComponent from "./theme/ThemeMenuComponent.vue";
import { useSystem } from "@/composables/useSystem";
import userImage from "@/assets/otros/user.png";
import userImageGruvbox from "@/assets/otros/user-gruvbox.png";
import { useRouter } from "vue-router";
import { useUser } from "@/composables/useUser";

const router = useRouter();
const spinners = reactive({ buttonLogout: false });
const isOpenPopoverUserOptions = ref(false);
const eventOpenPopoverUserOptions = ref(CustomEvent);

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
  loadUser();
});

// functions
const openRoute = (route: string) => {
  menuController.close();
  router.push(route);
};

const loadUser = async (): Promise<void> => {
  try {
    await useUser().loadUser();
  } catch (error) {
    console.error(error);
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

async function logout(): Promise<void> {
  spinners.buttonLogout = true;
  try {
    await useUser().logout();
    spinners.buttonLogout = false;
    location.reload();
  } catch (error) {
    console.error(error);
  }
}
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

@media only screen and (min-width: 992px) {
  .menu {
    height: 85%;
    display: flex;
    align-items: center;
    padding-left: 16px;
    justify-content: center;
  }
}

.menu-container {
  width: 100%;
  max-height: 100%;
  overflow: auto;
}
</style>
