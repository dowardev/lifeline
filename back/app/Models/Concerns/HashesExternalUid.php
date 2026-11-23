<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Models\Concerns;

use App\Support\ExternalUidHash;

/**
 * Keeps `uid_hash` in step with the identity columns of an external row.
 *
 * The hash is the indexed part of the unique key, so it must never be set by
 * hand: it is derived from `collection_href` + `external_uid` on every save.
 */
trait HashesExternalUid
{
    protected static function bootHashesExternalUid(): void
    {
        static::saving(function ($model): void {
            $model->uid_hash = ExternalUidHash::for(
                $model->collection_href,
                $model->external_uid
            );
        });
    }
}
