<!--
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
-->

<template>
    <ion-app>
    <ion-split-pane when="(min-width: 992px)" content-id="menu-content">
      <MenuComponent />
      <ion-router-outlet id="menu-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonSplitPane } from "@ionic/vue";
import { onMounted } from "vue";
import messages from "./utils/messages.json";

// components
import MenuComponent from "@/components/menu/MenuComponent.vue";

// controllers
import { SystemController } from "@/controllers/systemController";
import { AuthController } from "@/controllers/authController";
import { ThemeController } from "@/controllers/themeController";
const systemController = new SystemController();
const themeController = new ThemeController();

// mounted
onMounted(async () => {
  themeController.setupThemeListener();

  const storedTheme = themeController.getTheme()
  if (storedTheme) {
    themeController.applyTheme({ theme: storedTheme })
  }

  // sync calendar
  try {
    await systemController.openToast({
      message: messages.syncStart,
    });

    const userController = new AuthController();
    await userController.loadUser();

    await systemController.openToast({
      message: messages.syncEnd,
    });
  } catch (error) {
    console.error(error);
    await systemController.openToast({
      message: messages.syncError,
    });
  }

  try {
    // await deleteData();
  } catch (error: any) {
    console.error(error);
  }
});

// functions
</script>

<style>
@media (min-width: 992px) {
  ion-split-pane {
    --side-width: 300px;
  }
}
</style>
