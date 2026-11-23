<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Support;

/**
 * Identity hash for the external sync tables.
 *
 * The unique key of an external row is `(calendar_source_id, collection_href,
 * external_uid)`, but `collection_href` is a 1024-character column and
 * `external_uid` a 512-character one: indexed together they need roughly
 * 6144 bytes, above the 3072-byte InnoDB limit of MySQL 8. The hash keeps the
 * key short enough for every supported engine.
 *
 * A row without a collection keeps a NULL hash on purpose: the old composite
 * index never treated two NULL hrefs as equal, and MySQL and SQLite both let
 * NULLs repeat inside a unique index.
 */
final class ExternalUidHash
{
    public static function for(?string $collectionHref, ?string $externalUid): ?string
    {
        if ($collectionHref === null) {
            return null;
        }

        return hash('sha256', $collectionHref."\0".(string) $externalUid);
    }
}
