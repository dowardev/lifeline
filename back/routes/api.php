<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CalendarSourceController;
use App\Http\Controllers\ExternalEventController;
use App\Http\Controllers\GoogleOAuthController;
use App\Http\Controllers\CalendarSourceTestController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WakaTimeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('calendar-sources/google/callback', [GoogleOAuthController::class, 'callback']);

    Route::middleware(['sso.auth', 'sso.user', 'throttle:api'])->prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
    });

    Route::middleware(['calendar.owner', 'throttle:api'])->group(function () {
        // Stateless SSO (sub-based, no local users row required).
        Route::get('calendar-sources/guest-token', [CalendarSourceController::class, 'guestToken'])->middleware('throttle:30,1');
                Route::apiResource('calendar-sources', CalendarSourceController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('calendar-sources/test', CalendarSourceTestController::class)->middleware('throttle:6,1');
        Route::post('calendar-sources/{id}/discover', [CalendarSourceController::class, 'discover'])->middleware('throttle:6,1');
        Route::post('calendar-sources/{id}/sync', [CalendarSourceController::class, 'sync'])->middleware('throttle:6,1');
        Route::get('calendar-sources/google/authorize', [GoogleOAuthController::class, 'start'])->middleware('throttle:6,1');
        Route::get('external-events', [ExternalEventController::class, 'index']);
            Route::get('external-contacts', [ExternalEventController::class, 'contacts']);
            Route::get('external-tasks', [ExternalEventController::class, 'tasks']);
    });

    Route::middleware(['sso.auth', 'sso.user', 'throttle:api'])->group(function () {
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
