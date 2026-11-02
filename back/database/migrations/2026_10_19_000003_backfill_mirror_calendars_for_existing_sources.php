<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

use App\Models\Calendar;
use App\Models\CalendarSource;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // LBDS-305 - any source created BEFORE the observer was deployed
        // has no mirror row. This data migration creates one per source
        // that has a `user_id` set (guests are skipped by design).
        // Runs after the column migrations so the schema is ready.
        //
        // The `CalendarSource` observer is registered at app boot, not
        // during `migrate`, so no recursion risk. The
        // `where('source_id', $source->id)->exists()` guard makes this
        // migration idempotent (running it twice does nothing on the
        // second pass).
        //
        // F3 - assign `default = true` to the first mirror of each user
        // that does not already have an active default, replicating the
        // observer's rule (`default` active = `default = true AND
        // archived_at IS NULL`).
        $sources = CalendarSource::whereNotNull('user_id')
            ->orderBy('user_id')
            ->orderBy('id')
            ->get();

        $userHasActiveDefault = [];
        foreach ($sources as $source) {
            if (Calendar::where('source_id', $source->id)->exists()) {
                // Mirror already exists (idempotency guard). Check if it
                // is an active default and update our tracking.
                $existing = Calendar::where('source_id', $source->id)->first();
                if ($existing !== null && $existing->default && $existing->archived_at === null) {
                    $userHasActiveDefault[$source->user_id] = true;
                }

                continue;
            }

            $hasActiveDefault = $userHasActiveDefault[$source->user_id] ?? false;
            if (! $hasActiveDefault) {
                // Double-check the database in case a local calendar or
                // earlier migration run created an active default.
                $hasActiveDefault = Calendar::where('user_id', $source->user_id)
                    ->where('default', true)
                    ->whereNull('archived_at')
                    ->exists();
            }

            $mirror = new Calendar;
            $mirror->fill([
                'name' => $source->name,
                'user_id' => $source->user_id,
                'source_id' => $source->id,
                'default' => ! $hasActiveDefault,
            ])->save();

            if (! $hasActiveDefault) {
                $userHasActiveDefault[$source->user_id] = true;
            }
        }
    }

    public function down(): void
    {
        // Only mirror rows are removed. Local rows are untouched.
        //
        // `forceDelete()` and not `delete()`: `Calendar` uses SoftDeletes,
        // so a soft delete would leave the rows behind (only flagged
        // `deleted_at`). The re-run of `up()` checks
        // `Calendar::where('source_id', ...)->exists()`, and the
        // SoftDeletes global scope hides the soft-deleted rows from
        // that check, so the migration would create DUPLICATE mirrors
        // on the second run. A hard delete keeps the migration
        // reversible and re-runnable.
        Calendar::withTrashed()->whereNotNull('source_id')->forceDelete();
    }
};
