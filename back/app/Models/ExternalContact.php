<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Models;

use App\Models\Concerns\HashesExternalUid;
use Illuminate\Database\Eloquent\Model;

class ExternalContact extends Model
{
    use HashesExternalUid;

    protected $fillable = [
        'sso_sub',
        'calendar_source_id',
        'collection_href',
        'external_uid',
        'display_name',
        'email',
        'phone',
    ];

    public function source()
    {
        return $this->belongsTo(CalendarSource::class, 'calendar_source_id');
    }
}
