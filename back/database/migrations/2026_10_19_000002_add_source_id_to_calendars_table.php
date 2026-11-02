<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calendars', function (Blueprint $table) {
            // LBDS-305 - link from the picker row back to its origin
            // source. Nullable so the existing local-only `calendars`
            // rows still work and so a disconnected mirror (the FK is
            // ON DELETE SET NULL) can survive without a source.
            //
            // Column type matches `calendar_sources.id` (`bigint
            // unsigned`), NOT `calendars.id` (`int unsigned`). A FK
            // column must match the referenced column's type, not
            // the local table's PK.
            $table->unsignedBigInteger('source_id')->nullable()->after('default');
            // LBDS-305 - the "ghost" flag. Set by
            // `CalendarSourceMirrorObserver::deleting` when the source
            // is removed. The row stays so existing `events.calendar_id`
            // still resolve; the picker filters archived rows out via
            // the `selectable` scope.
            $table->timestamp('archived_at')->nullable()->after('source_id');
            // F4 - UNIQUE, not a plain index: one source may have at
            // most ONE mirror row. The local rows keep `source_id` NULL,
            // and a MySQL/MariaDB unique index does not compare NULLs,
            // so the many local rows are not constrained. The FK is
            // `ON DELETE SET NULL`, so a disconnected source leaves
            // its mirror with `source_id = NULL` and the next source
            // can reuse the slot.
            $table->unique('source_id');
        });
        Schema::table('calendars', function (Blueprint $table) {
            $table->foreign('source_id')
                ->references('id')->on('calendar_sources')
                ->onDelete('set null');
        });

        // P2 - DB-level guarantee of at most one active default per user.
        // MySQL does NOT support partial unique indexes, so we use the
        // standard MySQL trick: a VIRTUAL generated column that yields
        // `user_id` when the row is an active default and NULL otherwise,
        // plus a UNIQUE index on it. NULLs are not compared by a MySQL
        // unique index, so only one active default per user is allowed
        // while non-default rows are unconstrained.
        //
        // The expression must be valid on both MySQL (production) and
        // SQLite (test DB is `:memory:`). SQLite supports generated
        // columns since 3.31.0 (2020) and treats the same NULL semantics
        // for unique indexes. We use a CASE expression compatible with
        // both dialects.
        //
        // Column: `default_user_id` = CASE WHEN `default` = 1 AND `archived_at` IS NULL THEN `user_id` ELSE NULL END
        // Unique index on `default_user_id` enforces the invariant.
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement(
                'ALTER TABLE `calendars` ADD COLUMN `default_user_id` BIGINT UNSIGNED AS ('
                .'CASE WHEN `default` = 1 AND `archived_at` IS NULL THEN `user_id` ELSE NULL END'
                .') VIRTUAL'
            );
            DB::statement('CREATE UNIQUE INDEX `calendars_default_user_id_unique` ON `calendars` (`default_user_id`)');
        } elseif ($driver === 'sqlite') {
            DB::statement(
                'ALTER TABLE `calendars` ADD COLUMN `default_user_id` INTEGER '
                .'GENERATED ALWAYS AS ('
                .'CASE WHEN `default` = 1 AND `archived_at` IS NULL THEN `user_id` ELSE NULL END'
                .') VIRTUAL'
            );
            DB::statement('CREATE UNIQUE INDEX `calendars_default_user_id_unique` ON `calendars` (`default_user_id`)');
        }
    }

    public function down(): void
    {
        // Every drop is guarded by an existence check, so `down()` is
        // idempotent and safe to run on a database where this
        // migration was applied before one of its pieces existed (the
        // generated column and the unique index are later additions
        // to this same migration file, and a database that ran the
        // earlier revision has the table WITHOUT them).
        $this->dropDefaultGuard();

        if ($this->columnExists('source_id')) {
            if ($this->foreignKeyExists('calendars', 'source_id')) {
                Schema::table('calendars', function (Blueprint $table) {
                    $table->dropForeign(['source_id']);
                });
            }
            // The index is UNIQUE (F4), so Laravel named it
            // `calendars_source_id_unique`. A database that ran an
            // earlier revision of this migration has the plain
            // `calendars_source_id_index` instead, so both are tried.
            foreach (['calendars_source_id_unique', 'calendars_source_id_index'] as $index) {
                if (! $this->indexExists($index)) {
                    continue;
                }
                if (DB::getDriverName() === 'sqlite') {
                    // SQLite has no `DROP INDEX ... ON table` form.
                    DB::statement('DROP INDEX `'.$index.'`');
                } else {
                    DB::statement('DROP INDEX `'.$index.'` ON `calendars`');
                }
            }
        }

        foreach (['source_id', 'archived_at'] as $column) {
            if (! $this->columnExists($column)) {
                continue;
            }
            Schema::table('calendars', function (Blueprint $table) use ($column) {
                $table->dropColumn($column);
            });
        }
    }

    /**
     * True when the `calendars` table has the given column.
     */
    private function columnExists(string $column): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            $row = DB::selectOne(
                'SELECT COUNT(*) AS c FROM information_schema.columns
                 WHERE table_schema = DATABASE() AND table_name = \'calendars\'
                 AND column_name = ?',
                [$column]
            );

            return (int) ($row->c ?? 0) > 0;
        }

        if ($driver === 'sqlite') {
            // `PRAGMA table_info` does NOT list GENERATED columns, so
            // the generated `default_user_id` would look absent. Only
            // `table_xinfo` reports them.
            $rows = DB::select('PRAGMA table_xinfo(`calendars`)');
            foreach ($rows as $row) {
                if (($row->name ?? null) === $column) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * True when the `calendars` table has the given index.
     */
    private function indexExists(string $index): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            $row = DB::selectOne(
                'SELECT COUNT(*) AS c FROM information_schema.statistics
                 WHERE table_schema = DATABASE() AND table_name = \'calendars\'
                 AND index_name = ?',
                [$index]
            );

            return (int) ($row->c ?? 0) > 0;
        }

        if ($driver === 'sqlite') {
            $rows = DB::select('PRAGMA index_list(`calendars`)');
            foreach ($rows as $row) {
                if (($row->name ?? null) === $index) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * True when the given column of the table carries a foreign key.
     */
    private function foreignKeyExists(string $table, string $column): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            $row = DB::selectOne(
                'SELECT COUNT(*) AS c FROM information_schema.KEY_COLUMN_USAGE
                 WHERE table_schema = DATABASE() AND table_name = ?
                 AND column_name = ? AND referenced_table_name IS NOT NULL',
                [$table, $column]
            );

            return (int) ($row->c ?? 0) > 0;
        }

        if ($driver === 'sqlite') {
            $rows = DB::select('PRAGMA foreign_key_list(`'.$table.'`)');
            foreach ($rows as $row) {
                if (($row->from ?? null) === $column) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Removes the `default_user_id` generated column and its unique
     * index, tolerating their absence.
     */
    private function dropDefaultGuard(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // MySQL/MariaDB have no `DROP ... IF EXISTS` for indexes or
            // columns, so check `information_schema` first.
            $index = DB::selectOne(
                'SELECT COUNT(*) AS c FROM information_schema.statistics
                 WHERE table_schema = DATABASE() AND table_name = \'calendars\'
                 AND index_name = \'calendars_default_user_id_unique\''
            );
            if ((int) ($index->c ?? 0) > 0) {
                DB::statement('DROP INDEX `calendars_default_user_id_unique` ON `calendars`');
            }

            if ($this->columnExists('default_user_id')) {
                DB::statement('ALTER TABLE `calendars` DROP COLUMN `default_user_id`');
            }

            return;
        }

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS `calendars_default_user_id_unique`');
            // SQLite requires the column to be dropped via ALTER TABLE ...
            // DROP COLUMN (supported since 3.35.0 / 2021).
            if ($this->columnExists('default_user_id')) {
                DB::statement('ALTER TABLE `calendars` DROP COLUMN `default_user_id`');
            }
        }
    }
};
