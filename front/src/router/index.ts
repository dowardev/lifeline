import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import HomePage from "@/views/home/HomePage.vue";
import MainPage from "@/views/main/MainPage.vue";
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
  let value = "lading" as true | "/lading";
  try {
    await loadUser();
    const user = useUser().user.value.user;
    if (user) value = true;
  } catch (error) {
    console.error(error);
    value = "/lading";
  } finally {
    return value;
  }
}

async function userSignOutGuard(): Promise<true | "/" | undefined> {
  let value = true as true | "/";
  try {
    await loadUser();
    const user = useUser().user.value.user;
    if (user) value = "/";
  } catch (error) {
    value = true;
  } finally {
    return value;
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "main",
    component: MainPage,
  },
  {
    path: "/home",
    name: "home",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/calendar",
    name: "CalendarPage",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/signup",
    name: "SignUp",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userSignOutGuard();
    },
  },
  {
    path: "/login",
    name: "Login",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userSignOutGuard();
    },
  },
  {
    path: "/prueba",
    name: "PruebaPage",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/document/:url",
    name: "DocumentPage",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/policies",
    name: "PoliciesPage",
    component: MainPage,
  },
  {
    path: "/documents",
    name: "DocumentsPage",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/tasks",
    name: "TasksPage",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/integrations",
    name: "IntegrationsPage",
    component: MainPage,
    beforeEnter: async (to, from) => {
      return await userLoggedGuard();
    },
  },
  {
    path: "/about",
    name: "AboutPage",
    component: MainPage,
  },
  {
    path: "/lading",
    name: "LandingPage",
    component: MainPage,
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
