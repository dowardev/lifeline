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
        Schema::table('calendar_sources', function (Blueprint $table) {
            // Discovered collections: [{href, name, type, subscribed}].
            $table->json('collections')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('calendar_sources', function (Blueprint $table) {
            $table->dropColumn('collections');
        });
    }
};
