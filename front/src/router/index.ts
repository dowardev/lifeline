import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import HomePage from "../views/home/HomePage.vue";
import CreateEventPage from "@/views/eventos/evento/create/CreateEvent.vue";
import RepetirPage from "@/views/eventos/evento/repetir/Repetir.vue";
import SignUpPage from "@/views/sesion/signup/SignUpPage.vue";
import LoginPage from "@/views/sesion/login/Login.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: HomePage,
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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
