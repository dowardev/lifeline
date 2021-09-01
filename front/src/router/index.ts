import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";
import Inicio from "../views/inicio/Inicio.vue";
import Eventos from "../views/inicio/eventos/Eventos.vue";
import Evento from "../views/inicio/eventos/evento/Evento.vue";
import Horario from "../views/inicio/eventos/evento/horario/Horario.vue";
import Repetir from "../views/inicio/eventos/evento/repetir/Repetir.vue";
import Register from "../views/sesion/register/Register.vue";
import Login from "../views/sesion/login/Login.vue";

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
    path: "/eventos",
    name: "Eventos",
    component: Eventos,
  },
  {
    path: "/evento",
    name: "Evento",
    component: Evento,
  },
  {
    path: "/horario",
    name: "Horario",
    component: Horario,
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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
