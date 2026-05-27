<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\WakaTimeController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
 */

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
  return $request->user();
});

/* wakatime */
Route::get('wakatime-durations', [WakaTimeController::class, 'durations']);

Route::group(['prefix' => 'auth'], function () {
  Route::post('login', [AuthController::class, 'login']);
  Route::post('signup', [AuthController::class, 'signup']);

  Route::group(['middleware' => 'auth:api'], function () {
    Route::get('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    Route::post('create-event', [EventController::class, 'createEvent']);
    Route::get('get-events', [EventController::class, 'getEvents']);
    Route::post('update-event', [EventController::class, 'updateEvent']);
    Route::post('remove-event', [EventController::class, 'removeEvent']);

    Route::get('get-calendars', [CalendarController::class, 'getCalendars']);
  });
});
