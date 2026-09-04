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
        Schema::create('event_invitation_sends', function (Blueprint $table) {
            $table->id();
            // events.id is an unsigned integer (legacy `increments` column), so
            // this FK column deliberately matches that type instead of bigInt.
            $table->unsignedInteger('event_id');
            $table->string('email');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('event_id')
                ->references('id')
                ->on('events')
                ->cascadeOnDelete();

            $table->unique(['event_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_invitation_sends');
    }
};
