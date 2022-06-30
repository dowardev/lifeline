<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Iniciar sesion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <img
        src="https://image.winudf.com/v2/image/Y29tLnNhcmFzLkJlc3RNaW5pbWFsaXN0V2FsbHBhcGVyX3NjcmVlbl81Xzk4dHZtbnNw/screen-5.jpg?h=800&fakeurl=1&type=.jpg"
        class="img-fondo"
        style="opacity: 90%"
      />
      <ion-row class="ion-padding">
        <ion-col size="12">
          <h1 style="color: white">Hola, es un gusto tenerte de vuelta</h1>
        </ion-col>
      </ion-row>
      <ion-row class="center center-vertical-card-login">
        <ion-col size="12" size-lg="6" size-xl="4" class="card-form">
          <ion-card>
            <div class="center">
              <img
                src="../../../../public/assets/otros/key.svg"
                alt=""
                class="imagen-usuario"
              />
            </div>
            <ion-card-content>
              <form>
                <ion-item>
                  <ion-icon
                    :icon="mailOpenOutline"
                    style="font-size: 20px; margin-top: 24px"
                    slot="start"
                  ></ion-icon>
                  <ion-label position="floating">Correo electronico</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.email.$model"
                    type="email"
                  ></ion-input>
                </ion-item>
                <div
                  v-for="(error, index) of (v$ as any).form.email.$errors"
                  :key="index"
                >
                  <div class="error">{{ error.$message }}</div>
                </div>

                <ion-item>
                  <ion-icon
                    :icon="fingerPrintOutline"
                    style="font-size: 20px; margin-top: 24px"
                    slot="start"
                  ></ion-icon>
                  <ion-label position="floating">Contraseña</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.password.$model"
                    :type="inputTypePassword"
                  ></ion-input>
                  <ion-button
                    slot="end"
                    fill="clear"
                    v-if="inputTypePassword == 'text'"
                    v-on:click="changeInputTypePassword('password')"
                    style="margin-top: 20px"
                  >
                    <ion-icon :icon="eyeOffOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    slot="end"
                    fill="clear"
                    v-if="inputTypePassword == 'password'"
                    v-on:click="changeInputTypePassword('text')"
                    style="margin-top: 20px"
                  >
                    <ion-icon :icon="eyeOutline"></ion-icon>
                  </ion-button>
                </ion-item>

                <div
                  v-for="(error, index) of (v$ as any).form.password.$errors"
                  :key="index"
                >
                  <div class="error">{{ error.$message }}</div>
                </div>
              </form>

              <ion-row>
                <ion-col size="12">
                  <ion-button
                    fill="clear"
                    expand="block"
                    v-on:click="login()"
                    :disabled="(v$ as any).form.$invalid || spinners.buttonLogin == true"
                  >
                    <ion-label v-if="spinners.buttonLogin == false">
                      Iniciar sesion</ion-label
                    >
                    <ion-spinner
                      name="crescent"
                      v-if="spinners.buttonLogin == true"
                    ></ion-spinner>
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
          <ion-row>
            <ion-col size="12" class="center">
              <small>
                <ion-text
                  color="primary"
                  v-on:click="$router.push('/restablecer')"
                >
                  ¿Olvidaste la contraseña?</ion-text
                >
              </small>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="12" class="center">
              <small>
                <ion-text color="primary" v-on:click="$router.push('/registro')"
                  >Crear cuenta</ion-text
                >
              </small>
            </ion-col>
          </ion-row>
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
  toastController,
  alertController,
  IonInput,
  loadingController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  chevronBackOutline,
  eyeOffOutline,
  eyeOutline,
  fingerPrintOutline,
  mailOpenOutline,
} from "ionicons/icons";
import {
  getUser as getUserService,
  resendEmailConfirmation as resendEmailConfirmationService,
  setUserToken as setUserTokenService,
} from "../../../services/user";
import useVuelidate from "@vuelidate/core";
import { required, email, minLength, helpers } from "@vuelidate/validators";
import { userLogin as userLoginService } from "../../../services/session";
import { USER_NAME } from "../../../services/graphql";

export default defineComponent({
  name: "LoginPage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
  },

  setup() {
    return {
      chevronBackOutline,
      eyeOffOutline,
      eyeOutline,
      v$: useVuelidate(),
      fingerPrintOutline,
      mailOpenOutline,
    };
  },

  data() {
    return {
      inputTypePassword: "password" as "text" | "password",
      form: {
        email: "",
        password: "",
      },
      spinners: { buttonLogin: false },
    };
  },

  validations() {
    const messageRequired = "Campo requerido";
    return {
      form: {
        email: {
          required: helpers.withMessage(messageRequired, required),
          email: helpers.withMessage("Correo no valido", email),
        },
        password: {
          required: helpers.withMessage(messageRequired, required),
          min: minLength(6),
        },
      },
    };
  },

  beforeRouteEnter(to, from, next) {
    getUserService({ graphql: { name: USER_NAME, fragment: "UserName" } })
      .then(() => {
        next("/");
      })
      .catch(() => {
        next();
      });
  },

  methods: {
    async presentToast(message: string, color: string) {
      const toast = await toastController.create({
        message,
        duration: 3000,
        mode: "ios",
        color,
      });
      toast.present();
    },

    async login() {
      this.spinners.buttonLogin = true;

      const user = this.form.email.replace(/\s+/g, "");
      const password = this.form.password;
      const query = `
            auth {
              access_token
        }
      `;
      try {
        const response = await userLoginService({
          query,
          user,
          password,
        });

        const token = "Bearer " + response.auth.access_token;
        setUserTokenService({ token });

        this.spinners.buttonLogin = false;
        location.reload();
      } catch (e: any) {
        this.spinners.buttonLogin = false;
        if (e.message == "Unauthorized" || e.message == "Not found") {
          this.presentToast("Usuario y/o contraseña incorrectos", "danger");
          return;
        }
        if (e.message == "Unverified email") {
          this.alertConfirmationEmail();
          return;
        }
        if (e.message == "Disabled user") {
          this.presentToast(
            "Cuenta de usuario deshabilitada, para mas informacion contacte a soporte.",
            "danger"
          );
          return;
        }

        // systemService().openToastErrror(e);
        console.error(e.message);
      }
    },

    changeInputTypePassword(type: "text" | "password") {
      this.inputTypePassword = type;
    },

    async alertConfirmationEmail() {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Alerta",
        subHeader: "Confirmación",
        message:
          "Hemos enviado un correo electrónico a " +
          this.form.email +
          " con un enlace para verificar tu identidad.",
        buttons: [
          {
            text: "Continuar",
            handler: () => {
              resendEmailConfirmationService({ email: this.form.email });
            },
          },
        ],
      });

      await alert.present();
    },

    async presentLoading() {
      const loading = await loadingController.create({
        cssClass: "my-custom-class",
        message: "Espere por favor",
      });

      // await loading.present();
      return loading;
    },
  },
});
</script>

<style scoped>
.error {
  color: red;
}
.center {
  display: flex;
  justify-content: center;
}
.imagen-usuario {
  border-radius: 50%;
  width: 90px;
}
.center-vertical-card-login {
  align-items: center;
  height: 83vh;
}
.img-fondo {
  width: 100%;
  height: 50%;
  position: absolute;
}
.card-form {
  margin-bottom: 18vh;
}

@media only screen and (min-width: 768px) {
  .img-fondo {
    width: 100%;
    height: 40%;
    position: absolute;
  }
  .card-form {
    margin-top: 0;
  }
}
@media only screen and (min-width: 992px) {
  .img-fondo {
    width: 100%;
    height: auto;
    position: absolute;
  }
  .card-form {
    margin-top: 12vh;
  }
}
@media only screen and (min-width: 1200px) {
  .img-fondo {
    width: 100%;
    height: 50%;
    position: absolute;
  }
  .card-form {
    margin-top: 4vh;
  }
}
</style>
