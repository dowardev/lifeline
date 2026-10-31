#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>
#
# Installs the backend dependencies in CI.
#
# `back/composer.json` depends on the SSO server through a PATH
# repository that points to the sibling sso monorepo
# (`../../sso/packages/sso-server`). That directory does NOT exist in the
# CI runner: the runner only checks out this repository, so composer
# fails with "Source path ... is not found for package dowardev/sso-server".
#
# CI therefore resolves the same package from Packagist (it is published
# there), with the version the working tree uses locally (0.2.x), so the
# backend runs the same code in CI and in development.
#
# Usage: scripts/ci/backend-install.sh [extra composer install args]

set -eu

CI_PROJECT_DIR="${CI_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

cd "$CI_PROJECT_DIR/back"

php -r '
$file = "composer.json";
$json = json_decode(file_get_contents($file), true);
if (!is_array($json)) {
    fwrite(STDERR, "could not read composer.json\n");
    exit(1);
}
// The path repository (the sibling sso monorepo) does not exist here.
$json["repositories"] = array_values(array_filter(
    $json["repositories"] ?? [],
    fn ($repository) => ($repository["type"] ?? "") !== "path"
));
$json["require"]["dowardev/sso-server"] = "^0.2";
file_put_contents($file, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
'

# The lock file pins the path version of the package, so it has to be
# refreshed for that package only. Every other dependency keeps the
# resolution it already had.
composer update dowardev/sso-server --no-interaction --prefer-dist --no-progress "$@"
