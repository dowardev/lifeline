<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->json('id_reminders')->nullable()->after('repeat');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->json('notifications')->nullable()->after('subtasks');
            $table->json('id_reminders')->nullable()->after('notifications');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->json('notifications')->nullable()->after('reminder');
            $table->json('id_reminders')->nullable()->after('notifications');
        });

        // Backfill any NULL/empty JSON columns with the canonical empty array.
        DB::table('events')->whereNull('id_reminders')->orWhere('id_reminders', '')->update(['id_reminders' => '[]']);

        DB::table('tasks')->whereNull('notifications')->orWhere('notifications', '')->update(['notifications' => '[]']);
        DB::table('tasks')->whereNull('id_reminders')->orWhere('id_reminders', '')->update(['id_reminders' => '[]']);

        DB::table('notes')->whereNull('notifications')->orWhere('notifications', '')->update(['notifications' => '[]']);
        DB::table('notes')->whereNull('id_reminders')->orWhere('id_reminders', '')->update(['id_reminders' => '[]']);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('id_reminders');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['notifications', 'id_reminders']);
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['notifications', 'id_reminders']);
        });
    }
};