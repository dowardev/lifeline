<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button
            menu="mainMenu"
            :smode="modeDesingElements"
          ></ion-menu-button>
        </ion-buttons>
        <ion-title>Iniciar sesion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <img :src="loginImagePath" class="img-fondo" style="opacity: 90%" />
      <ion-row class="ion-padding">
        <ion-col size="12">
          <h1 style="color: white !important">
            Hola, es un gusto tenerte de vuelta.
          </h1>
        </ion-col>
      </ion-row>

      <ion-row class="center center-vertical-card-login">
        <ion-col size="12" size-lg="6" size-xl="4" class="card-form">
          <ion-card>
            <ion-card-content>
              <div class="center">
                <img :src="imageKeyPath" alt="" class="imagen-usuario" />
              </div>

              <!-- user -->
              <ion-row>
                <ion-col size-xs="11" size="10">
                  <div style="display: flex">
                    <div>
                      <div
                        style="display: flex; align-items: center; height: 50px"
                      >
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="personOutline"></ion-icon
                        ></ion-button>
                      </div>
                    </div>

                    <div style="width: 100%">
                      <ion-input
                        ref="inputMail"
                        fill="outline"
                        label="Usuario o correo electrónico"
                        label-placement="floating"
                        autocomplete="email"
                        type="email"
                        :error-text="
                          v$.form.email.$errors[0]?.$message as string
                        "
                        :class="[
                          v$.form.email.$errors.length == 0
                            ? 'ion-valid'
                            : 'ion-invalid',
                        ]"
                        :value="form.email"
                        @ion-input="form.email = $event.target.value as string"
                        @ion-focus="
                          ($refs.inputMail as any).$el.classList.add(
                            'ion-touched',
                          );
                          v$.form.email.$touch();
                        "
                      ></ion-input>
                    </div>
                  </div>
                </ion-col>
              </ion-row>

              <!-- password -->
              <ion-row>
                <ion-col size-xs="11" size="10">
                  <div style="display: flex">
                    <div>
                      <div
                        style="display: flex; align-items: center; height: 50px"
                      >
                        <ion-button fill="clear" :disabled="true"
                          ><ion-icon :icon="fingerPrintOutline"></ion-icon
                        ></ion-button>
                      </div>
                    </div>

                    <div style="width: 100%">
                      <ion-input
                        ref="inputPassword"
                        fill="outline"
                        label="Contraseña"
                        label-placement="floating"
                        autocomplete="current-password"
                        :type="isPasswordVisible ? 'text' : 'password'"
                        :error-text="
                          v$.form.password.$errors[0]?.$message as string
                        "
                        :class="[
                          v$.form.password.$errors.length == 0
                            ? 'ion-valid'
                            : 'ion-invalid',
                        ]"
                        :value="form.password"
                        @ion-input="
                          form.password = $event.target.value as string
                        "
                        @ion-focus="
                          ($refs.inputPassword as any).$el.classList.add(
                            'ion-touched',
                          );
                          v$.form.password.$touch();
                        "
                      ></ion-input>
                    </div>

                    <div>
                      <div
                        style="display: flex; align-items: center; height: 50px"
                      >
                        <ion-button
                          slot="end"
                          fill="clear"
                          style="margin-top: 20px"
                          @click="isPasswordVisible = !isPasswordVisible"
                        >
                          <ion-icon
                            :icon="
                              isPasswordVisible ? eyeOffOutline : eyeOutline
                            "
                          ></ion-icon>
                        </ion-button>
                      </div>
                    </div>
                  </div>
                </ion-col>
              </ion-row>

              <!-- button login -->
              <section class="center">
                <ion-button
                  :disabled="v$.$invalid || spinners.buttonLogin"
                  @click="login()"
                >
                  <ion-label v-if="spinners.buttonLogin == false">
                    Iniciar sesión</ion-label
                  >
                  <ion-spinner
                    v-if="spinners.buttonLogin"
                    name="crescent"
                  ></ion-spinner>
                </ion-button>
              </section>
            </ion-card-content>
          </ion-card>

          <section>
            <div class="center">
              <ion-item lines="none" class="transparent">
                <ion-button
                  class="options"
                  fill="clear"
                  :disabled="spinners.buttonForgotPassword"
                  @click="forgotPassword()"
                >
                  <ion-label v-if="spinners.buttonForgotPassword == false">
                    Recuperar contraseña
                  </ion-label>
                  <ion-spinner
                    v-if="spinners.buttonForgotPassword"
                    name="crescent"
                  ></ion-spinner>
                </ion-button>
              </ion-item>
            </div>

            <div class="center">
              <ion-item lines="none" class="transparent">
                <ion-button
                  class="options"
                  fill="clear"
                  :disabled="spinners.buttonCreateAccount"
                  expand="full"
                  @click="createAccount()"
                >
                  <ion-label v-if="spinners.buttonCreateAccount == false">
                    Crear cuenta
                  </ion-label>
                  <ion-spinner
                    v-if="spinners.buttonCreateAccount"
                    name="crescent"
                    color="primary"
                  ></ion-spinner>
                </ion-button>
              </ion-item>
            </div>
          </section>
        </ion-col>
      </ion-row>
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
  toastController,
  alertController,
  IonInput,
  IonCard,
  IonRow,
  IonCol,
  IonButtons,
  IonMenuButton,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
  isPlatform,
} from "@ionic/vue";
import { computed, reactive, ref } from "vue";
import {
  eyeOffOutline,
  eyeOutline,
  fingerPrintOutline,
  personOutline,
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { required, helpers, email } from "@vuelidate/validators";
import { USER_LOGIN, USER_BASIC } from "../../../utils/graphql";
import { useRouter } from "vue-router";

// controllers
import { SystemController } from "@/js/systemController";
import { UserController } from "@/js/userController";
const systemController = new SystemController();
const userController = new UserController();

// assets
import keyImage from "@/assets/otros/key.svg";
import keyImageGruvbox from "@/assets/otros/key-gruvbox.png";
import keyImageCherry from "@/assets/otros/key-cherry.png";
import loginImageGruvbox from "@/assets/otros/login-gruvbox.jpg";
import loginImageCherry from "@/assets/otros/login-cherry.png";

const router = useRouter();

// refs
const form = reactive({ email: "", password: "" });
// spinners
const spinners = reactive({
  buttonLogin: false,
  buttonForgotPassword: false,
  buttonCreateAccount: false,
});

// input ref
const inputMail = ref(null);
const inputPassword = ref(null);

// others
const isPasswordVisible = ref(false);

// vars
const modeDesingElements = isPlatform("ios") ? "ios" : "md";
const messageError = {
  email: "Correo electronico no valido",
  required: "Campo requerido",
};
const rules = {
  form: {
    email: {
      required: helpers.withMessage(messageError.required, required),
      email: helpers.withMessage(messageError.email, email),
    },
    password: {
      required: helpers.withMessage(messageError.required, required),
    },
  },
};
const v$ = useVuelidate(rules, { form });

// computed
const imageKeyPath = computed(() => {
  const theme = systemController.getTheme();
  let image = "";
  if (theme == "nord" || "light") image = keyImage;
  if (theme == "gruvbox") image = keyImageGruvbox;
  if (theme == "cherry") image = keyImageCherry;
  return image;
});
const loginImagePath = computed(() => {
  const theme = systemController.getTheme();
  let image = "";
  if (theme == "nord" || "light")
    image =
      "https://image.winudf.com/v2/image/Y29tLnNhcmFzLkJlc3RNaW5pbWFsaXN0V2FsbHBhcGVyX3NjcmVlbl81Xzk4dHZtbnNw/screen-5.jpg?h=800&fakeurl=1&type=.jpg";
  if (theme == "gruvbox") image = loginImageGruvbox;
  if (theme == "cherry") image = loginImageCherry;
  return image;
});

// funcions
const presentToast = async (message: string, color: string): Promise<void> => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    mode: "ios",
    color,
  });
  toast.present();
};

async function login(): Promise<void> {
  spinners.buttonLogin = true;

  const user = form.email.replace(/\s+/g, "");
  const password = form.password;

  try {
    const response = await userController.userLogin({
      user,
      password,
    });

    const token = "Bearer " + response.auth.access_token;
    userController.storeUserToken({ token });

    spinners.buttonLogin = false;
    clearInputs();
    location.reload();
  } catch (e: any) {
    spinners.buttonLogin = false;
    if (e.message == "Unauthorized" || e.message == "Not found") {
      presentToast("Usuario y/o contraseña incorrectos", "danger");
      return;
    }
    if (e.message == "Unverified email") {
      alertConfirmationEmail();
      return;
    }
    if (e.message == "Disabled user") {
      presentToast(
        "Cuenta de usuario deshabilitada, para mas información contacte a soporte.",
        "danger",
      );
      return;
    }
    // systemController.openToastError(e);
    console.error(e.message);
  }
}

const clearInputs = () => {
  form.password = "";
  form.email = "";
};

const alertConfirmationEmail = async () => {
  const alert = await alertController.create({
    cssClass: "my-custom-class",
    header: "Alerta",

    subHeader: "Confirmación",
    message:
      "Hemos enviado un correo electrónico a " +
      form.email +
      " con un enlace para verificar tu identidad.",
    buttons: [
      {
        text: "Continuar",
        handler: () => {
          resendEmailConfirmation({ email: form.email });
        },
      },
    ],
  });

  await alert.present();
};

const forgotPassword = async () => {
  spinners.buttonForgotPassword = true;

  const alertResponse = await presentAlertRestorePassword();
  if (alertResponse.role == "cancel") {
    spinners.buttonForgotPassword = false;
    return;
  }

  // try {
  //   await sendMailResetPassword({
  //     email: alertResponse.email,
  //   });
  // } catch (e: any) {
  //   console.error(e);
  //   openToastErrror(e);
  // }

  spinners.buttonForgotPassword = false;
};

const createAccount = async () => {
  spinners.buttonCreateAccount = true;
  await router.push("/signup");
  spinners.buttonCreateAccount = false;
};

const presentAlertRestorePassword = async (): Promise<{
  email: string;
  role: string;
}> => {
  const alert = await alertController.create({
    cssClass: "my-custom-class",
    header: "Restauración de contraseña",
    message:
      "Te enviaremos un correo electrónico con las instrucciones para restablecer tu contraseña.",
    inputs: [
      {
        name: "email",
        id: "email",
        placeholder: "Correo electrónico",
        type: "email",
      },
    ],
    buttons: [
      {
        text: "Cancelar",
        role: "cancel",
        cssClass: "secondary",
        handler: () => {
          // console.log("Confirm Cancel");
        },
      },
      {
        text: "Confirmar",
        handler: () => {
          // console.log(e);
        },
      },
    ],
  });

  await alert.present();
  const response = await alert.onDidDismiss();
  // eslint-disable-next-line
  return { email: response.data.values.email, role: response.role! };
};

//TODO: move to controller
const loadUser = async (): Promise<void> => {
  try {
    userController.loadUser({
      graphql: { name: USER_BASIC, fragment: "UserBasic" },
    });
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
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
