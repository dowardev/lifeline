<template>
  <ion-page>
    <ion-header class="ion-no-border" mode="ios" :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="firstMenu" mode="md"></ion-menu-button>
        </ion-buttons>
        <ion-title>Blank</ion-title>
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
                  src="../../../public/assets/otros/user.svg"
                  alt=""
                  class="imagen-usuario"
                />
              </div>
            </ion-card-header>

            <ion-card-content>
              <ion-item>
                <ion-label position="floating">Nombre</ion-label>
                <ion-input v-model="name"></ion-input>
              </ion-item>
              <div class="error ion-padding" v-if="errorMessageName.length > 0">
                <p v-for="error in errorMessageName" :key="error">
                  {{ error }}
                </p>
              </div>

              <ion-item>
                <ion-label position="floating">Usuario</ion-label>
                <ion-input v-model="user"></ion-input>
              </ion-item>
              <div class="error ion-padding" v-if="errorMessageName.length > 0">
                <p v-for="error in errorMessageName" :key="error">
                  {{ error }}
                </p>
              </div>

              <ion-item>
                <ion-label position="floating">Correo electronico</ion-label>
                <ion-input v-model="email"></ion-input>
              </ion-item>
              <div class="error ion-padding" v-if="errorMessageMail.length > 0">
                <p v-for="error in errorMessageMail" :key="error">
                  {{ error }}
                </p>
              </div>

              <ion-item>
                <ion-label position="floating">Contraseña</ion-label>
                <ion-input
                  v-model="password"
                  :type="inputTypePassword1"
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
                class="error ion-padding"
                v-if="errorMessagePassword.length > 0"
              >
                <p *ngFor="let error of errorMessagePassword">{{ error }}</p>
              </div>

              <ion-item>
                <ion-label position="floating">Repite contraseña</ion-label>
                <ion-input
                  v-model="password2"
                  :type="inputTypePassword2"
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
                class="error ion-padding"
                v-if="errorMessagePassword2.length > 0"
              >
                <p *ngFor="let error of errorMessagePassword2">{{ error }}</p>
              </div>

              <ion-row>
                <ion-col size="12">
                  <ion-button
                    expand="block"
                    fill="clear"
                    v-on:click="register()"
                  >
                    Registrar
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
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
import sesion from "../../services/sesion.vue";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
export default defineComponent({
  name: "Register",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonInput,
  },
  setup() {
    const { userRegister } = sesion();
    return {
      userRegister,
      eyeOutline,
      eyeOffOutline,
    };
  },
  data() {
    return {
      segmentModel: "inicio",
      user: "",
      name: "",
      password: "",
      password2: "",
      email: "",
      errorMessageName: [],
      errorMessageMail: [],
      errorMessagePassword: [],
      errorMessagePassword2: [],
      inputTypePassword1: "password",
      inputTypePassword2: "password",
    };
  },
  methods: {
    async register() {
      const loading = await this.presentLoading();
      loading.present();
      const email = this.email.replace(/\s+/g, "");
      this.userRegister(this.name, this.user, email, this.password)
        .then(() => {
          loading.dismiss();
          // this.alertConfirmacionemail();
          this.clearInputs();
          this.$router.push("/");
          this.presentToast("Registrado correctamente", "success");
        })
        .catch((e) => {
          loading.dismiss();
          if (
            e.response.data.errors.email == "The email has already been taken."
          ) {
            this.presentToast("Correo ya en uso", "danger");
          }
        });
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
      this.name = "";
      this.user = "";
      this.password = "";
      this.password2 = "";
      this.email = "";
    },
    changeInputTypePassword1(type: string) {
      this.inputTypePassword1 = type;
    },
    changeInputTypePassword2(type: string) {
      this.inputTypePassword2 = type;
    },
    async alertConfirmacionemail() {
      const alert = await alertController.create({
        cssClass: "my-custom-class",
        header: "Alerta",
        subHeader: "Confirmacion",
        message:
          "Hemos enviado un correo electronico a " +
          this.email +
          " con un enlace para verificar tu identidad.",
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
