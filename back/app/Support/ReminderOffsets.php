<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * Backend mirror of the frontend single source of truth for reminder offsets
 * (design D1, FR-1..FR-6). The canonical + legacy vocabularies and the
 * normalize semantics MUST stay in sync with front/src/utils/reminders.ts.
 */
class ReminderOffsets
{
    /** Canonical codes in canonical table order. */
    public const CANONICAL = ['at_time', '5m', '10m', '15m', '30m', '1h', '2h', '1d', '2d', '1w', '1mo'];

    /** Unambiguous legacy UI codes → canonical codes (migrate-on-touch). */
    public const LEGACY = [
        'just' => 'at_time',
        '5mb' => '5m',
        '10mb' => '10m',
        '15mb' => '15m',
        '30mb' => '30m',
        '1hb' => '1h',
        '2hb' => '2h',
        '1db' => '1d',
        '2db' => '2d',
        '1wb' => '1w',
        '1mtb' => '1mo',
        '1mb' => '1mo',
    ];

    /**
     * Normalize an arbitrary code set to canonical codes (FR-6):
     * legacy → canonical, unknown/empty dropped with a Log::warning,
     * duplicates collapsed, output in canonical table order.
     * Never crashes, never returns a code that could fire at an unintended offset.
     *
     * @param  string[]  $codes
     * @return string[]
     */
    public static function normalize(array $codes): array
    {
        $order = array_flip(self::CANONICAL);
        $seen = [];
        $result = [];

        foreach ($codes as $code) {
            if (! is_string($code) || trim($code) === '') {
                continue;
            }
            $code = trim($code);
            $canonical = self::LEGACY[$code] ?? $code;
            if (! isset($order[$canonical])) {
                Log::warning("Unknown reminder offset code dropped: {$code}");

                continue;
            }
            if (isset($seen[$canonical])) {
                continue;
            }
            $seen[$canonical] = true;
            $result[] = $canonical;
        }

        usort($result, fn ($a, $b) => $order[$a] <=> $order[$b]);

        return $result;
    }

    public static function isValid(string $code): bool
    {
        return in_array($code, self::CANONICAL, true);
    }
}