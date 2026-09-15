<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Support;

use Illuminate\Support\Str;

class GuestToken
{
    public const HEADER = 'X-Guest-Id';
    public const TOKEN_HEADER = 'X-Guest-Token';

    public static function issue(string $guestId): string
    {
        return $guestId . '.' . hash_hmac('sha256', $guestId, (string) config('app.key'));
    }

    public static function verify(string $token): ?string
    {
        $pos = strrpos($token, '.');
        if ($pos === false) {
            return null;
        }
        $guestId = substr($token, 0, $pos);
        if (! Str::isUuid($guestId)) {
            return null;
        }
        $expected = hash_hmac('sha256', $guestId, (string) config('app.key'));
        if (! hash_equals($expected, substr($token, $pos + 1))) {
            return null;
        }

        return $guestId;
    }
}
