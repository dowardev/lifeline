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
import LandingPage from "../views/lading/LandingPage.vue";

import { useUser } from "@/composables/useUser";

async function loadUser(): Promise<void> {
  try {
    await useUser().loadUser();
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function adminGuard(): Promise<true | "/"> {
  await loadUser();
  const isAdmin = useUser().user.value.isAdmin;
  if (isAdmin == true) return true;
  return "/";
}

async function userLoggedGuard(): Promise<true | "/lading"> {
  try {
    await loadUser();
    const user = useUser().user.value.user;
    if (user) return true;
  } catch (error) {
    console.error(error);
    return "/lading";
  }
}

async function userSignOutGuard(): Promise<true | "/" | undefined> {
  try {
    await loadUser();
    const user = useUser().user.value.user;
    if (user) return "/";
  } catch (error) {
    return true;
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: HomePage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/calendar",
    name: "CalendarPage",
    component: CalendarPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/signup",
    name: "SignUp",
    component: SignUpPage,
    beforeEnter: async (to, from) => {
      return await userSignOutGuard();
    },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    beforeEnter: async (to, from) => {
      return await userSignOutGuard();
    },
  },
  {
    path: "/prueba",
    name: "PruebaPage",
    component: PruebaPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/document/:url",
    name: "DocumentPage",
    component: DocumentPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
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
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/tasks",
    name: "TasksPage",
    component: TasksPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/integrations",
    name: "IntegrationsPage",
    component: IntegrationsPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/about",
    name: "AboutPage",
    component: AboutPage,
  },
  {
    path: "/lading",
    name: "LandingPage",
    component: LandingPage,
    beforeEnter: async (to, from) => {
      return await userSignOutGuard();
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
