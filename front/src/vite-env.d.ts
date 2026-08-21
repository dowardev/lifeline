// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare const __APP_VERSION__: string;

declare module "*.md" {
  import type { ComponentOptions } from "vue";
  const Component: ComponentOptions;
  export default Component;
}
