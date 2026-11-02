<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Providers;

use App\Models\CalendarSource;
use App\Observers\CalendarSourceMirrorObserver;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    public function boot(): void
    {
        // LBDS-305 - the mirror observer keeps `calendars` in sync
        // with `calendar_sources` so the event modal's picker can
        // show external sources alongside local calendars. Registered
        // here (rather than in `AppServiceProvider`) because that is
        // the Laravel-idiomatic place for Eloquent observer wiring.
        CalendarSource::observe(CalendarSourceMirrorObserver::class);
    }
}
