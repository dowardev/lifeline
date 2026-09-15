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
        Schema::table('users', function (Blueprint $table) {
            $table->string('sso_sub')->nullable()->unique()->after('id');
            $table->string('name')->nullable()->change();
            $table->string('user')->nullable()->change();
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Advanced-encryption rows (sso_sub set, no contact fields) cannot
        // exist under the pre-remodel NOT NULL schema: drop only those.
        // Legacy rows (null sso_sub, address set) are left untouched.
        \Illuminate\Support\Facades\DB::table('users')
            ->whereNotNull('sso_sub')
            ->whereNull('email')
            ->delete();
        \Illuminate\Support\Facades\DB::table('users')->whereNull('name')->update(['name' => '']);
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['sso_sub']);
            $table->dropColumn('sso_sub');
            $table->string('name')->nullable(false)->change();
            // NOTE: user/email stay nullable on rollback. Both are UNIQUE and
            // may hold several NULLs, so a NOT NULL revert is unrepresentable
            // (any backfill to '' would violate the unique index). Forward
            // migrate is unaffected.
        });
    }
};
