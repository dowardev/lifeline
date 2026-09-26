<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Seconds before the anchor as a sorted, capped JSON array. The anchor
        // is date_start for events and due_at for tasks. Canonical codes are
        // derived on read, never persisted, so a TRIGGER:-PT45M is preserved
        // as 2700 and still fires exactly.
        Schema::table('external_events', function (Blueprint $table) {
            $table->json('reminder_offsets_seconds')->nullable()->after('description');
        });

        Schema::table('external_tasks', function (Blueprint $table) {
            $table->json('reminder_offsets_seconds')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->dropColumn('reminder_offsets_seconds');
        });

        Schema::table('external_tasks', function (Blueprint $table) {
            $table->dropColumn('reminder_offsets_seconds');
        });
    }
};
