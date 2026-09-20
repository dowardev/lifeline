// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { getSSOClientOrNull } from '@/ssoClientAccessor';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home/HomePage.vue'),
  },
  {
    path: '/calendar',
    name: 'CalendarPage',
    component: () => import('@/views/calendar/CalendarPage.vue'),
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/auth/AuthCallbackPage.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/SsoRedirectPage.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/SsoRedirectPage.vue'),
    meta: { public: true },
  },
  {
    path: '/document/:url',
    name: 'DocumentPage',
    component: () => import('@/views/documents/DocumentPage.vue'),
  },
  {
    path: '/policies',
    name: 'PoliciesPage',
    component: () => import('@/views/policies/PoliciesPage.vue'),
    meta: { public: true },
  },
  {
    path: '/documents',
    name: 'DocumentsPage',
    component: () => import('@/views/documents/DocumentsPage.vue'),
  },
  {
    path: '/tasks',
    name: 'TasksPage',
    component: () => import('@/views/tasks/TasksPage.vue'),
  },
  {
    path: '/integrations',
    name: 'IntegrationsPage',
    component: () => import('@/views/integrations/IntegrationsPage.vue'),
  },
  {
    path: '/calendars',
    redirect: '/settings/accounts',
  },
  {
    path: '/settings/calendar',
    redirect: '/settings/accounts',
  },
  {
    path: '/settings/accounts',
    name: 'AccountsPage',
    component: () => import('@/views/settings/AccountsPage.vue'),
  },
  {
    path: '/settings',
    name: 'SettingsPage',
    component: () => import('@/views/settings/SettingsPage.vue'),
  },
  {
    path: '/about',
    name: 'AboutPage',
    component: () => import('@/views/about/AboutPage.vue'),
    meta: { public: true },
  },
  {
    path: '/landing',
    name: 'LandingPage',
    component: () => import('@/views/lading/LandingPage.vue'),
    meta: { public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  // Only opt-in privileged routes require auth. Public and app-shell routes
  // are reachable anonymously so the app stays usable without SSO.
  const requiresAuth = to.meta?.requiresAuth === true;
  if (!requiresAuth) return next();

  // Test-only escape hatch so E2E can exercise guarded routes offline.
  const e2eBypass = import.meta.env.VITE_E2E_BYPASS_AUTH === '1';
  if (e2eBypass) return next();

  const ssoClient = getSSOClientOrNull();
  if (!ssoClient) return next();
  if (ssoClient.isAuthenticated) return next();

  await ssoClient.loginWithRedirect({
    redirectUri: `${window.location.origin}/auth/callback`,
  });
  return next(false);
});

export default router;
