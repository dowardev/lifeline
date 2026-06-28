import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";

import { useAuthStore } from "@/store/authStore";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: () => import("@/views/home/HomePage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar",
    name: "CalendarPage",
    component: () => import("@/views/calendar/CalendarPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/signup",
    name: "SignUp",
    component: () => import("@/views/sesion/SessionPage.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/sesion/SessionPage.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/session",
    name: "Session",
    component: () => import("@/views/sesion/SessionPage.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/document/:url",
    name: "DocumentPage",
    component: () => import("@/views/documents/DocumentPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/policies",
    name: "PoliciesPage",
    component: () => import("@/views/policies/PoliciesPage.vue"),
    meta: { public: true },
  },
  {
    path: "/documents",
    name: "DocumentsPage",
    component: () => import("@/views/documents/DocumentsPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tasks",
    name: "TasksPage",
    component: () => import("@/views/tasks/TasksPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/integrations",
    name: "IntegrationsPage",
    component: () => import("@/views/integrations/IntegrationsPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/about",
    name: "AboutPage",
    component: () => import("@/views/about/AboutPage.vue"),
    meta: { public: true },
  },
  {
    path: "/landing",
    name: "LandingPage",
    component: () => import("@/views/lading/LandingPage.vue"),
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

  if (isAuthenticated && (to.name === "Login" || to.name === "SignUp" || to.name === "Session")) {
    return next({ name: "home" });
  }

  return next();
});

export default router;
