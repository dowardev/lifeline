<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

use App\Support\ExternalUidHash;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * LBDS-269 / R13 — the unique key of the external tables did not fit MySQL 8.
 *
 * `unique(calendar_source_id, collection_href(1024), external_uid(512))` needs
 * about 6144 bytes, above the 3072-byte InnoDB limit of MySQL 8 (it works on
 * the MariaDB in use, which does not enforce the same limit).
 *
 * The key is replaced by `unique(calendar_source_id, uid_hash)`, where
 * `uid_hash` is the SHA-256 of the collection href and the external uid. The
 * rows themselves are not rewritten and none is deleted: the hash is derived,
 * so a duplicate can only exist if the old index already allowed it (rows
 * without a collection, whose hash stays NULL — exactly the NULL semantics of
 * the old composite index).
 *
 * The `create_external_*` migrations are edited as well, so a fresh install
 * never creates the over-long index in the first place; this migration brings
 * the databases that already exist to the same shape.
 */
return new class extends Migration
{
    /**
     * @var array<string, array{old: string, new: string}>
     */
    private const TABLES = [
        'external_events' => ['old' => 'ext_events_source_uid_unique', 'new' => 'ext_events_source_uidhash_unique'],
        'external_tasks' => ['old' => 'ext_tasks_source_uid_unique', 'new' => 'ext_tasks_source_uidhash_unique'],
        'external_contacts' => ['old' => 'ext_contacts_source_uid_unique', 'new' => 'ext_contacts_source_uidhash_unique'],
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table => $indexes) {
            $this->addHashColumn($table);
            $this->backfillHashes($table);
            $this->dropWideUnique($table, $indexes['old']);
            $this->addHashUnique($table, $indexes['new']);
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table => $indexes) {
            if (Schema::hasIndex($table, $indexes['new'])) {
                Schema::table($table, function (Blueprint $blueprint) use ($indexes) {
                    $blueprint->dropUnique($indexes['new']);
                });
            }
            if (Schema::hasColumn($table, 'uid_hash')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropColumn('uid_hash');
                });
            }
            // The original index does not fit MySQL 8; restoring it there
            // fails on purpose, with the engine's own message.
            if (! Schema::hasIndex($table, $indexes['old'])) {
                Schema::table($table, function (Blueprint $blueprint) use ($indexes) {
                    $blueprint->unique(['calendar_source_id', 'collection_href', 'external_uid'], $indexes['old']);
                });
            }
        }
    }

    private function addHashColumn(string $table): void
    {
        if (Schema::hasColumn($table, 'uid_hash')) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) {
            $blueprint->string('uid_hash', 64)->nullable()->after('external_uid');
        });
    }

    /**
     * Fills the hash of every row that has a collection. Rows without one
     * keep a NULL hash, so the uniqueness rules do not change for them.
     */
    private function backfillHashes(string $table): void
    {
        DB::table($table)
            ->whereNotNull('collection_href')
            ->whereNull('uid_hash')
            ->chunkById(500, function ($rows) use ($table): void {
                foreach ($rows as $row) {
                    DB::table($table)
                        ->where('id', $row->id)
                        ->update([
                            'uid_hash' => ExternalUidHash::for($row->collection_href, $row->external_uid),
                        ]);
                }
            });
    }

    private function dropWideUnique(string $table, string $index): void
    {
        if (! Schema::hasIndex($table, $index)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index) {
            $blueprint->dropUnique($index);
        });
    }

    private function addHashUnique(string $table, string $index): void
    {
        if (Schema::hasIndex($table, $index)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index) {
            $blueprint->unique(['calendar_source_id', 'uid_hash'], $index);
        });
    }
};
