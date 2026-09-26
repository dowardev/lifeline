<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalEvent extends Model
{
    protected $fillable = [
        'sso_sub',
        'calendar_source_id',
        'collection_href',
        'external_uid',
        'title',
        'date_start',
        'date_end',
        'time_zone',
        'description',
        'reminder_offsets_seconds',
    ];

    protected $casts = [
        'date_start' => 'datetime',
        'date_end' => 'datetime',
        'reminder_offsets_seconds' => 'array',
    ];

    public function source()
    {
        return $this->belongsTo(CalendarSource::class, 'calendar_source_id');
    }
}
