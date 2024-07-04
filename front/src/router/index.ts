import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
// import HomePage from '../views/HomePage.vue'
import MainPage from "@/views/main/MainPage.vue";

import { UserController } from "@/js/userController";
import { User } from "@/utils/interfaces";

async function loadUser(): Promise<void> {
  const userController = new UserController();
  const queryName = "USER_MENU";
  const fragmentName = "UserMenu";

  try {
    await userController.loadUser({ queryName, fragmentName });
  } catch (error: any) {
    throw new Error(error.message);
  }
}

async function adminGuard(): Promise<true | "/"> {
  const userController = new UserController();
  await loadUser();
  const isAdmin = userController.refs.user.value.isAdmin;
  if (isAdmin == true) return true;
  return "/";
}

async function userLoggedGuard(): Promise<true | "/landing"> {
  const userController = new UserController();
  let value = "landing" as true | "/landing";
  try {
    await loadUser();
    const user = userController.refs.user.value.user;
    if (user) value = true;
  } catch (error) {
    console.error(error);
    value = "/landing";
  } finally {
    return value;
  }
}

async function userSignOutGuard(): Promise<true | "/" | undefined> {
  const userController = new UserController();
  let value = true as true | "/";
  try {
    await loadUser();
    const user = userController.refs.user.value.user;
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
    path: "/(.*)",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: MainPage,
  },
  {
    path: "/calendar",
    name: "CalendarPage",
    component: MainPage,
  },
  {
    path: "/signup",
    name: "SignUp",
    component: MainPage,
  },
  {
    path: "/login",
    name: "Login",
    component: MainPage,
  },
  {
    path: "/prueba",
    name: "PruebaPage",
    component: MainPage,
  },
  {
    path: "/document/:url",
    name: "DocumentPage",
    component: MainPage,
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
  },
  {
    path: "/tasks",
    name: "TasksPage",
    component: MainPage,
  },
  {
    path: "/integrations",
    name: "IntegrationsPage",
    component: MainPage,
  },
  {
    path: "/about",
    name: "AboutPage",
    component: MainPage,
  },
  {
    path: "/landing",
    name: "LandingPage",
    component: MainPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userController = new UserController();
  const queryName = "USER_MENU";
  const fragmentName = "UserMenu";
  let user = {} as User;
  const path = to.path;
  const authorizedRoutes = [
    "/home",
    "/calendar",
    "/document/:url",
    "/documents",
    "/tasks",
    "/integrations",
  ];
  const unauthorizedRoutes = ["/signup", "/login", "/landing"];
  const publicRoutes = ["/policies", "/about"];

  try {
    await userController.loadUser({ queryName, fragmentName });
  } catch (error: any) {
    if (
      error.message !=
        "Error: Query failed: SelectSQL: queryAll: no such table: Users" &&
      error.message != "No token found"
    ) {
      console.error(error);
    }
  }

  if (publicRoutes.includes(path)) return next();

  if (Object.keys(user).length > 0) {
    if (authorizedRoutes.includes(path)) return next();
    if (unauthorizedRoutes.includes(path)) return next("/home");
  }

  if (Object.keys(user).length <= 0) {
    if (unauthorizedRoutes.includes(path)) return next();
    return next("/landing");
  }
});

export default router;
