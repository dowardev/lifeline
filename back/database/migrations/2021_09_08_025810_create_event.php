<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEvent extends Migration
{
  /**
   * Run the migrations.
   *
   * @return void
   */
  public function up()
  {
    Schema::create('events', function (Blueprint $table) {
      $table->id();
      $table->string('title');
      $table->datetime('time_start')->nullable();
      $table->datetime('time_end')->nullable();
      $table->string('reminders')->nullable();
      $table->string('repeats')->nullable();
      $table->string('calendar')->nullable();
      $table->string('notes')->nullable();
      $table->string('tags')->nullable();
      $table->string('tasks')->nullable();
      $table->string('khanban')->nullable();
      $table->timestamps();
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
