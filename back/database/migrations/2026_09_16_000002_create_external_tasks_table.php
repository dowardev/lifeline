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
        // External (synced) tasks — separate from local Task.php rows.
        Schema::create('external_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('sso_sub', 255);
            $table->foreignId('calendar_source_id')->constrained('calendar_sources')->cascadeOnDelete();
            $table->string('collection_href', 1024)->nullable();
            $table->string('external_uid', 512);
            $table->string('title', 512)->default('');
            $table->string('status', 64)->nullable();
            $table->dateTime('due_at')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['calendar_source_id', 'collection_href', 'external_uid'], 'ext_tasks_source_uid_unique');
            $table->index(['sso_sub']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_tasks');
    }
};
