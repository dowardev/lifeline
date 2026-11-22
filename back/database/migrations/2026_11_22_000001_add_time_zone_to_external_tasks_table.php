<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * LBDS-269 / R6 — `external_tasks.due_at` lost its timezone.
 *
 * The column stores the wall clock of the due date, exactly like every other
 * external datetime; what was missing was the name of the zone that wall
 * clock belongs to, so two tasks due "at 09:00" in different zones were
 * indistinguishable.
 *
 * Rows written before this migration stored their wall clock in the
 * application timezone, so that is the zone they are anchored to here. The
 * stored `due_at` values are NOT rewritten: only the new column is filled.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('external_tasks', 'time_zone')) {
            Schema::table('external_tasks', function (Blueprint $table) {
                $table->string('time_zone', 64)->nullable()->after('due_at');
            });
        }

        DB::table('external_tasks')
            ->whereNull('time_zone')
            ->update(['time_zone' => (string) config('app.timezone', 'UTC')]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('external_tasks', 'time_zone')) {
            Schema::table('external_tasks', function (Blueprint $table) {
                $table->dropColumn('time_zone');
            });
        }
    }
};
