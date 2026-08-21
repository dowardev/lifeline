<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
  <ion-page>
    <ion-header mode="ios" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" mode="md"></ion-menu-button>
        </ion-buttons>

        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-md="10" size-lg="8" size-xl="6">
            <section>
              <div class="center" style="width: 100%">
                <ion-segment
                  v-model="policieSegment"
                  :mode="modeDesingElements"
                  scrollable
                >
                  <ion-segment-button value="privacy">
                    <ion-label>Privacidad</ion-label>
                  </ion-segment-button>

                  <ion-segment-button value="tc" :disabled="true">
                    <ion-label>Términos y condiciones</ion-label>
                  </ion-segment-button>
                </ion-segment>
              </div>
            </section>

            <section>
              <ion-row class="description">
                <ion-col sieze-xs="12" size-lg="8">
                  <ion-card class="card-main-content">
                    <div class="ion-padding-start ion-padding-end">
                      <p>
                        Como desarrollador de software y usuario activo de Internet,
                        comprendo la importancia de la privacidad. Por esta razón,
                        todos los productos desarrollados bajo la marca
                        <span
                          class="important-text;"
                          style="cursor: pointer"
                          @click="openUrl({ url: 'https://dowar.xyz/presentation' })"
                          >DowarDev
                        </span>
                        recopilan la mínima cantidad de datos necesarios, para
                        permitir a los usuarios mantener el mayor anonimato
                        posible.sible.
                      </p>

                      <h2>Datos recopilados</h2>
                      <ul>
                        <li>
                          <span class="important-text">Nombre:</span> Solo se
                          utilizará en caso estricto de necesitar contactarte a través
                          del correo electrónico que proporcionaste durante el
                          registro en la aplicación.
                        </li>
                        <li>
                          <span class="important-text">Usuario:</span> Se empleará
                          exclusivamente para identificarte dentro de la aplicación.
                        </li>
                        <li>
                          <span class="important-text">Correo electrónico:</span> El
                          correo electrónico proporcionado durante el registro en la
                          aplicación se utilizará para enviarte notificaciones (que
                          podrás cambiar en tu panel de configuración) o en casos
                          estrictos de necesidad de contacto.
                        </li>
                      </ul>

                      <h2>Datos que se almacenan en tu dispositivo</h2>
                      <ul>
                        <li>
                          <span class="important-text">Token de sesión:</span> Cuando
                          realizas un inicio de sesión en la aplicación, se crea
                          automáticamente un token que sirve para identificarte con el
                          servidor. Este token se almacena en forma de cookie o en la
                          caché de la aplicación, debido a que algunas formas de
                          distribución de la aplicación no son compatibles con el
                          formato de cookie.
                        </li>
                        <li>
                          <span class="important-text">Modo offline:</span> La
                          aplicación cuenta con una función que te permite acceder a
                          los datos sin necesidad de tener una conexión activa a
                          Internet.
                        </li>
                        <li>
                          <span class="important-text">Tema:</span> Las preferencias
                          sobre el tema que elijas dentro de la aplicación se
                          almacenan en la caché.
                        </li>
                        <li>
                          <span class="important-text">Nuevo usuario:</span> Cuando
                          accedes por primera vez a la aplicación, se genera
                          automáticamente una cookie que tiene como único propósito
                          identificar a nuevos usuarios. Esta cookie es independiente
                          del usuario y se crea por cada nuevo dispositivo con el que
                          se acceda, por lo que no se almacena en nuestro servidor.
                        </li>
                      </ul>

                      <h2>Razones de contacto</h2>
                      <p>
                        Solo se te contactará cuando sea estrictamente necesario. A
                        continuación se detallan algunos ejemplos de escenarios:
                      </p>
                      <ul>
                        <li>
                          Problemas con la aplicación: Si la aplicación presenta algún
                          fallo, te notificaremos a través del correo electrónico.
                        </li>
                        <li>
                          <span class="important-text">Novedades:</span> Te
                          informaremos por correo electrónico y dentro de la
                          aplicación (esta opción puede ser desactivada desde tu panel
                          de configuración) sobre cualquier adición o eliminación de
                          funciones en la aplicación.
                        </li>
                        <li>
                          <span class="important-text"
                            >Cambios en las políticas:</span
                          >
                          Es importante que estés al tanto de los cambios en estos
                          documentos, por lo que se te notificará por correo
                          electrónico y dentro de la aplicación sobre la existencia de
                          una nueva versión.
                        </li>
                        <li>
                          <span class="important-text">Newsletter:</span> Si activas
                          esta función, recibirás información sobre nuestras nuevas
                          publicaciones por correo electrónico (según tu
                          configuración).
                        </li>
                      </ul>

                      <h2>Seguridad de la aplicación</h2>
                      <ul>
                        <li>
                          Las conexiones realizadas por la aplicación están cifradas
                          mediante un certificado SSL.
                        </li>
                        <li>
                          Las contraseñas se encuentran debidamente cifradas en la
                          base de datos.
                        </li>
                      </ul>

                      <p>
                        Estamos trabajando activamente para garantizar la seguridad y
                        privacidad en la aplicación. Si eres desarrollador, puedes
                        consultar el código fuente de la aplicación a través de los
                        enlaces proporcionados dentro de la aplicación. Si es
                        necesario, puedes eliminar toda la información relacionada con
                        tu cuenta desde tu panel de configuración. Por último, quiero
                        destacar que no se realiza ningún tipo de seguimiento de
                        actividad dentro de la aplicación y que los datos ingresados
                        en ella no se comparten con terceros.
                      </p>
                    </div>
                  </ion-card>
                </ion-col>
              </ion-row>
            </section>
          </ion-col>
        </ion-row>
      </ion-grid>
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
  IonSegment,
  IonSegmentButton,
  isPlatform,
} from "@ionic/vue";
import { ref } from "vue";
const modeDesingElements = isPlatform("ios") ? "ios" : ("md" as "ios" | "md");

// refs
const pageTitle = ref("Politicas");
const policieSegment = ref("privacy");

// methods
const openUrl = (params: { url: string }): void => {
  const url = params.url;
  window.open(url, "_blank");
};
</script>

<style scoped>
.important-text {
  font-weight: bold;
}
.card-main-content {
  max-height: 82vh;
  overflow-y: auto;
}

@media only screen and (min-width: 768px) {
  .description {
    display: flex;
    justify-content: center;
  }
}
</style>
