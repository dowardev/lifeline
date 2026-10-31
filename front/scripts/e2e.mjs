// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * Runs the E2E suite end to end:
 *
 *   1. build  -> `vite build --mode e2e` with the offline flags
 *                (`VITE_E2E_BYPASS_AUTH=1`, local `VITE_API_URL`, no SSO),
 *   2. serve -> `vite preview` on http://localhost:4173,
 *   3. test  -> `cypress run` against that server.
 *
 * The preview server is started HERE (and not from the Cypress config)
 * because Cypress verifies `baseUrl` before the run starts: the server
 * has to be answering before Cypress boots.
 *
 * Every child process is tracked and killed on exit OR on an interrupt
 * (SIGINT / SIGTERM), so a Ctrl+C never leaves a `vite preview` holding
 * port 4173 (which would make the next run fail with `--strictPort`).
 *
 * Usage: node scripts/e2e.mjs [--open]
 */

import { spawn } from "node:child_process";
import path from "node:path";

import { buildEnv, cypressBin, projectRoot, viteBin } from "./e2e-env.mjs";
import { closeServer, startStaticServer } from "./static-server.mjs";

const previewPort = process.env.E2E_PREVIEW_PORT ?? "4173";
// The preview server is reached through 127.0.0.1 (and not "localhost"):
// "localhost" resolves to ::1 first on some hosts, and a stale preview
// listening on the IPv6 loopback would then answer the readiness check
// with someone else's build.
const previewHost = "127.0.0.1";
const previewUrl = `http://${previewHost}:${previewPort}`;
const serverReadyTimeoutMs = 60000;
const serverProbeTimeoutMs = 2000;
const buildTimeoutMs = Number(process.env.E2E_BUILD_TIMEOUT_MS ?? 10 * 60 * 1000);
const testTimeoutMs = Number(process.env.E2E_TEST_TIMEOUT_MS ?? 30 * 60 * 1000);
const killGraceMs = Number(process.env.E2E_KILL_GRACE_MS ?? 5000);

/** @type {import("node:child_process").ChildProcess[]} */
const children = [];

/**
 * The static server of the build, if it is running.
 *
 * It lives in the module scope so that EVERY exit path (success, error,
 * SIGINT, SIGTERM) can close it: a server left listening would make the
 * next run fail with EADDRINUSE.
 *
 * @type {import("node:http").Server | null}
 */
let server = null;

/**
 * Closes the static server, if there is one.
 *
 * @returns {Promise<void>}
 */
async function closeStaticServer() {
  if (!server) return;
  const current = server;
  server = null;
  await closeServer(current);
}

/**
 * Kills every child process this script started.
 *
 * @returns {void}
 */
function killChildren() {
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
}

/**
 * Kills every child and WAITS for them to exit, escalating to SIGKILL.
 *
 * `process.exit()` right after a SIGTERM can leave the `vite preview`
 * holding port 4173 (the very orphan this script has to avoid), so the
 * children are given a grace period to die before the harness exits.
 *
 * @param {{ graceMs: number }} params
 * @returns {Promise<void>}
 */
async function killChildrenAndWait(params) {
  killChildren();
  const pending = children.filter(
    (child) => child.exitCode === null && child.signalCode === null,
  );
  if (pending.length === 0) return;
  await Promise.race([
    Promise.all(
      pending.map(
        (child) =>
          new Promise((resolve) => {
            child.once("exit", resolve);
          }),
      ),
    ),
    new Promise((resolve) => setTimeout(resolve, params.graceMs)),
  ]);
  for (const child of pending) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
}

/**
 * Runs a command and resolves when it exits with code 0.
 *
 * @param {{ command: string, args: string[], timeoutMs: number, label: string }} params
 * @returns {Promise<void>}
 */
function run(params) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (action) => {
      if (settled) return;
      settled = true;
      action();
    };
    const child = spawn(params.command, params.args, {
      cwd: projectRoot,
      stdio: "inherit",
      env: params.env ?? process.env,
    });
    children.push(child);
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      settle(() =>
        reject(new Error(`${params.label} timed out after ${params.timeoutMs}ms`)),
      );
    }, params.timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      settle(() => reject(error));
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) settle(resolve);
      else {
        settle(() =>
          reject(
            new Error(
              `${params.label} exited with code ${code ?? "null"}: ${params.command} ${params.args.join(" ")}`,
            ),
          ),
        );
      }
    });
  });
}

/**
 * Tells whether the preview server answers with the app.
 *
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isServerUp(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(serverProbeTimeoutMs),
    });
    // The preview server answers 200 with the app shell. Anything else
    // (404, 500) means the server is up but NOT serving the build.
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Waits until the preview server answers.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The e2e preview server did not answer on ${url} within ${timeoutMs}ms.`);
}

/**
 * Builds, serves and tests.
 *
 * @returns {Promise<void>}
 */
async function main() {
  // 1. Build the app the specs run against. `vite build` is spawned
  // DIRECTLY (not through `scripts/build-e2e.mjs`): a chain of
  // `pnpm -> node -> node -> vite` is one process level too deep for
  // constrained environments, where the rayon thread pool of rolldown
  // then fails to initialize (EAGAIN) and the build dies with a cryptic
  // panic while loading the vite config.
  await run({
    command: process.execPath,
    args: [viteBin, "build", "--mode", "e2e"],
    timeoutMs: buildTimeoutMs,
    label: "the e2e build",
    env: buildEnv(),
  });

  // 2. Serve the build. The server runs IN this process (no `vite
  // preview` child): one process less matters in constrained
  // environments, where the build threads, the server and the browser
  // share the task budget of the cgroup.
  try {
    server = await startStaticServer({
      root: path.join(projectRoot, "dist"),
      host: previewHost,
      port: Number(previewPort),
    });
  } catch (error) {
    throw new Error(
      `The e2e server could not start on ${previewHost}:${previewPort}. ` +
        `Is something else using that port? (${error.message})`,
    );
  }
  try {
    await waitForServer(previewUrl, serverReadyTimeoutMs);
  } catch (error) {
    await closeStaticServer();
    await killChildrenAndWait({ graceMs: killGraceMs });
    throw error;
  }

  // 3. Run the suite. Extra arguments are forwarded to cypress (for
  // example `--browser chromium` or `--spec <file>`).
  const open = process.argv.includes("--open");
  const extraArgs = process.argv.slice(2).filter((arg) => arg !== "--open");
  const cypressArgs = open ? ["open", ...extraArgs] : ["run", ...extraArgs];
  const cypress = spawn(process.execPath, [cypressBin, ...cypressArgs], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  children.push(cypress);

  const code = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(124), testTimeoutMs);
    cypress.on("exit", (exitCode) => {
      clearTimeout(timer);
      resolve(exitCode ?? 1);
    });
  });
  // Stop accepting requests before the browser goes away, then release
  // the port.
  await closeStaticServer();
  await killChildrenAndWait({ graceMs: killGraceMs });
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    closeStaticServer()
      .then(() => killChildrenAndWait({ graceMs: killGraceMs }))
      .finally(() => {
        process.exit(130);
      });
  });
}

main().catch(async (error) => {
  console.error(error);
  await closeStaticServer();
  await killChildrenAndWait({ graceMs: killGraceMs });
  process.exit(1);
});
