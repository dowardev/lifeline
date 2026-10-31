// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { defineConfig } from "cypress";

/**
 * E2E harness.
 *
 * The suite runs against a PRODUCTION BUILD served by `vite preview`, not
 * against the Vite dev server: the dev server takes too long to fire the
 * `load` event on a cold cache (the specs died with "Your page did not fire
 * its `load` event within 60000ms"), and only a build can be produced with
 * the offline flags the specs need.
 *
 * The whole flow is driven by `scripts/e2e.mjs` (`pnpm run test:e2e`):
 *
 *   1. build  -> `vite build --mode e2e` with the offline flags
 *                (`VITE_E2E_BYPASS_AUTH=1`, local `VITE_API_URL`, no SSO),
 *   2. serve -> `vite preview` on http://localhost:4173,
 *   3. test  -> `cypress run` against that server.
 *
 * The preview server lives in the script (not here) because Cypress
 * verifies `baseUrl` BEFORE the run starts: the server has to be up before
 * Cypress boots.
 */

const PREVIEW_PORT = Number(process.env.E2E_PREVIEW_PORT ?? 4173);
// 127.0.0.1 (and not "localhost"): "localhost" resolves to ::1 first on
// some hosts, and a stale preview listening on the IPv6 loopback would
// then answer with someone else's build.
const PREVIEW_HOST = "127.0.0.1";

export default defineConfig({
  // The routed pages live in the shadow root of `ion-router-outlet`, so
  // the queries have to pierce shadow DOM to reach them.
  includeShadowDom: true,
  e2e: {
    supportFile: "tests/e2e/support/e2e.{js,jsx,ts,tsx}",
    specPattern: "tests/e2e/specs/**/*.cy.{js,jsx,ts,tsx}",
    videosFolder: "tests/e2e/videos",
    screenshotsFolder: "tests/e2e/screenshots",
    baseUrl: `http://${PREVIEW_HOST}:${PREVIEW_PORT}`,
    // The Ionic app takes a while to boot (bundle download + hydrate +
    // mount the router outlet). The 4s default is not enough: the
    // specs failed with "element never found" while the app was still
    // mounting.
    defaultCommandTimeout: 30000,
    pageLoadTimeout: 60000,
    viewportWidth: 1280,
    viewportHeight: 900,
  },
});
