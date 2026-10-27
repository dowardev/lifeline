<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Calendar extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'default',
        'user_id',
        // LBDS-305 - mirror link to `calendar_sources.id`. Null for the
        // legacy local rows; non-null for rows that mirror an external
        // source. The lifecycle of this column is driven by
        // `CalendarSourceMirrorObserver`.
        'source_id',
        // LBDS-305 - non-null marks a mirror whose source has been
        // disconnected. The row stays so existing `events.calendar_id`
        // still resolve; the picker filters archived rows out.
        'archived_at',
    ];

    protected $casts = [
        'default' => 'boolean',
        'archived_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    /**
     * LBDS-305 - the external source this row mirrors, when any.
     * Null for legacy local rows. The inverse of
     * `CalendarSource::calendar()`.
     */
    public function source()
    {
        return $this->belongsTo(CalendarSource::class, 'source_id');
    }

    /**
     * LBDS-305 - rows the picker should still offer. A row is
     * selectable when it is not archived (the source is still
     * connected) AND, by virtue of the picker being a `calendars`
     * picker, the user owns it. This scope is the single place
     * that defines what "active" means for the picker so the UI
     * and any background jobs agree.
     */
    public function scopeSelectable($query)
    {
        return $query->whereNull('archived_at');
    }
}
