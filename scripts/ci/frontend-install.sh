#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
#
# Installs the frontend dependencies in CI.
#
# `front/package.json` depends on the SSO client through a `link:` to the
# sibling `../../sso/packages/sso-client` directory (the consolidated sso
# monorepo). That directory does NOT exist in the CI runner: the runner
# only checks out this repository, so the link is dangling and the build
# cannot resolve the `@tu-org/sso-client` specifier the app imports.
#
# CI therefore resolves the same client from the npm registry, aliased to
# the `@tu-org/sso-client` specifier, so the import keeps working without
# changing the repository's dependency (which stays a local link for
# development).
#
# Usage: scripts/ci/frontend-install.sh [extra pnpm install args]

set -eu

CI_PROJECT_DIR="${CI_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# The version of the SSO client to resolve from npm. It is NOT defaulted
# on purpose: a missing or misspelled variable has to fail loudly instead
# of silently installing an old client. The value lives in .gitlab-ci.yml.
if [ -z "${CI_SSO_CLIENT_VERSION:-}" ]; then
  echo "CI_SSO_CLIENT_VERSION is not set: the version of @dowardev/sso-client to install is unknown." >&2
  echo "Set it (see the CI_SSO_CLIENT_VERSION variable in .gitlab-ci.yml)." >&2
  exit 1
fi
export CI_SSO_CLIENT_VERSION

cd "$CI_PROJECT_DIR/front"

node -e '
const fs = require("node:fs");
const version = process.env.CI_SSO_CLIENT_VERSION;
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.dependencies["@tu-org/sso-client"] = `npm:@dowardev/sso-client@${version}`;
fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
'

# The lockfile pins the `link:` spec, so it has to be refreshed after the
# patch above. Every other dependency keeps the resolution it already had.
pnpm install --no-frozen-lockfile "$@"
