import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import InicioPage from "../views/inicio/Inicio.vue";
import EventosPage from "../views/eventos/Eventos.vue";
import CreateEventPage from "../views/eventos/evento/create/CreateEvent.vue";
import RepetirPage from "../views/eventos/evento/repetir/Repetir.vue";
import SignUpPage from "../views/sesion/signup/SignUpPage.vue";
import LoginPage from "../views/sesion/login/Login.vue";
import RemindersPage from "../views/eventos/evento/reminder/Reminder.vue";
import PruebaPage from "../views/prueba/Prueba.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/inicio",
  },
  {
    path: "/inicio",
    name: "Inicio",
    component: InicioPage,
  },
  {
    path: "/eventos/:date",
    name: "Eventos",
    component: EventosPage,
  },
  {
    path: "/event/add",
    name: "CreateEvent",
    component: CreateEventPage,
  },
  {
    path: "/event/update/:id",
    name: "UpdateEvent",
    component: CreateEventPage,
  },
  {
    path: "/recordatorios",
    name: "Reminder",
    component: RemindersPage,
  },
  {
    path: "/repetir",
    name: "Repetir",
    component: RepetirPage,
  },
  {
    path: "/signup",
    name: "SignUp",
    component: SignUpPage,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/prueba",
    name: "Prueba",
    component: PruebaPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
