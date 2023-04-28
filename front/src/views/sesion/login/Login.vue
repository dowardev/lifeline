<template>
  <ion-page>
    <ion-header :translucent="true" class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button
            menu="mainMenu"
            :smode="modeDesingElements"
          ></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ $t("message.login") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <img :src="loginImagePath" class="img-fondo" style="opacity: 90%" />
      <ion-row class="ion-padding">
        <ion-col size="12">
          <h1 style="color: white !important">
            {{ capitalizeFirstLetter($t("message.welcomeMessageLogin")) }}
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
                        :error-text="v$.form.email.$errors[0]?.$message as string"
                        :class="[
                          v$.form.email.$errors.length == 0
                            ? 'ion-valid'
                            : 'ion-invalid',
                        ]"
                        :value="form.email.value"
                        @ion-input="
                          form.email.value = $event.target.value as string
                        "
                        @ion-focus="
                          ($refs.inputMail as any).$el.classList.add(
                            'ion-touched'
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
                        :error-text="v$.form.password.$errors[0]?.$message as string"
                        :class="[
                          v$.form.password.$errors.length == 0
                            ? 'ion-valid'
                            : 'ion-invalid',
                        ]"
                        :value="form.password.value"
                        @ion-input="
                          form.password.value = $event.target.value as string
                        "
                        @ion-focus="
                          ($refs.inputPassword as any).$el.classList.add(
                            'ion-touched'
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
                          @click="
                            isPasswordVisible = !isPasswordVisible.valueOf()
                          "
                        >
                          <ion-icon
                            :icon="
                              isPasswordVisible.valueOf()
                                ? eyeOffOutline
                                : eyeOutline
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
                  :disabled="v$.$invalid || spinners.buttonLogin.value"
                  @click="login()"
                >
                  <ion-label v-if="spinners.buttonLogin.value == false">
                    Iniciar sesión</ion-label
                  >
                  <ion-spinner
                    v-if="spinners.buttonLogin.value"
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
                  :disabled="spinners.buttonForgotPassword.value"
                  @click="forgotPassword()"
                >
                  <ion-label
                    v-if="spinners.buttonForgotPassword.value == false"
                    >{{
                      capitalizeFirstLetter($t("message.recoverPassword"))
                    }}</ion-label
                  >
                  <ion-spinner
                    v-if="spinners.buttonForgotPassword.value"
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
                  :disabled="spinners.buttonCreateAccount.value"
                  expand="full"
                  @click="createAccount()"
                >
                  <ion-label
                    v-if="spinners.buttonCreateAccount.value == false"
                    >{{
                      capitalizeFirstLetter($t("message.createAccount"))
                    }}</ion-label
                  >
                  <ion-spinner
                    v-if="spinners.buttonCreateAccount.value"
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
import { defineComponent, ref } from "vue";
import {
  eyeOffOutline,
  eyeOutline,
  fingerPrintOutline,
  mailOpenOutline,
  personOutline,
} from "ionicons/icons";
import { userLogin } from "../../../services/session";
import {
  getUser,
  setUserToken,
  resendEmailConfirmation,
} from "../../../services/user";
import useVuelidate from "@vuelidate/core";
import { required, helpers, email } from "@vuelidate/validators";
// import { openToastErrror } from "../../../services/system";
import { USER_LOGIN, USER_NAME } from "../../../services/graphql";
import { capitalizeFirstLetter } from "../../../services/system";
import { useSystem } from "@/composables/useSystem";
import keyImage from "@/assets/otros/key.svg";
import keyImageGruvbox from "@/assets/otros/key-gruvbox.png";
import loginImageGruvbox from "@/assets/otros/login-gruvbox.jpg";

export default defineComponent({
  name: "LoginPage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
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
  },

  beforeRouteEnter(to, from, next) {
    getUser({ graphql: { name: USER_NAME, fragment: "UserName" } })
      .then(() => {
        next("/");
      })
      .catch(() => {
        next();
      });
  },

  setup() {
    const modeDesingElements = isPlatform("ios") ? "ios" : "md";

    // form
    const form = { email: ref(""), password: ref("") };

    // spinners
    const buttonLogin = ref(false);
    const buttonForgotPassword = ref(false);
    const buttonCreateAccount = ref(false);

    // validation
    const regexValidations = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      required: /^\s*$/,
    };
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

    // input ref
    const inputMail = ref(null);
    const inputPassword = ref(null);

    // others
    const isPasswordVisible = ref(false);
    return {
      eyeOffOutline,
      eyeOutline,
      v$,
      fingerPrintOutline,
      mailOpenOutline,
      modeDesingElements,
      capitalizeFirstLetter: capitalizeFirstLetter,
      form,
      spinners: {
        buttonLogin,
        buttonForgotPassword,
        buttonCreateAccount,
      },
      personOutline,
      messageError,
      regexValidations,
      inputMail,
      inputPassword,
      isPasswordVisible,
    };
  },

  computed: {
    imageKeyPath() {
      const theme = useSystem().getTheme();
      let image = "";
      if (theme == "nord" || "light") image = keyImage;
      if (theme == "gruvbox") image = keyImageGruvbox;
      return image;
    },
    loginImagePath() {
      const theme = useSystem().getTheme();
      let image = "";
      if (theme == "nord" || "light")
        image =
          "https://image.winudf.com/v2/image/Y29tLnNhcmFzLkJlc3RNaW5pbWFsaXN0V2FsbHBhcGVyX3NjcmVlbl81Xzk4dHZtbnNw/screen-5.jpg?h=800&fakeurl=1&type=.jpg";
      if (theme == "gruvbox") image = loginImageGruvbox;
      return image;
    },
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
      this.spinners.buttonLogin.value = true;

      const user = this.form.email.value.replace(/\s+/g, "");
      const password = this.form.password.value;

      try {
        const response = await userLogin({
          user,
          password,
          graphql: { name: USER_LOGIN, fragment: "UserLogin" },
        });

        const token = "Bearer " + response.auth.access_token;
        setUserToken({ token });

        this.spinners.buttonLogin.value = false;
        this.clearInputs();
        location.reload();
      } catch (e: any) {
        this.spinners.buttonLogin.value = false;
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

        // openToastErrror(e);
        console.error(e.message);
      }
    },

    clearInputs() {
      this.form.password.value = "";
      this.form.email.value = "";
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
              resendEmailConfirmation({ email: this.form.email });
            },
          },
        ],
      });

      await alert.present();
    },

    async presentLoading(message: string) {
      const loading = await loadingController.create({
        message,
      });
      return loading;
    },

    async forgotPassword() {
      this.spinners.buttonForgotPassword.value = true;

      const alertResponse = await this.presentAlertRestorePassword();
      if (alertResponse.role == "cancel") {
        this.spinners.buttonForgotPassword.value = false;
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

      this.spinners.buttonForgotPassword.value = false;
    },

    async createAccount() {
      this.spinners.buttonCreateAccount.value = true;
      await this.$router.push("/signup");
      this.spinners.buttonCreateAccount.value = false;
    },

    async presentAlertRestorePassword(): Promise<{
      email: string;
      role: string;
    }> {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Restauracion de contraseña",
        message:
          "Te enviaremos un correo electronico con las intrucciones para restablecer tu contraseña.",
        inputs: [
          {
            name: "email",
            id: "email",
            placeholder: "Correo electronico",
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
    },
  },
});
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
