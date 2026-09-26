<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Support;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Illuminate\Support\Facades\Log;
use Sabre\VObject\Component\VAlarm;
use Sabre\VObject\Component\VEvent;
use Sabre\VObject\Component\VTodo;
use Sabre\VObject\DateTimeParser;

/**
 * Extracts the VALARM reminders of an external component as a list of
 * seconds before the component's client scheduling anchor. Positive = before
 * the anchor, negative = after it.
 *
 * The persisted `reminder_offsets_seconds` value always means "seconds before
 * the anchor the client schedules from": `date_start` for events and `due_at`
 * for tasks. To produce it, this parser first derives the RFC 5545-correct
 * absolute fire time using the proper reference and `RELATED`:
 *
 *  - VEVENT: `RELATED=START` (the default) is relative to DTSTART and
 *    `RELATED=END` to DTEND/DURATION-derived end.
 *  - VTODO: `RELATED=START` (the default) is relative to DTSTART, falling
 *    back to DUE when DTSTART is absent; `RELATED=END` is relative to DUE.
 *
 * The fire time is then converted to seconds before that client anchor. For a
 * VTODO the anchor is DUE, so a VTODO without DUE has nothing the client can
 * schedule from and yields no offsets.
 *
 * Only ACTION:DISPLAY alarms are considered; EMAIL (and any other action)
 * carries no notification this app can schedule. A malformed alarm never
 * aborts a sync run: it is skipped and logged.
 *
 * RFC 5545 `dur-value` supports only W/D/H/M/S, where `M` is minutes:
 * `P1M`/`P1Y` are not valid durations, so an alarm using them is skipped and
 * logged. Absolute `VALUE=DATE-TIME` triggers are knowable regardless of any
 * reference, so a missing reference only drops duration triggers.
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
        return self::parse($event, $start, $start, $end);
    }

    /**
     * @return int[] seconds before DUE
     */
    public static function forVTodo(VTodo $todo, ?DateTimeInterface $start, ?DateTimeInterface $due): array
    {
        // RELATED=START resolves against DTSTART when present, otherwise DUE;
        // RELATED=END always resolves against DUE. The client anchor is DUE.
        return self::parse($todo, $due, $start ?? $due, $due);
    }

    /**
     * @return int[]
     */
    private static function parse(
        object $component,
        ?DateTimeInterface $anchor,
        ?DateTimeInterface $startRef,
        ?DateTimeInterface $endRef
    ): array {
        if ($anchor === null) {
            return [];
        }

        $offsets = [];
        foreach ($component->VALARM ?? [] as $alarm) {
            try {
                $offset = self::offsetFor($alarm, $anchor, $startRef, $endRef);
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

    private static function offsetFor(
        VAlarm $alarm,
        DateTimeInterface $anchor,
        ?DateTimeInterface $startRef,
        ?DateTimeInterface $endRef
    ): ?int {
        if (strtoupper(trim((string) ($alarm->ACTION ?? ''))) !== 'DISPLAY') {
            return null;
        }
        if (! isset($alarm->TRIGGER)) {
            return null;
        }

        $trigger = $alarm->TRIGGER;
        $related = strtoupper(trim((string) ($trigger['RELATED'] ?? 'START')));

        // Decide the trigger kind before requiring a reference: an absolute
        // VALUE=DATE-TIME trigger is knowable even when the reference is
        // unknown. fireTime() only demands a reference for durations.
        $fire = self::fireTime($trigger, $related === 'END' ? $endRef : $startRef);
        if ($fire === null) {
            return null;
        }

        return (int) round($anchor->getTimestamp() - $fire->getTimestamp());
    }

    private static function fireTime(mixed $trigger, ?DateTimeInterface $reference): ?DateTimeInterface
    {
        if ($trigger->getValueType() === 'DURATION') {
            if ($reference === null) {
                // Mis-timing a reminder is worse than dropping it.
                Log::warning('External reminder with a duration trigger skipped: reference time unknown');

                return null;
            }

            // RFC 5545 dur-value has only W/D/H/M/S: M is minutes. P1M/P1Y
            // are not valid dur-values, so parseDuration rejects them and the
            // caller skips and logs the alarm.
            return DateTimeImmutable::createFromInterface($reference)
                ->add(DateTimeParser::parseDuration((string) $trigger));
        }

        return DateTimeParser::parseDateTime(
            trim((string) $trigger),
            $reference?->getTimezone() ?? new DateTimeZone('UTC')
        );
    }

    /**
     * Dedupe, keep the ten offsets closest to the anchor (smallest absolute
     * distance to 0), then sort descending (largest offset first).
     *
     * @param  int[]  $offsets
     * @return int[]
     */
    private static function finalize(array $offsets): array
    {
        $offsets = array_values(array_unique(array_map(static fn ($v) => (int) $v, $offsets)));

        usort($offsets, static fn ($a, $b) => abs($a) <=> abs($b));
        $offsets = array_slice($offsets, 0, self::MAX_OFFSETS);

        rsort($offsets);

        return $offsets;
    }
}
