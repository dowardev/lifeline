<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalTask extends Model
{
    protected $fillable = [
        'sso_sub',
        'calendar_source_id',
        'collection_href',
        'external_uid',
        'title',
        'status',
        'due_at',
        'description',
    ];

    protected $casts = [
        'due_at' => 'datetime',
    ];

    public function source()
    {
        return $this->belongsTo(CalendarSource::class, 'calendar_source_id');
    }
}
