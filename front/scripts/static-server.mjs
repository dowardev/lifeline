// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

/**
 * A minimal static file server for the E2E build.
 *
 * The harness serves the build itself instead of spawning `vite preview`:
 * one process less matters in constrained environments (the task budget
 * of a cgroup is shared between the build threads, the server and the
 * browser), and it removes the "port already in use" surprises of a
 * server that binds every interface.
 *
 * It behaves like the SPA fallback of `vite preview`: any GET that does
 * not match a file of the build answers the app shell, so the
 * client-side routes (/calendar, /home, ...) work.
 *
 * The server only ever serves files INSIDE the build directory: the
 * resolved real path of every request is checked against the resolved
 * real path of the root, so neither `..` nor a symlink can escape.
 */

import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const MIME_TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".eot": "application/vnd.ms-fontobject",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

/**
 * Tells whether a path is inside a directory.
 *
 * @param {string} root
 * @param {string} candidate
 * @returns {boolean}
 */
function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

/**
 * Resolves a request path to a file of the build.
 *
 * @param {string} root real path of the build directory
 * @param {string} urlPath
 * @returns {Promise<string | null>} the real path of the file, or null
 */
async function resolveFile(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }
  const candidate = path.resolve(root, `.${path.posix.normalize(decoded)}`);
  if (!isInside(root, candidate)) return null;

  let real;
  try {
    real = await realpath(candidate);
  } catch {
    return null;
  }
  // The real path is what will be read: a symlink inside the build that
  // points outside of it is rejected here.
  if (!isInside(root, real)) return null;

  try {
    const info = await stat(real);
    if (info.isFile()) return real;
    if (info.isDirectory()) {
      const index = path.join(real, "index.html");
      const indexInfo = await stat(index);
      if (indexInfo.isFile()) return index;
    }
  } catch {
    // not a file: the SPA fallback answers
  }
  return null;
}

/**
 * Answers one request.
 *
 * @param {import("node:http").IncomingMessage} request
 * @param {import("node:http").ServerResponse} response
 * @param {string} realRoot
 * @returns {Promise<void>}
 */
async function handleRequest(request, response, realRoot) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.statusCode = 405;
    response.end();
    return;
  }

  const file = await resolveFile(realRoot, request.url ?? "/");
  const target = file ?? path.join(realRoot, "index.html");
  response.setHeader(
    "Content-Type",
    MIME_TYPES[path.extname(target)] ?? "application/octet-stream",
  );
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(target);
  // A client that disconnects mid-stream must not leave the file
  // descriptor open.
  response.on("close", () => {
    stream.destroy();
  });
  stream.on("error", () => {
    if (!response.headersSent) response.statusCode = 500;
    response.end();
  });
  stream.pipe(response);
}

/**
 * Starts the static server.
 *
 * @param {{ root: string, host: string, port: number }} params
 * @returns {Promise<import("node:http").Server>}
 */
export function startStaticServer(params) {
  return new Promise((resolve, reject) => {
    // The root is resolved to its real path: the containment checks are
    // done against it, so a symlinked build directory still works.
    realpath(params.root).then(
      (realRoot) => {
        const server = createServer((request, response) => {
          handleRequest(request, response, realRoot).catch(() => {
            if (!response.headersSent) response.statusCode = 500;
            response.end();
          });
        });
        server.once("error", reject);
        server.listen(params.port, params.host, () => resolve(server));
      },
      reject,
    );
  });
}

/**
 * Closes a server and waits for its connections to drain.
 *
 * @param {import("node:http").Server} server
 * @returns {Promise<void>}
 */
export function closeServer(server) {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => resolve());
    // Idle keep-alive sockets would keep the server open.
    server.closeIdleConnections?.();
  });
}
