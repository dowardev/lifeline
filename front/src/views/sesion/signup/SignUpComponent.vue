<template>
  <section class="center">
    <ion-card class="element-post-selected">
      <ion-card-content>
        <div class="center">
          <img :src="imageUserPath" alt="" class="imagen-usuario" />
        </div>

        <section>
          <!-- name -->
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
                    ref="inputName"
                    fill="outline"
                    label="Nombre"
                    label-placement="floating"
                    autocomplete="given-name"
                    type="text"
                    :error-text="v$.form.name.$errors[0]?.$message as string"
                    :class="[
                      v$.form.name.$errors.length == 0
                        ? 'ion-valid'
                        : 'ion-invalid',
                    ]"
                    :value="form.name"
                    @ion-input="form.name = $event.target.value as string"
                    @ion-focus="
                      ($refs.inputName as any).$el.classList.add('ion-touched');
                      v$.form.name.$touch();
                    "
                  ></ion-input>
                </div>
              </div>
            </ion-col>
          </ion-row>

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
                    ref="inputUser"
                    fill="outline"
                    label="Usuario"
                    label-placement="floating"
                    autocomplete="username"
                    type="text"
                    :error-text="v$.form.user.$errors[0]?.$message as string"
                    :class="[
                      v$.form.user.$errors.length == 0
                        ? 'ion-valid'
                        : 'ion-invalid',
                    ]"
                    :value="form.user"
                    @ion-input="form.user = $event.target.value as string"
                    @ion-focus="
                      ($refs.inputUser as any).$el.classList.add('ion-touched');
                      v$.form.user.$touch();
                    "
                  ></ion-input>
                </div>
              </div>
            </ion-col>
          </ion-row>

          <!-- email -->
          <ion-row>
            <ion-col size-xs="11" size="10">
              <div style="display: flex">
                <div>
                  <div style="display: flex; align-items: center; height: 50px">
                    <ion-button fill="clear" :disabled="true"
                      ><ion-icon :icon="mailOutline"></ion-icon
                    ></ion-button>
                  </div>
                </div>

                <div style="width: 100%">
                  <ion-input
                    ref="inputMail"
                    fill="outline"
                    label="Correo electronico"
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

          <!-- password 1 -->
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
                    autocomplete="new-password"
                    :type="isPasswordVisible1 ? 'text' : 'password'"
                    :error-text="
                      v$.form.password.$errors[0]?.$message as string
                    "
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
                      @click="
                        isPasswordVisible1 = !isPasswordVisible1.valueOf()
                      "
                    >
                      <ion-icon
                        :icon="
                          isPasswordVisible1.valueOf()
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

          <!-- password 2 -->
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
                    ref="inputPassword2"
                    fill="outline"
                    label="Repetir contraseña"
                    label-placement="floating"
                    :type="isPasswordVisible2 ? 'text' : 'password'"
                    :error-text="
                      form.password2 != form.password
                        ? 'Las contraseñas no coinciden'
                        : ''
                    "
                    :class="[
                      form.password2 == form.password
                        ? 'ion-valid'
                        : 'ion-invalid',
                    ]"
                    :value="form.password2"
                    @ion-input="form.password2 = $event.target.value as string"
                  ></ion-input>
                </div>

                <div>
                  <div style="display: flex; align-items: center; height: 50px">
                    <ion-button
                      slot="end"
                      fill="clear"
                      style="margin-top: 20px"
                      @click="
                        isPasswordVisible2 = !isPasswordVisible2.valueOf()
                      "
                    >
                      <ion-icon
                        :icon="
                          isPasswordVisible2.valueOf()
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

          <!-- button signup -->
          <div class="center ion-padding-bottom">
            <ion-button
              expand="block"
              :disabled="v$.$invalid || spinners.buttonSignup == true"
              @click="addUser()"
            >
              <ion-label v-if="spinners.buttonSignup == false">{{
                $t("message.signup")
              }}</ion-label>
              <ion-spinner
                v-if="spinners.buttonSignup == true"
                name="crescent"
              ></ion-spinner>
            </ion-button>
          </div>
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
          :disabled="spinners.buttonLogin"
          @click="login"
        >
          <ion-label v-if="spinners.buttonLogin == false"
            >Iniciar sesión</ion-label
          >
          <ion-spinner
            v-if="spinners.buttonLogin"
            name="crescent"
          ></ion-spinner>
        </ion-button>
      </ion-item>
    </div>
  </section>
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
import { computed, reactive, ref } from "vue";
import {
  eyeOutline,
  eyeOffOutline,
  chevronBackOutline,
  personOutline,
  mailOutline,
  fingerPrintOutline,
} from "ionicons/icons";
import useVuelidate from "@vuelidate/core";
import { required, email, helpers, sameAs } from "@vuelidate/validators";
import { useRouter } from "vue-router";

// controllers
import { SystemController } from "@/js/systemController";
import { UserController } from "@/js/userController";
const systemController = new SystemController();
const userController = new UserController();
const themeController = new ThemeController();

// assets
import userImage from "@/assets/otros/user.png";
import userImageGruvbox from "@/assets/otros/user-gruvbox.png";
import userImageCherry from "@/assets/otros/user-cherry.png";
import loginImageGruvbox from "@/assets/otros/login-gruvbox.jpg";
import loginImageCherry from "@/assets/otros/login-cherry.png";
import { ThemeController } from "@/js/themeController";

const router = useRouter();

const imageUserPath = computed(() => {
  const theme = themeController.getTheme();
  let image = "";
  if (theme == "nord" || "light") image = userImage;
  if (theme == "gruvbox") image = userImageGruvbox;
  if (theme == "cherry") image = userImageCherry;
  return image;
});

const loginImagePath = computed(() => {
  const theme = themeController.getTheme();
  let image = "";
  if (theme == "nord" || "light")
    image =
      "https://image.winudf.com/v2/image/Y29tLnNhcmFzLkJlc3RNaW5pbWFsaXN0V2FsbHBhcGVyX3NjcmVlbl81Xzk4dHZtbnNw/screen-5.jpg?h=800&fakeurl=1&type=.jpg";
  if (theme == "gruvbox") image = loginImageGruvbox;
  if (theme == "cherry") image = loginImageCherry;
  return image;
});

const form = reactive({
  user: "",
  name: "",
  email: "",
  password: "",
  password2: "",
});

const spinners = reactive({
  buttonSignup: false,
  buttonLogin: false,
});
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
        helpers.regex(/^[a-zA-Z ]*$/),
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
        "La contraseña debe tener almenos una mayúscula, un numero y tener un tamaño de 8",
        helpers.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
      ),
    },
    // password2: {
    //   same: helpers.withMessage(
    //     "Las contraseñas no coinciden",
    //     sameAs(form.password)
    //   ),
    // },
  },
};
const v$ = useVuelidate(rules, { form });

// functions
const addUser = async (): Promise<void> => {
  spinners.buttonSignup = true;

  const name = form.name;
  const user = form.user;
  const email = form.email.replace(/\s+/g, "");
  const password = form.password;
  try {
    await userController.register({
      name,
      user,
      email,
      password,
    });
    spinners.buttonSignup = false;
    alertConfirmaciónEmail();
    router.push("/login");
    clearInputs();
  } catch (e: any) {
    spinners.buttonSignup = false;
    if (e.message == "The email has already been selected") {
      systemController.openToast({
        message: "Correo ya en uso",
        color: "warning",
      });
      return;
    }
    if (e.message == "The user has already been selected") {
      systemController.openToast({
        message: "Usuario ya en uso",
        color: "warning",
      });
      return;
    }
    console.error(e);
    // systemController.openToastError(e);
  }
};

const clearInputs = () => {
  form.name = "";
  form.user = "";
  form.password = "";
  form.password2 = "";
  form.email = "";
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

const login = async () => {
  spinners.buttonLogin = true;
  await router.push("/login");
  spinners.buttonLogin = false;
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
