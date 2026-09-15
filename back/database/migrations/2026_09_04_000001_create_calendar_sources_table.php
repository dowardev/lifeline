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
        Schema::create('calendar_sources', function (Blueprint $table) {
            $table->id();
            // SSO subject: stable user key from the token (works for advanced
            // accounts without email/username). No FK to users on purpose.
            $table->string('sso_sub', 255);
            $table->string('sso_iss', 255)->nullable();
            $table->string('type', 16);
            $table->string('name', 255);
            $table->text('url');
            $table->string('username', 255)->nullable();
            $table->text('password')->nullable();
            $table->string('color', 16)->default('#3880ff');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['sso_sub', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_sources');
    }
};
