<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="mainMenu" mode="md"></ion-menu-button>
        </ion-buttons>

        <!-- <ion-title>{{ pageTitle }}</ion-title> -->
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- header -->
      <section>
        <ion-row class="ion-padding size-section center center-vertical">
          <ion-col size-xs="12" size-md="6" size-lg="6" size-xl="4"
            ><div class="center">
              <img class="logo" :src="LifeLineLogo" alt="" /></div
          ></ion-col>

          <ion-col
            size-xs="12"
            size-md="6"
            size-lg="6"
            size-xl="4"
            class="center"
            ><h1 class="text-head">
              LifeLine. Gestiona tu vida en un solo lugar.
            </h1></ion-col
          >
        </ion-row>
      </section>

      <!-- <div style="background-color: white"> -->
      <!--   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"> -->
      <!--     <path -->
      <!--       fill="#0099ff" -->
      <!--       fill-opacity="1" -->
      <!--       d="M0,64L40,85.3C80,107,160,149,240,176C320,203,400,213,480,186.7C560,160,640,96,720,64C800,32,880,32,960,42.7C1040,53,1120,75,1200,96C1280,117,1360,139,1400,149.3L1440,160L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z" -->
      <!--     ></path> -->
      <!--   </svg> -->
      <!-- </div> -->

      <!-- characteristics -->
      <section id="characteristics" ref="characteristicsSection">
        <ion-row class="size-section">
          <ion-col size="12">
            <ion-row class="center">
              <ion-col
                ><h2 class="center section-title">Características</h2></ion-col
              >
            </ion-row>

            <!-- characteristics -->
            <ion-row>
              <ion-col
                v-for="characteristic in characteristics"
                :key="characteristic"
                class="center"
                size-xs="12"
                size-md="6"
                size-lg="6"
                size-xl="4"
                ><ion-card>
                  <ion-card-header>
                    <ion-item lines="none"
                      ><ion-icon
                        slot="start"
                        :icon="characteristic.icon"
                      ></ion-icon>
                      <ion-card-title class="ion-text-wrap">{{
                        characteristic.name
                      }}</ion-card-title></ion-item
                    >
                  </ion-card-header>

                  <ion-card-content>
                    <ion-text>{{ characteristic.description }}</ion-text>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row></ion-col
          >
        </ion-row>
      </section>

      <!-- available -->
      <section id="available" ref="availableSection">
        <ion-row class="ion-padding size-section">
          <ion-col size="12">
            <ion-row class="center">
              <ion-col size-xs="12" size-md="6" size-lg="4"
                ><h2 class="center section-title">Aplicaciones</h2></ion-col
              >
            </ion-row>

            <ion-row>
              <ion-col
                v-for="app in availableDownload"
                :key="app"
                size-xs="12"
                size-md="6"
                size-xl="4"
              >
                <h3 class="center">{{ app.so }}</h3>
                <ion-row>
                  <ion-col v-for="available in app.available" :key="available">
                    <ion-card>
                      <ion-card-header
                        ><img
                          :style="{ width: available.image.width }"
                          :src="available.image.src"
                          alt=""
                      /></ion-card-header>

                      <ion-card-content>
                        <ion-item
                          v-if="available.state.stable?.url"
                          lines="none"
                        >
                          <ion-button
                            slot="end"
                            color="success"
                            @click="
                              openUrl({ url: available.state.stable.url })
                            "
                            >Instalar versión estable</ion-button
                          >
                        </ion-item>

                        <ion-item
                          v-if="available.state.experiment?.url"
                          lines="none"
                        >
                          <ion-button
                            slot="end"
                            fill="clear"
                            color="danger"
                            @click="
                              openUrl({ url: available.state.experiment.url })
                            "
                            >Instalar versión experimental</ion-button
                          >
                        </ion-item>

                        <ion-item
                          v-if="
                            !available.state.stable?.url &&
                            !available.state.experiment?.url
                          "
                          lines="none"
                        >
                          <ion-label slot="end">Próximamente</ion-label>
                        </ion-item>

                        <ion-item lines="none">
                          <ion-button
                            slot="end"
                            fill="clear"
                            @click="
                              popoverHelpApp.event = $event;
                              popoverHelpApp.info = {
                                url: available.help.url ?? '',
                                text: available.help.description,
                              };
                              popoverHelpApp.isOpen = true;
                            "
                          >
                            <ion-icon :icon="helpCircleOutline"></ion-icon>
                          </ion-button>
                        </ion-item>
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-col> </ion-row
          ></ion-col>
        </ion-row>
      </section>

      <!-- message -->
      <section class="size-section">
        <ion-row
          class="ion-padding center center-vertical"
          style="min-height: 85vh"
        >
          <ion-col size-xs="12" size-md="6" size-lg="6" size-xl="4">
            <p style="text-align: center">
              Estamos desarrollado LifeLine con mucho esfuerzo y cariño para
              ayudarte a mantener una vida mas productiva sin mucho esfuerzo.
            </p>
          </ion-col>
        </ion-row>

        <ion-row class="center">
          <ion-col size-md="4" size-lg="4">
            <div class="center">Producto de la marca</div>
            <div class="center">
              <img
                :src="DowarDevLogo"
                alt=""
                style="cursor: pointer"
                class="logo-dowar"
                @click="openUrl({ url: 'https://dowar.xyz' })"
              />
            </div>
          </ion-col>
        </ion-row>
      </section>

      <!-- popovers -->
      <ion-popover
        :is-open="popoverHelpApp.isOpen"
        :event="popoverHelpApp.event"
        :dismiss-on-select="true"
        @did-dismiss="popoverHelpApp.isOpen = false"
      >
        <ion-content class="ion-padding">
          <p>{{ popoverHelpApp.info.text }}</p>

          <ion-button
            v-if="popoverHelpApp.info.url != ''"
            @click="openUrl({ url: popoverHelpApp.info.url })"
            >Mas información</ion-button
          >
        </ion-content>
      </ion-popover>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import {
  analyticsOutline,
  appsOutline,
  calendarOutline,
  checkboxOutline,
  extensionPuzzleOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { reactive } from "vue";

// assets
import LifeLineLogo from "@/assets/lifeline_v1.webp";
import AppGalleryLogo from "../../assets/markets/appgallery-badge.png";
import PWALogo from "../../assets/markets/PWA.png";
import WWWLogo from "../../assets/markets/World-Wide-Web-Transparent.png";
import FlatHubLogo from "../../assets/markets/flathub.png";
import FdroidLogo from "../../assets/markets/fdroid.png";
import InstallerLogo from "../../assets/markets/installer.png";
import DowarDevLogo from "../../assets/dowar_dev.png";

const pageTitle = "Home";
const characteristics = [
  {
    name: "Agenda",
    icon: calendarOutline,
    description: "Agenda potente con la que podrás administrar tu día.",
  },
  {
    name: "Tareas",
    icon: checkboxOutline,
    description:
      "Gestor de tareas con múltiples herramientas para administrar todos tus pendientes.",
  },
  {
    name: "Integraciones",
    icon: extensionPuzzleOutline,
    description: "Integración con todas tus aplicaciones favoritas.",
  },
  {
    name: "Tablero",
    icon: appsOutline,
    description:
      "Un potente tablero con el podrás administrar todo lo relevante del día.",
  },
  {
    name: "Análisis",
    icon: analyticsOutline,
    description:
      "Gracias a la compatibilidad con múltiples sistemas podrás monitorear tus actividades y con ello poder tomar acciones para mejorar tu productividad.",
  },
];
const availableDownload = [
  {
    so: "Android",
    available: [
      {
        name: "App Gallery",
        image: { src: AppGalleryLogo, width: "100%" },
        state: { stable: { url: "" }, experiment: { url: "" } },
        help: {
          description:
            "HUAWEI AppGallery es la plataforma oficial de distribución de aplicaciones Android. En ella puedes buscar, descargar, gestionar y compartir tus aplicaciones favoritas.",
          url: "https://consumer.huawei.com/mx/mobileservices/appgallery/",
        },
      },
      {
        name: "F-Droid",
        image: { src: FdroidLogo, width: "100%" },
        state: { stable: { url: "" }, experiment: { url: "" } },
        help: {
          description:
            "F-Droid es un catálogo instalable de aplicaciones de software libre (FOSS, «Free and Open Source Software») para Android. El cliente facilita la navegación, la instalación y el seguimiento de las actualizaciones en tu dispositivo",
          url: "https://f-droid.org/es/",
        },
      },
    ],
  },
  {
    so: "Linux",
    available: [
      {
        name: "Flathub",
        image: { src: FlatHubLogo, width: "100%" },
        state: { stable: { url: "" }, experiment: { url: "" } },
        help: {
          description:
            "Flathub es una tienda de aplicaciones para Linux que ofrece una amplia variedad de aplicaciones y juegos para descargar e instalar en cualquier distribución de Linux.",
          url: "https://flathub.org",
        },
      },
      {
        name: "Instalador",
        image: { src: InstallerLogo, width: "100%" },
        state: { stable: { url: "" }, experiment: { url: "" } },
        help: {
          description: "Instalador clásico para tu distribución Linux",
        },
      },
    ],
  },
  // {
  //   so: "Windows",
  //   available: [
  //     {
  //       name: "Instalador",
  //       image: InstallerLogo,
  //       state: { stable: { url: "" }, experiment: { url: "" } },
  //     },
  //   ],
  // },
  {
    so: "Multiplataforma",
    available: [
      {
        name: "Web",
        image: { src: WWWLogo, width: "100%" },
        state: {
          stable: { url: "https://lifeline.dowar.xyz/signup." },
          experiment: { url: "" },
        },
        help: {
          description: "Sitio web oficial",
        },
      },
      {
        name: "Pwa",
        image: { src: PWALogo, width: "100%" },
        state: {
          stable: {
            url: "https://lifeline.dowar.xyz/signup",
          },
          experiment: { url: "" },
        },
        help: {
          description:
            "Una PWA es básicamente un sitio web que puede ser instalado como una aplicación convencional dentro de cualquier sistema operativo,",
          url: "https://web.dev/what-are-pwas/",
        },
      },
    ],
  },
] as Array<{
  so: string;
  available: Array<{
    name: string;
    image: { src: string; width?: string };
    state: {
      stable?: { url: string };
      experiment?: { url: string };
    };
    help: { description: string; url?: string };
  }>;
}>;
const popoverHelpApp = reactive({
  isOpen: false,
  event: CustomEvent,
  info: { text: "", url: "" },
});

// functions
function openUrl(params: { url: string }): void {
  const { url } = params;
  window.open(url, "_blank");
}
</script>

<style scoped>
.text-head {
  font-size: 3rem;
}

.size-section {
  min-height: 100vh;
}

.section-title {
  text-decoration: underline var(--ion-color-primary);
}

@media only screen and (max-width: 600px) {
  .logo {
    max-width: 61vw;
  }
  .text-head {
    font-size: 3rem;
    text-align: center;
  }
  .logo-dowar {
    max-width: 91vw;
  }
}

@media only screen and (min-width: 768px) {
  .logo {
    max-width: 28vw;
  }
  .logo-dowar {
    max-width: 44vw;
  }
}

@media only screen and (min-width: 992px) {
  .logo {
    width: 14rem;
  }
  .logo-dowar {
    max-width: 34vw;
  }
}

@media only screen and (min-width: 1200px) {
  .logo {
    width: 16vw;
  }
  .logo-dowar {
    max-width: 22vw;
  }
}
</style>
