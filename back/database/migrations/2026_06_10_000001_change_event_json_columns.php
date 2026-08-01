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
            $table->json('notifications')->nullable()->change();
            $table->json('repeat')->nullable()->change();
            $table->json('guests')->nullable()->change();
        });

        DB::table('events')->whereNull('notifications')->orWhere('notifications', '')->update(['notifications' => '[]']);
        DB::table('events')->whereNull('repeat')->orWhere('repeat', '')->update(['repeat' => '[]']);
        DB::table('events')->whereNull('guests')->orWhere('guests', '')->update(['guests' => '[]']);
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('notifications')->nullable()->change();
            $table->string('repeat')->nullable()->change();
            $table->string('guests')->nullable()->change();
        });
    }
};
