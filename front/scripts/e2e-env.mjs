// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Shared pieces of the E2E harness: the paths and the offline build
 * environment.
 *
 * The build environment lives here (and not in the build script) because
 * `scripts/e2e.mjs` spawns `vite build` DIRECTLY: a process chain of
 * `pnpm -> node -> node -> vite` is one level too deep for constrained
 * environments (the rayon thread pool of rolldown fails to initialize
 * with EAGAIN when the process/thread budget is exhausted), while
 * `pnpm -> node -> vite` works fine.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const viteBin = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");
export const cypressBin = path.join(projectRoot, "node_modules", "cypress", "bin", "cypress");

/**
 * The environment of the E2E build.
 *
 *   - `VITE_E2E_BYPASS_AUTH=1` lets the router reach guarded routes
 *     without an SSO session (the escape hatch in `src/router/index.ts`).
 *   - `VITE_API_URL` points at the LOCAL API, never at production. The
 *     specs stub every endpoint they touch with `cy.intercept`, so the
 *     requests never leave the machine.
 *   - SSO is disabled (empty URL), so the app boots in anonymous mode
 *     and never talks to an SSO server.
 *
 * The flags are passed through the environment instead of a committed
 * `.env.e2e` file: env files are gitignored in this repo, and the
 * values below are the only ones the E2E build needs.
 *
 * @returns {NodeJS.ProcessEnv}
 */
export function buildEnv() {
  return {
    ...process.env,
    VITE_E2E_BYPASS_AUTH: "1",
    VITE_API_URL: process.env.E2E_API_URL ?? "http://localhost:8004/api/v1",
    VITE_SSO_URL: "",
    VITE_SSO_FRONTEND_URL: "",
    VITE_SSO_CLIENT_ID: process.env.E2E_SSO_CLIENT_ID ?? "lifeline",
  };
}
