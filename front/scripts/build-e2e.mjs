// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Builds the frontend for the E2E suite.
 *
 * The suite runs against a PRODUCTION build served by `vite preview`
 * (see `cypress.config.ts`), so the build needs the offline flags
 * (`VITE_E2E_BYPASS_AUTH=1`, local API, no SSO) - see `e2e-env.mjs`.
 *
 * Usage: node scripts/build-e2e.mjs
 */

import { spawn } from "node:child_process";

import { buildEnv, projectRoot, viteBin } from "./e2e-env.mjs";

const buildTimeoutMs = Number(process.env.E2E_BUILD_TIMEOUT_MS ?? 10 * 60 * 1000);
const killGraceMs = Number(process.env.E2E_KILL_GRACE_MS ?? 5000);

const child = spawn(process.execPath, [viteBin, "build", "--mode", "e2e"], {
  cwd: projectRoot,
  env: buildEnv(),
  stdio: "inherit",
});

const timer = setTimeout(() => {
  child.kill("SIGTERM");
  console.error(`the e2e build timed out after ${buildTimeoutMs}ms`);
  process.exit(124);
}, buildTimeoutMs);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    // Wait for the build to die before exiting: exiting right after the
    // SIGTERM can leave the build running as an orphan.
    const grace = setTimeout(() => {
      child.kill("SIGKILL");
      process.exit(130);
    }, killGraceMs);
    child.once("exit", () => {
      clearTimeout(grace);
      process.exit(130);
    });
    child.kill("SIGTERM");
  });
}

child.on("exit", (code) => {
  clearTimeout(timer);
  process.exit(code ?? 1);
});
