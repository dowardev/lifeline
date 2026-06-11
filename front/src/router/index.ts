import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
const MainPage = () => import("@/views/main/MainPage.vue");

import { useAuthStore } from "@/store/authStore";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: MainPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar",
    name: "CalendarPage",
    component: MainPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/signup",
    name: "SignUp",
    component: MainPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "Login",
    component: MainPage,
    meta: { requiresAuth: false },
  },
{
    path: "/document/:url",
    name: "DocumentPage",
    component: MainPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/policies",
    name: "PoliciesPage",
    component: MainPage,
    meta: { public: true },
  },
  {
    path: "/documents",
    name: "DocumentsPage",
    component: MainPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/tasks",
    name: "TasksPage",
    component: MainPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/integrations",
    name: "IntegrationsPage",
    component: MainPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/about",
    name: "AboutPage",
    component: MainPage,
    meta: { public: true },
  },
  {
    path: "/landing",
    name: "LandingPage",
    component: MainPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/home",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isLogged;
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isPublic = to.matched.some((record) => record.meta.public);

  if (isPublic) {
    return next();
  }

  if (requiresAuth && !isAuthenticated) {
    return next({ name: "Login" });
  }

  if (isAuthenticated && (to.name === "Login" || to.name === "SignUp")) {
    return next({ name: "home" });
  }

  return next();
});

export default router;
