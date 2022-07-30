<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEvents extends Migration
{
  /**
   * Run the migrations.
   *
   * @return void
   */
  public function up()
  {
    Schema::create('events', function (Blueprint $table) {
      $table->increments('id');
      $table->integer('user_id')->unsigned();
      $table->string('title');
      $table->integer('calendar_id')->unsigned();
      $table->datetime('time_start')->nullable();
      $table->datetime('time_end')->nullable();
      $table->string('reminders')->nullable();
      $table->string('repeats')->nullable();
      $table->string('time_zone')->nullable();
      $table->string('guests')->nullable();
      $table->longText('notes')->nullable();
      $table->timestamps();

      $table
        ->foreign('user_id')
        ->references('id')
        ->on('users')
        ->onDelete('cascade');

      $table
        ->foreign('calendar_id')
        ->references('id')
        ->on('calendars')
        ->onDelete('cascade');
    });
  }

  /**
   * Reverse the migrations.
   *
   * @return void
   */
  public function down()
  {
    Schema::dropIfExists('event');
  }
}
