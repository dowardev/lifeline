<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button v-on:click="$router.go(-1)">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Crear cuenta</ion-title>
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
          <h1 style="color: white">Bienvenido</h1>
        </ion-col>
      </ion-row>
      <ion-row class="center center-vertical-card-login">
        <ion-col size="12" size-lg="6" size-xl="4" class="card-form">
          <ion-card>
            <ion-card-header>
              <div class="center">
                <img
                  src="../../../../public/assets/otros/user.png"
                  alt=""
                  class="imagen-usuario"
                />
              </div>
            </ion-card-header>

            <ion-card-content>
              <form>
                <ion-item>
                  <ion-label position="floating">Nombre</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.name.$model"
                    autocomplete="name"
                    inputmode="text"
                    type="text"
                  ></ion-input>
                </ion-item>
                <div
                  v-for="(error, index) of (v$ as any).form.name.$errors"
                  :key="index"
                >
                  <div class="error">{{ error.$message }}</div>
                </div>

                <ion-item>
                  <ion-label position="floating">Usuario</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.user.$model"
                    inputmode="text"
                    type="text"
                  ></ion-input>
                </ion-item>
                <div
                  v-for="(error, index) of (v$ as any).form.user.$errors"
                  :key="index"
                >
                  <div class="error">{{ error.$message }}</div>
                </div>

                <ion-item>
                  <ion-label position="floating">Correo electronico</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.email.$model"
                    autocomplete="email"
                    inputmode="email"
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
                  <ion-label position="floating">Contraseña</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.password.$model"
                    :type="inputTypePassword1"
                    autocomplete="new-password"
                  ></ion-input>
                  <ion-button
                    slot="end"
                    fill="clear"
                    v-if="inputTypePassword1 == 'text'"
                    v-on:click="changeInputTypePassword1('password')"
                    style="margin-top: 20px"
                  >
                    <ion-icon :icon="eyeOffOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    slot="end"
                    fill="clear"
                    v-if="inputTypePassword1 == 'password'"
                    v-on:click="changeInputTypePassword1('text')"
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

                <ion-item>
                  <ion-label position="floating">Repite contraseña</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.password2.$model"
                    :type="inputTypePassword2"
                    autocomplete="new-password"
                  ></ion-input>
                  <ion-button
                    slot="end"
                    fill="clear"
                    v-if="inputTypePassword2 == 'text'"
                    v-on:click="changeInputTypePassword2('password')"
                    style="margin-top: 20px"
                  >
                    <ion-icon :icon="eyeOffOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    slot="end"
                    fill="clear"
                    v-if="inputTypePassword2 == 'password'"
                    v-on:click="changeInputTypePassword2('text')"
                    style="margin-top: 20px"
                  >
                    <ion-icon :icon="eyeOutline"></ion-icon>
                  </ion-button>
                </ion-item>
                <div
                  v-for="(error, index) of (v$ as any).form.password2.$errors"
                  :key="index"
                >
                  <div class="error">{{ error.$message }}</div>
                </div>
              </form>

              <ion-row>
                <ion-col size="12">
                  <ion-button
                    expand="block"
                    fill="clear"
                    v-on:click="addUser()"
                    :disabled="
                      (v$ as any).form.$invalid || spinners.buttonSignup == true
                    "
                  >
                    <ion-label v-if="spinners.buttonSignup == false"
                      >Registrar</ion-label
                    >
                    <ion-spinner
                      name="crescent"
                      v-if="spinners.buttonSignup == true"
                    ></ion-spinner>
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
          <ion-row>
            <ion-col size="12" class="center">
              <small>
                <ion-text color="primary" v-on:click="$router.push('/sesion')">
                  ¿Ya tienes cuenta?</ion-text
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
  alertController,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  toastController,
  IonInput,
  loadingController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { userRegister as userRegisterService } from "../../../services/session";
import { eyeOutline, eyeOffOutline, chevronBackOutline } from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { required, email, helpers, sameAs } from "@vuelidate/validators";
import { openToast as openToastService } from "../../../services/system";
import { getUser as getUserService } from "../../../services/user";
import { USER_NAME } from "../../../services/graphql";

export default defineComponent({
  name: "RegisterPage",
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
      eyeOutline,
      eyeOffOutline,
      chevronBackOutline,
      v$: useVuelidate(),
    };
  },

  data() {
    return {
      inputTypePassword1: "password" as "text" | "password",
      inputTypePassword2: "password" as "text" | "password",
      form: {
        user: "",
        name: "",
        email: "",
        password: "",
        password2: "",
      },
      spinners: {
        buttonSignup: false,
      },
    };
  },

  validations() {
    const messageRequired = "Campo requerido";
    const messageAlpha = "Solamente puede contener texto";
    return {
      form: {
        name: {
          required: helpers.withMessage(messageRequired, required),
          alpha: helpers.withMessage(
            messageAlpha,
            helpers.regex(/^[a-zA-Z ]*$/)
          ),
        },
        user: {
          required: helpers.withMessage(messageRequired, required),
        },
        email: {
          required: helpers.withMessage(messageRequired, required),
          email: helpers.withMessage("Correo no valido", email),
        },
        password: {
          required: helpers.withMessage(messageRequired, required),
          minLength: helpers.withMessage(
            "La contraseña debe tener almenos una mayuscula, un numero y tener un tamaño de 8",
            helpers.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
          ),
        },
        password2: {
          same: helpers.withMessage(
            "Las contraseñas no coinciden",
            sameAs(this.form.password)
          ),
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
    async addUser() {
      this.spinners.buttonSignup = true;

      const name = this.form.name;
      const user = this.form.user;
      const email = this.form.email.replace(/\s+/g, "");
      const password = this.form.password;
      try {
        await userRegisterService({
          name,
          user,
          email,
          password,
        });
        this.alertConfirmaciónEmail();
        this.$router.push("/login");
        this.clearInputs();
      } catch (e: any) {
        this.spinners.buttonSignup = false;
        if (e.message == "The email has already been selected") {
          openToastService({
            message: "Correo ya en uso",
            color: "warning",
          });
          return;
        }
        if (e.message == "The user has already been selected") {
          openToastService({
            message: "Usuario ya en uso",
            color: "warning",
          });
          return;
        }
        console.error(e);
        // systemService().openToastErrror(e);
      } finally {
        this.spinners.buttonSignup = false;
      }
    },

    async presentToast(message: string, color: string) {
      const toast = await toastController.create({
        message,
        duration: 3000,
        mode: "ios",
        color,
      });
      toast.present();
    },
    clearInputs() {
      this.form.name = "";
      this.form.user = "";
      this.form.password = "";
      this.form.password2 = "";
      this.form.email = "";
    },
    changeInputTypePassword1(type: "text" | "password") {
      this.inputTypePassword1 = type;
    },
    changeInputTypePassword2(type: "text" | "password") {
      this.inputTypePassword2 = type;
    },
    async alertConfirmacionEmail() {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Alerta",
        subHeader: "Confirmacion",
        message:
          "Hemos enviado un correo electronico a <b>" +
          this.form.email +
          "</b> con un enlace para verificar tu identidad.",
        buttons: [
          {
            text: "Continuar",
            handler: () => {
              this.$router.push("/sesion");
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

    async alertConfirmaciónEmail() {
      const alert = await alertController.create({
        header: "Alerta",
        subHeader: "Confirmación",
        message:
          "Hemos enviado un correo electrónico a <b>" +
          this.form.email +
          "</b> con un enlace para verificar tu identidad.",
        buttons: [
          {
            text: "Continuar",
            handler: () => {
              this.$router.push("/login");
            },
          },
        ],
      });

      await alert.present();
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
    margin-top: 2vh;
  }
}
@media only screen and (min-width: 1200px) {
  .img-fondo {
    width: 100%;
    height: 50%;

    position: absolute;
  }
  .card-form {
    margin-top: 0;
  }
}
</style>
