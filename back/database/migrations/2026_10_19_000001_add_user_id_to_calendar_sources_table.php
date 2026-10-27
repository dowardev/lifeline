<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


use App\Models\CalendarSource;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calendar_sources', function (Blueprint $table) {
            // LBDS-305 - denormalized from `users.sso_sub` at the moment a
            // source is created. Lets the mirror observer avoid a `users`
            // lookup on every `CalendarSource` lifecycle event. Nullable
            // because guest sources (sso_sub starts with `guest:`) have
            // no `users` row; those rows stay NULL and the mirror observer
            // skips them (the picker stays empty for guests in v1).
            $table->unsignedBigInteger('user_id')->nullable()->after('sso_sub');
            $table->index('user_id');
        });

        // Backfill existing sources. The `CalendarSourceMirrorObserver`
        // is registered in `EventServiceProvider::boot()` (HTTP-time),
        // so it does not fire during `migrate`. `saveQuietly` is an
        // extra safety belt in case the registration ever leaks into
        // a console-time boot.
        $usersBySsoSub = User::pluck('id', 'sso_sub')->all();
        foreach (CalendarSource::whereNull('user_id')->get() as $source) {
            if (isset($usersBySsoSub[$source->sso_sub])) {
                $source->user_id = $usersBySsoSub[$source->sso_sub];
                $source->saveQuietly();
            }
        }
    }

    public function down(): void
    {
        Schema::table('calendar_sources', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
