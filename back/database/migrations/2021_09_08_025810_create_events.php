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
            $table->integer('calendar_id')->unsigned()->default(1);
            $table->string('title');
            $table->datetime('date_start')->nullable();
            $table->datetime('date_end')->nullable();
            $table->string('notifications')->nullable();
            $table->string('repeat')->nullable();
            $table->string('time_zone')->nullable();
            $table->string('guests')->nullable();
            $table->longText('description')->nullable();
            $table->longText('availability')->nullable();
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
        Schema::dropIfExists('events');
    }
}
