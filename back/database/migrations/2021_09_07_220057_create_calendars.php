<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CreateCalendars extends Migration
{
  /**
   * Run the migrations.
   *
   * @return void
   */
  public function up()
  {
    Schema::create('calendars', function (Blueprint $table) {
      $table->increments('id');
      $table->string('name');
      $table->boolean('default')->default(false);
      $table->timestamps();
    });

    DB::table('calendars')->insert([
      'name' => 'Personal',
      'default' => true,
    ]);
  }

  /**
   * Reverse the migrations.
   *
   * @return void
   */
  public function down()
  {
    Schema::dropIfExists('calendars');
  }
}
