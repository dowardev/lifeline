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
      $table->string('title');
      $table->integer('calendar_id')->unsigned();
      $table->datetime('time_start')->nullable();
      $table->datetime('time_end')->nullable();
      $table->string('reminders')->nullable();
      $table->string('repeats')->nullable();
      $table->string('guest')->nullable();
      $table->string('notes')->nullable();
      $table->timestamps();
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
