<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WakaTimeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::post('signup', [AuthController::class, 'signup'])->middleware('throttle:3,1');

        Route::middleware(['auth:api', 'throttle:api'])->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('user', [AuthController::class, 'user']);
        });
    });

    Route::middleware(['auth:api', 'throttle:api', 'is_verify_email'])->group(function () {
        Route::apiResource('events', EventController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('calendars', CalendarController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('tasks', TaskController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('documents', DocumentController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('notes', NoteController::class)->only(['index', 'store', 'update', 'destroy']);

        Route::get('wakatime-durations', [WakaTimeController::class, 'durations'])->middleware('throttle:30,1');

        Route::get('admin-tags', [TagController::class, 'adminTags']);
        Route::post('events/{eventId}/tags', [TagController::class, 'attachTag']);
        Route::delete('events/{eventId}/tags/{tagId}', [TagController::class, 'detachTag']);
    });
});
