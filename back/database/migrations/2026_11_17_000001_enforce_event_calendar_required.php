<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * LBDS-292 - "an event never exists without a calendar".
 *
 * Three steps, in this order:
 *
 *   1. Every account gets a local default calendar ("Personal"). The
 *      database already guarantees AT MOST ONE active default per user
 *      (`calendars_default_user_id_unique`, LBDS-305); this migration
 *      guarantees AT LEAST ONE.
 *   2. The events that were persisted with `calendar_id IS NULL` (the
 *      LBDS-231 bug) are moved under their user's default calendar.
 *   3. The column becomes NOT NULL, so no future write can leave an event
 *      without a calendar.
 *
 * The default slot may be held by a MIRROR row (LBDS-305 created the
 * mirror with `default = 1` when the user had no default yet). The
 * protected default has to be local, so a mirror gives the slot up before
 * the local default is created.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->provisionDefaultCalendars();
        $this->reassignOrphanEvents();
        $this->makeCalendarIdRequired();
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedInteger('calendar_id')->nullable(true)->default(null)->change();
        });
    }

    /**
     * Creates the missing local default calendar for every account.
     */
    private function provisionDefaultCalendars(): void
    {
        $userIds = DB::table('users')->orderBy('id')->pluck('id');

        foreach ($userIds as $userId) {
            $hasLocalDefault = DB::table('calendars')
                ->where('user_id', $userId)
                ->where('default', 1)
                ->whereNull('archived_at')
                ->whereNull('source_id')
                ->whereNull('deleted_at')
                ->exists();

            if ($hasLocalDefault) {
                continue;
            }

            // A mirror is holding the default slot: hand it back so the
            // protected default is a local row.
            DB::table('calendars')
                ->where('user_id', $userId)
                ->where('default', 1)
                ->whereNull('archived_at')
                ->whereNotNull('source_id')
                ->whereNull('deleted_at')
                ->update(['default' => 0]);

            $hasActiveDefault = DB::table('calendars')
                ->where('user_id', $userId)
                ->where('default', 1)
                ->whereNull('archived_at')
                ->whereNull('deleted_at')
                ->exists();

            if ($hasActiveDefault) {
                continue;
            }

            DB::table('calendars')->insert([
                'user_id' => $userId,
                // Keep in sync with `DefaultCalendarService::DEFAULT_NAME`
                // ('Personal'). The literal is repeated on purpose: a
                // migration must not depend on an application class that
                // may change later.
                'name' => 'Personal',
                'default' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Moves every calendar-less event under its user's default calendar.
     * Soft-deleted rows count too: the column becomes NOT NULL for the
     * whole table.
     */
    private function reassignOrphanEvents(): void
    {
        // One query for the orphan events, one lookup per ACCOUNT (not per
        // event) and one UPDATE per account: a table with thousands of
        // orphans does not cost thousands of round trips.
        //
        // Soft-deleted rows count too: the column becomes NOT NULL for
        // the whole table, and the query builder does not apply the
        // model's soft delete scope.
        $orphanUserIds = DB::table('events')
            ->whereNull('calendar_id')
            ->distinct()
            ->pluck('user_id');

        foreach ($orphanUserIds as $userId) {
            $defaultCalendarId = DB::table('calendars')
                ->where('user_id', $userId)
                ->where('default', 1)
                ->whereNull('archived_at')
                ->whereNull('deleted_at')
                ->orderBy('id')
                ->value('id');

            if ($defaultCalendarId === null) {
                // The account has no calendar at all (its default could not
                // be provisioned): the row cannot satisfy NOT NULL. It is
                // removed rather than left dangling.
                DB::table('events')
                    ->whereNull('calendar_id')
                    ->where('user_id', $userId)
                    ->delete();

                continue;
            }

            DB::table('events')
                ->whereNull('calendar_id')
                ->where('user_id', $userId)
                ->update(['calendar_id' => $defaultCalendarId]);
        }
    }

    /**
     * `events.calendar_id` becomes NOT NULL.
     *
     * MySQL is altered in place; SQLite (the test database) cannot ALTER a
     * column in place, so Laravel rebuilds the table.
     */
    private function makeCalendarIdRequired(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `events` MODIFY `calendar_id` INT UNSIGNED NOT NULL');

            return;
        }

        Schema::table('events', function (Blueprint $table) {
            $table->unsignedInteger('calendar_id')->nullable(false)->change();
        });
    }
};
