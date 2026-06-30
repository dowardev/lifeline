import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";

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
    path: "/auth/callback",
    name: "AuthCallback",
    component: () => import("@/views/auth/AuthCallbackPage.vue"),
    meta: { public: true },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/LoginPage.vue"),
    meta: { public: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/auth/RegisterPage.vue"),
    meta: { public: true },
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
    meta: { public: true },
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

router.beforeEach(async (to, _from, next) => {
  const isPublic = to.meta?.public === true
  if (isPublic) return next()

  const { getSSOClient } = await import('@/ssoClientAccessor')
  const ssoClient = getSSOClient()
  if (!ssoClient.isAuthenticated) {
    await ssoClient.loginWithRedirect({
      redirectUri: `${window.location.origin}/auth/callback`,
    })
    return next(false)
  }
  return next()
})

export default router;
