import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import HomePage from "@/views/home/HomePage.vue";
import CalendarPage from "@/views/calendar/CalendarPage.vue";
import SignUpPage from "@/views/sesion/signup/SignUpPage.vue";
import LoginPage from "@/views/sesion/login/LoginPage.vue";
import PruebaPage from "@/views/prueba/PruebaPage.vue";
import DocumentPage from "@/components/documents/add_document/AddDocumentComponent.vue";
import PoliciesPage from "@/views/policies/PoliciesPage.vue";
import DocumentsPage from "@/views/documents/DocumentsPage.vue";
import TasksPage from "../views/tasks/TasksPage.vue";
import IntegrationsPage from "../views/integrations/IntegrationsPage.vue";
import AboutPage from "../views/about/AboutPage.vue";

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
    path: "/calendar",
    name: "CalendarPage",
    component: CalendarPage,
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
    path: "/tasks",
    name: "TasksPage",
    component: TasksPage,
  },
  {
    path: "/integrations",
    name: "IntegrationsPage",
    component: IntegrationsPage,
  },
  {
    path: "/about",
    name: "AboutPage",
    component: AboutPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
