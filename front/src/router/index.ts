import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import HomePage from "@/views/home/HomePage.vue";
import SignUpPage from "@/views/sesion/signup/SignUpPage.vue";
import LoginPage from "@/views/sesion/login/Login.vue";
import PruebaPage from "@/views/prueba/PruebaPage.vue";
import DocumentPage from "@/components/documents/add_document/AddDocumentComponent.vue";
import PoliciesPage from "@/views/policies/PoliciesPage.vue";
import DocumentsPage from "@/views/documents/DocumentsPage.vue";
import AdminEvent from "@/components/events/add/AddEventCompoenent.vue";

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
  {
    path: "/admin-event",
    name: "AdminEvent",
    component: AdminEvent,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
