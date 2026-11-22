<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Models;

use App\Models\Concerns\HashesExternalUid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class ExternalTask extends Model
{
    use HashesExternalUid;

    protected $fillable = [
        'sso_sub',
        'calendar_source_id',
        'collection_href',
        'external_uid',
        'title',
        'status',
        'due_at',
        'time_zone',
        'description',
        'reminder_offsets_seconds',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'reminder_offsets_seconds' => 'array',
    ];

    public function source()
    {
        return $this->belongsTo(CalendarSource::class, 'calendar_source_id');
    }

    /**
     * The due date as an instant, read through the zone the row belongs to.
     *
     * `due_at` holds a wall clock, not a timestamp: the `datetime` cast
     * re-reads it in the application timezone, which is not the timezone the
     * task was due in. The raw value plus `time_zone` is the pair that
     * describes the instant.
     */
    public function dueAtInTimezone(): ?Carbon
    {
        $raw = $this->getRawOriginal('due_at');
        if ($raw === null || $raw === '') {
            return null;
        }

        $zone = $this->time_zone ?: (string) config('app.timezone', 'UTC');

        try {
            $due = Carbon::createFromFormat('Y-m-d H:i:s', $raw, $zone);
        } catch (\Throwable $e) {
            return null;
        }

        return $due === false ? null : $due;
    }
}
