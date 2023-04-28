<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$router.go(-1)">
            <ion-icon :icon="chevronBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{
          capitalizeFirstLetter($t("message.createAccount"))
        }}</ion-title>
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
          <h1 style="color: white">
            {{ capitalizeFirstLetter($t("message.welcome")) }}
          </h1>
        </ion-col>
      </ion-row>
      <ion-row class="center center-vertical-card-login">
        <ion-col size="12" size-lg="6" size-xl="4" class="card-form">
          <ion-card>
            <ion-card-header>
              <div class="center">
                <img
                  src="@/assets/otros/user.png"
                  alt=""
                  class="imagen-usuario"
                />
              </div>
            </ion-card-header>

            <ion-card-content>
              <form>
                <ion-item>
                  <ion-label position="floating">{{
                    capitalizeFirstLetter($t("message.name"))
                  }}</ion-label>
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
                  <ion-label position="floating">{{
                    capitalizeFirstLetter($t("message.user"))
                  }}</ion-label>
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
                  <ion-label position="floating">{{
                    capitalizeFirstLetter($t("message.email"))
                  }}</ion-label>
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
                  <ion-label position="floating">{{
                    capitalizeFirstLetter($t("message.password"))
                  }}</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.password.$model"
                    :type="isPasswordVisible1 ? 'text' : 'password'"
                    autocomplete="new-password"
                  ></ion-input>

                  <ion-button
                    slot="end"
                    fill="clear"
                    style="margin-top: 20px"
                    @click="isPasswordVisible1 = !isPasswordVisible1.valueOf()"
                  >
                    <ion-icon
                      :icon="
                        isPasswordVisible1.valueOf()
                          ? eyeOffOutline
                          : eyeOutline
                      "
                    ></ion-icon>
                  </ion-button>
                </ion-item>
                <div
                  v-for="(error, index) of (v$ as any).form.password.$errors"
                  :key="index"
                >
                  <div class="error">{{ error.$message }}</div>
                </div>

                <ion-item>
                  <ion-label position="floating">{{
                    capitalizeFirstLetter($t("message.repeatPassword"))
                  }}</ion-label>
                  <ion-input
                    v-model="(v$ as any).form.password2.$model"
                    :type="isPasswordVisible2 ? 'text' : 'password'"
                    autocomplete="new-password"
                  ></ion-input>
                  <ion-button
                    slot="end"
                    fill="clear"
                    style="margin-top: 20px"
                    @click="isPasswordVisible2 = !isPasswordVisible2.valueOf()"
                  >
                    <ion-icon
                      :icon="
                        isPasswordVisible2.valueOf()
                          ? eyeOffOutline
                          : eyeOutline
                      "
                    ></ion-icon>
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
                    :disabled="
                      (v$ as any).form.$invalid || spinners.buttonSignup.value == true
                    "
                    @click="addUser()"
                  >
                    <ion-label v-if="spinners.buttonSignup.value == false">{{
                      $t("message.signup")
                    }}</ion-label>
                    <ion-spinner
                      v-if="spinners.buttonSignup.value == true"
                      name="crescent"
                    ></ion-spinner>
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
          <ion-row>
            <ion-col size="12" class="center">
              <small>
                <ion-text color="primary" @click="$router.push('/sesion')">
                  {{ capitalizeFirstLetter($t("message.login")) }}</ion-text
                >
              </small>
            </ion-col>
          </ion-row>
        </ion-col>
      </ion-row>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  alertController,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
} from "@ionic/vue";
import { ref } from "vue";
import { userRegister as userRegisterService } from "../../../services/session";
import { eyeOutline, eyeOffOutline, chevronBackOutline } from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { required, email, helpers, sameAs } from "@vuelidate/validators";
import { openToast as openToastService } from "../../../services/system";
import { getUser as getUserService } from "../../../services/user";
import { USER_NAME } from "../../../services/graphql";
import { capitalizeFirstLetter } from "../../../services/system";
import { useRouter, onBeforeRouteUpdate } from "vue-router";

const router = useRouter();

const form = {
  user: ref(""),
  name: ref(""),
  email: ref(""),
  password: ref(""),
  password2: ref(""),
};
const spinners = {
  buttonSignup: ref(false),
};
const isPasswordVisible1 = ref(false);
const isPasswordVisible2 = ref(false);

const messageError = {
  email: "Correo electronico no valido",
  required: "Campo requerido",
  text: "Solamente puede contener texto",
};

const rules = {
  form: {
    name: {
      required: helpers.withMessage(messageError.required, required),
      alpha: helpers.withMessage(
        messageError.text,
        helpers.regex(/^[a-zA-Z ]*$/)
      ),
    },
    user: {
      required: helpers.withMessage(messageError.required, required),
    },
    email: {
      required: helpers.withMessage(messageError.required, required),
      email: helpers.withMessage("Correo no valido", email),
    },
    password: {
      required: helpers.withMessage(messageError.required, required),
      minLength: helpers.withMessage(
        "La contraseña debe tener almenos una mayuscula, un numero y tener un tamaño de 8",
        helpers.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      ),
    },
    password2: {
      same: helpers.withMessage(
        "Las contraseñas no coinciden",
        sameAs(form.password)
      ),
    },
  },
};
const v$ = useVuelidate(rules, { form });

onBeforeRouteUpdate((to, from, next) => {
  getUserService({ graphql: { name: USER_NAME, fragment: "UserName" } })
    .then(() => {
      next("/");
    })
    .catch(() => {
      next();
    });
});

const addUser = async () => {
  spinners.buttonSignup.value = true;

  const name = form.name;
  const user = form.user;
  const email = form.email.value.replace(/\s+/g, "");
  const password = form.password;
  try {
    await userRegisterService({
      name,
      user,
      email,
      password,
    });
    alertConfirmaciónEmail();
    router.push("/login");
    clearInputs();
  } catch (e: any) {
    spinners.buttonSignup.value = false;
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
    spinners.buttonSignup.value = false;
  }
};

const clearInputs = () => {
  form.name.value = "";
  form.user.value = "";
  form.password.value = "";
  form.password2.value = "";
  form.email.value = "";
};

const alertConfirmaciónEmail = async () => {
  const alert = await alertController.create({
    header: "Alerta",
    subHeader: "Confirmación",
    message:
      "Hemos enviado un correo electrónico a <b>" +
      form.email +
      "</b> con un enlace para verificar tu identidad.",
    buttons: [
      {
        text: "Continuar",
        handler: () => {
          router.push("/login");
        },
      },
    ],
  });

  await alert.present();
};
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
