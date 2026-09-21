<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Support;

use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Support\Facades\Log;
use Sabre\VObject\Component\VAlarm;
use Sabre\VObject\Component\VEvent;
use Sabre\VObject\Component\VTodo;
use Sabre\VObject\DateTimeParser;

/**
 * Extracts the VALARM reminders of an external component as a list of
 * seconds before the component's anchor. The anchor is DTSTART for a VEVENT
 * and DUE for a VTODO. Positive = before the anchor, negative = after it.
 *
 * Only ACTION:DISPLAY alarms are considered; EMAIL (and any other action)
 * carries no notification this app can schedule. A malformed alarm never
 * aborts a sync run: it is skipped and logged.
 */
class ExternalReminderParser
{
    /** @var int */
    public const MAX_OFFSETS = 10;

    /**
     * @return int[] seconds before DTSTART
     */
    public static function forVEvent(VEvent $event, ?DateTimeInterface $start, ?DateTimeInterface $end): array
    {
        return self::parse($event, $start, $end);
    }

    /**
     * A VTODO has no separate end here: its anchor is DUE, so a RELATED=END
     * alarm has no resolvable reference and is skipped.
     *
     * @return int[] seconds before DUE
     */
    public static function forVTodo(VTodo $todo, ?DateTimeInterface $due): array
    {
        return self::parse($todo, $due, null);
    }

    /**
     * @return int[]
     */
    private static function parse(object $component, ?DateTimeInterface $anchor, ?DateTimeInterface $end): array
    {
        if ($anchor === null) {
            return [];
        }

        $offsets = [];
        foreach ($component->VALARM ?? [] as $alarm) {
            try {
                $offset = self::offsetFor($alarm, $anchor, $end);
                if ($offset !== null) {
                    $offsets[] = $offset;
                }
            } catch (\Throwable $e) {
                Log::warning('External reminder could not be parsed', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return self::finalize($offsets);
    }

    private static function offsetFor(VAlarm $alarm, DateTimeInterface $anchor, ?DateTimeInterface $end): ?int
    {
        if (strtoupper(trim((string) ($alarm->ACTION ?? ''))) !== 'DISPLAY') {
            return null;
        }
        if (! isset($alarm->TRIGGER)) {
            return null;
        }

        $trigger = $alarm->TRIGGER;
        $related = strtoupper(trim((string) ($trigger['RELATED'] ?? 'START')));
        $reference = $anchor;
        if ($related === 'END') {
            if ($end === null) {
                // Mis-timing a reminder is worse than dropping it.
                Log::warning('External reminder with RELATED=END skipped: event end unknown');

                return null;
            }
            $reference = $end;
        }

        $fire = self::fireTime($trigger, $reference);
        if ($fire === null) {
            return null;
        }

        return (int) round($anchor->getTimestamp() - $fire->getTimestamp());
    }

    private static function fireTime(mixed $trigger, DateTimeInterface $reference): ?DateTimeInterface
    {
        if ($trigger->getValueType() === 'DURATION') {
            // add() respects the interval sign, so a negative trigger moves the
            // fire time back in time. Month/year intervals resolve with the
            // real calendar length.
            return DateTimeImmutable::createFromInterface($reference)
                ->add(DateTimeParser::parseDuration((string) $trigger));
        }

        return DateTimeParser::parseDateTime(
            trim((string) $trigger),
            $reference->getTimezone()
        );
    }

    /**
     * Dedupe, sort descending (largest offset first) and cap.
     *
     * @param  int[]  $offsets
     * @return int[]
     */
    private static function finalize(array $offsets): array
    {
        $offsets = array_values(array_unique(array_map(static fn ($v) => (int) $v, $offsets)));
        rsort($offsets);

        return array_slice($offsets, 0, self::MAX_OFFSETS);
    }
}
