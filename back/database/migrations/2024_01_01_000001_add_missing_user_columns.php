<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMissingUserColumns extends Migration
{
  public function up()
  {
    Schema::table('users', function (Blueprint $table) {
      if (!Schema::hasColumn('users', 'is_admin')) {
        $table->boolean('is_admin')->default(0);
      }
      if (!Schema::hasColumn('users', 'is_user_disabled')) {
        $table->boolean('is_user_disabled')->default(0);
      }
      if (!Schema::hasColumn('users', 'rol')) {
        $table->string('rol')->nullable();
      }
    });
  }

  public function down()
  {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn(['is_admin', 'is_user_disabled', 'rol']);
    });
  }
}
