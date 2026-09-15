<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarSource extends Model
{
    protected $fillable = [
        'sso_sub',
        'sso_iss',
        'type',
        'name',
        'url',
        'username',
        'password',
        'color',
        'is_active',
        'last_synced_at',
        'last_error',
        'collections',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
        'collections' => 'array',
        'token_expires_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
    ];
}
