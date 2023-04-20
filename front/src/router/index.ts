import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import HomePage from "../views/home/HomePage.vue";
import CreateEventPage from "@/views/eventos/evento/create/CreateEvent.vue";
import RepetirPage from "@/views/eventos/evento/repetir/Repetir.vue";
import SignUpPage from "@/views/sesion/signup/SignUpPage.vue";
import LoginPage from "@/views/sesion/login/Login.vue";
import PruebaPage from "@/views/prueba/PruebaPage.vue";
import DocumentPage from "../components/documents/add_document/AddDocumentComponent.vue";
import PoliciesPage from "../views/policies/PoliciesPage.vue";
import DocumentsPage from "@/views/documents/DocumentsPage.vue";

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
  {
    path: "/prueba",
    name: "PruebaPage",
    component: PruebaPage,
  },
  {
    path: "/document/:url",
    name: "DocumentPage",
    component: DocumentPage,
  },
  {
    path: "/policies",
    name: "PoliciesPage",
    component: PoliciesPage,
  },
  {
    path: "/documents",
    name: "DocumentsPage",
    component: DocumentsPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
