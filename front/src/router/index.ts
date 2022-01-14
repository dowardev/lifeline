import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";
import Inicio from "../views/inicio/Inicio.vue";
import Eventos from "../views/eventos/Eventos.vue";
import CreateEvent from "../views/eventos/evento/create/CreateEvent.vue";
import Horario from "../views/eventos/evento/horario/Horario.vue";
import Repetir from "../views/eventos/evento/repetir/Repetir.vue";
import Register from "../views/sesion/register/Register.vue";
import Login from "../views/sesion/login/Login.vue";
import Reminders from "../views/eventos/evento/reminder/Reminder.vue";
import Prueba from "../views/prueba/Prueba.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/inicio",
  },
  {
    path: "/home",
    name: "Home",
    component: Home,
  },
  {
    path: "/inicio",
    name: "Inicio",
    component: Inicio,
  },
  {
    path: "/eventos/:date",
    name: "Eventos",
    component: Eventos,
  },
  {
    path: "/evento/agregar",
    name: "CreateEvent",
    component: CreateEvent,
  },
  {
    path: "/event/update/:id",
    name: "UpdateEvent",
    component: CreateEvent,
  },
  {
    path: "/horario",
    name: "Horario",
    component: Horario,
  },
  {
    path: "/recordatorios",
    name: "Reminder",
    component: Reminders,
  },
  {
    path: "/repetir",
    name: "Repetir",
    component: Repetir,
  },
  {
    path: "/registro",
    name: "Register",
    component: Register,
  },
  {
    path: "/sesion",
    name: "Login",
    component: Login,
  },
  {
    path: "/prueba",
    name: "Prueba",
    component: Prueba,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
