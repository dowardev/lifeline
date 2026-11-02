<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Persistent journal of guest invitation sends. One row per (event, email)
 * guarantees at-most-one delivery of an invitation for that guest, even
 * under retries or concurrent requests: the UNIQUE(event_id, email) index
 * is claimed via insertOrIgnore before any mail is sent.
 */
class EventInvitationSend extends Model
{
    protected $fillable = [
        'event_id',
        'email',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
