<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarSource extends Model
{
    // P3 - every source type the system can hold. `google` is only
    // ever created server-side by the OAuth callback; see
    // `MANUAL_TYPES` for the ones a user can add from the UI.
    public const VALID_TYPES = ['google', 'caldav', 'ics'];

    // P3 - the types a user can create by hand from the "Cuentas"
    // panel. `google` is excluded on purpose: a Google source needs
    // the OAuth handshake and the Google API shape, so accepting it
    // from the generic endpoint would let a user create a source that
    // can never sync.
    public const MANUAL_TYPES = ['ics', 'caldav'];

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
        // LBDS-305 - denormalized from `users.sso_sub` at creation.
        // Lets the mirror observer avoid a `users` lookup on every
        // lifecycle event. Nullable for guest sources (no `users` row);
        // the observer skips those and no `calendars` row is mirrored.
        'user_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
        'collections' => 'array',
        'token_expires_at' => 'datetime',
        'user_id' => 'integer',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * LBDS-305 - the user this source belongs to. Null for guest
     * sources; the mirror observer treats null as "skip mirroring".
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * LBDS-305 - the `calendars` row that mirrors this source. The
     * inverse of `Calendar::source()`. `hasOne` (not `hasMany`)
     * because the mirror service creates at most one row per source.
     */
    public function calendar()
    {
        return $this->hasOne(Calendar::class, 'source_id');
    }

    /**
     * P3 - check if the source type is one of the supported kinds.
     * Does not throw; callers decide how to handle invalid types.
     */
    public function hasValidType(): bool
    {
        return in_array($this->type, self::VALID_TYPES, true);
    }
}
