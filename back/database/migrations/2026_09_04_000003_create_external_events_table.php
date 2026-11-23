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
        // Interim table keyed by SSO sub (no local users row required).
        // Designed to be merged into `events` once LBDS-230 lands.
        Schema::create('external_events', function (Blueprint $table) {
            $table->id();
            $table->string('sso_sub', 255);
            $table->foreignId('calendar_source_id')->constrained('calendar_sources')->cascadeOnDelete();
            $table->string('collection_href', 1024)->nullable();
            $table->string('external_uid', 512);
            // The indexed identity of the row (LBDS-269 / R13): the composite
            // key over the href and the uid does not fit MySQL 8's 3072-byte
            // InnoDB limit.
            $table->string('uid_hash', 64)->nullable();
            $table->string('title', 512)->default('');
            $table->dateTime('date_start')->nullable();
            $table->dateTime('date_end')->nullable();
            $table->string('time_zone', 64)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['calendar_source_id', 'uid_hash'], 'ext_events_source_uidhash_unique');
            $table->index(['sso_sub', 'date_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_events');
    }
};
