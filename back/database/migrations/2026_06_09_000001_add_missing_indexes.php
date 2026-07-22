<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('calendar_id');
            $table->index('date_start');
            $table->index('date_end');
        });

        Schema::table('calendars', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->index('event_id');
            $table->index('tag_id');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('order');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('document_id');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['date_start']);
            $table->dropIndex(['date_end']);
        });

        Schema::table('tags', function (Blueprint $table) {
            $table->dropIndex(['event_id']);
            $table->dropIndex(['tag_id']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['order']);
        });
    }
};
