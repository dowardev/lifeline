<template>
  <ion-grid>
    <ion-row class="ion-justify-content-center">
      <ion-col size="12">
        <section class="center">
          <ion-card class="element-post-selected">
            <ion-card-content>
              <div class="center">
                <img :src="imageKeyPath" alt="" class="imagen-usuario" />
              </div>

              <!-- user -->
              <ion-row>
                <ion-col size-xs="11" size="10">
                  <div style="display: flex">
                    <div>
                      <div style="display: flex; align-items: center; height: 50px">
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
                        :error-text="v$.form.email.$errors[0]?.$message as string"
                        :class="[
                          v$.form.email.$errors.length == 0
                            ? 'ion-valid'
                            : 'ion-invalid',
                        ]"
                        :value="form.email"
                        @ion-input="form.email = $event.target.value as string"
                        @ion-focus="
                          ($refs.inputMail as any).$el.classList.add('ion-touched');
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
                      <div style="display: flex; align-items: center; height: 50px">
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
                        :error-text="v$.form.password.$errors[0]?.$message as string"
                        :class="[
                          v$.form.password.$errors.length == 0
                            ? 'ion-valid'
                            : 'ion-invalid',
                        ]"
                        :value="form.password"
                        @ion-input="form.password = $event.target.value as string"
                        @ion-focus="
                          ($refs.inputPassword as any).$el.classList.add(
                            'ion-touched',
                          );
                          v$.form.password.$touch();
                        "
                      ></ion-input>
                    </div>

                    <div>
                      <div style="display: flex; align-items: center; height: 50px">
                        <ion-button
                          slot="end"
                          fill="clear"
                          style="margin-top: 20px"
                          @click="isPasswordVisible = !isPasswordVisible"
                        >
                          <ion-icon
                            :icon="isPasswordVisible ? eyeOffOutline : eyeOutline"
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
        </section>

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
  </ion-grid>
</template>

<script setup lang="ts">
import {
  toastController,
  alertController,
  IonInput,
  IonCard,
  IonRow,
  IonCol,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
} from "@ionic/vue";
import { computed, reactive, ref } from "vue";
import {
  eyeOffOutline,
  eyeOutline,
  fingerPrintOutline,
  personOutline,
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import { useRouter } from "vue-router";

// controllers
import { AuthController } from "@/controllers/authController";
import { ThemeController } from "@/controllers/themeController";
const userController = new AuthController();
const themeController = new ThemeController();

// assets
import keyImage from "@/assets/otros/key.svg";
import keyImageGruvbox from "@/assets/otros/key-gruvbox.png";
import keyImageCherry from "@/assets/otros/key-cherry.png";


const router = useRouter();

// refs
const form = reactive({ email: "admin@admin.com", password: "changeme123" });
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
const messageError = {
  email: "Correo electronico no valido",
  required: "Campo requerido",
};
const rules = {
  form: {
    email: {
      required: helpers.withMessage(messageError.required, required),
    },
    password: {
      required: helpers.withMessage(messageError.required, required),
    },
  },
};
const v$ = useVuelidate(rules, { form });

// computed
const imageKeyPath = computed(() => {
  const theme = themeController.getTheme();
  let image = "";
  if (theme == "nord" || theme == "light") image = keyImage;
  if (theme == "gruvbox") image = keyImageGruvbox;
  if (theme == "cherry") image = keyImageCherry;
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
    await userController.login({
      user,
      password,
    });

    spinners.buttonLogin = false;
    clearInputs();
    await router.push('/home');
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

const clearInputs = (): void => {
  form.password = "";
  form.email = "";
};

const alertConfirmationEmail = async (): Promise<void> => {
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
        handler: (): void => {},
      },
    ],
  });

  await alert.present();
};

const forgotPassword = async (): Promise<void> => {
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

const createAccount = async (): Promise<void> => {
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
        handler: (): void => {
          // console.log("Confirm Cancel");
        },
      },
      {
        text: "Confirmar",
        handler: (): void => {
          // console.log(e);
        },
      },
    ],
  });

  await alert.present();
  const response = await alert.onDidDismiss();
   
  return { email: response.data.values.email, role: response.role! };
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

.element-post-selected {
  border: 1px solid var(--ion-color-primary);
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
