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
import { isSSOAvailable } from "@/ssoClientAccessor";

// composables
import { useExternalSync } from "@/composables/useExternalSync";
import { useOutboxProcessor } from "@/db/outboxProcessor";

const systemController = new SystemController();
const themeController = new ThemeController();

// Sync external sources on launch and on every return to the foreground,
// gated by a minimum interval so this cannot hammer the providers. Runs in
// guest mode too: the API layer handles the guest token, so it must not sit
// behind the SSO check below.
useExternalSync();

// LBDS-231 - drain the outbox on launch + online / visibility events so
// writes enqueued while offline flush as soon as connectivity returns.
useOutboxProcessor();

// mounted
onMounted(async () => {
  themeController.setupThemeListener();

  const storedTheme = themeController.getTheme()
  if (storedTheme) {
    themeController.applyTheme({ theme: storedTheme })
  }

  // sync calendar
  // In anonymous mode (no SSO client) skip the sync toasts entirely so we
  // never show an error toast for an intentionally absent SSO.
  if (!isSSOAvailable()) return;

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
