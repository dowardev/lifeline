<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateUsersTable extends Migration
{
  /**
   * Run the migrations.
   *
   * @return void
   */
  public function up()
  {
    Schema::create('users', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('user');
      $table->string('email')->unique();
      $table->string('image_profile');
      $table->boolean('is_email_verified')->default(0);
      $table->timestamp('email_verified_at')->nullable();
      $table->string('password');
      $table->rememberToken();
      $table->timestamps();
    });
    DB::table('users')->insert([
      'name' => 'Gonzalo',
      'user' => 'dowar',
      'password' => bcrypt('3qKhQDNPQYgC5p'),
      'email' => 'dowar@disroot.org',
      'image_profile' => 'usuario.webp',
      'is_email_verified' => 1,
    ]);
  }

  /**
   * Reverse the migrations.
   *
   * @return void
   */
  public function down()
  {
    Schema::dropIfExists('users');
    Schema::dropIfExists('users');
  }
}
