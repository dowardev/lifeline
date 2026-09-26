<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Unit;

use App\Support\ExternalReminderParser;
use Illuminate\Foundation\Testing\TestCase;
use Sabre\VObject\Component\VEvent;
use Sabre\VObject\Reader;
use Tests\CreatesApplication;

class ExternalReminderParserTest extends TestCase
{
    use CreatesApplication;

    private function event(string $componentBody): VEvent
    {
        return Reader::read(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"
            ."BEGIN:VEVENT\r\nUID:test@example.com\r\n"
            .$componentBody
            ."END:VEVENT\r\nEND:VCALENDAR\r\n"
        )->VEVENT;
    }

    public function test_relative_trigger_before_start(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT15M\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [900],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_non_canonical_trigger_is_preserved_as_seconds(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT45M\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [2700],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_absolute_date_time_trigger_uses_its_own_value(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;VALUE=DATE-TIME:20260920T114500Z\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [900],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_email_action_is_ignored(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:EMAIL\r\nTRIGGER:-PT15M\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_related_end_is_computed_against_the_event_end(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\nDTEND:20260920T140000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;RELATED=END:-PT30M\r\nEND:VALARM\r\n"
        );

        // Fires at 13:30, which is 5400s AFTER the 12:00 anchor (negative).
        $this->assertSame(
            [-5400],
            ExternalReminderParser::forVEvent(
                $event,
                $event->DTSTART->getDateTime(),
                $event->DTEND->getDateTime()
            )
        );
    }

    public function test_related_end_with_unknown_end_is_skipped(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;RELATED=END:-PT30M\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_missing_anchor_returns_empty(): void
    {
        $event = $this->event(
            "SUMMARY:No start\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT15M\r\nEND:VALARM\r\n"
        );

        $this->assertSame([], ExternalReminderParser::forVEvent($event, null, null));
    }

    public function test_multiple_alarms_are_deduped_sorted_descending_and_capped(): void
    {
        $alarms = '';
        for ($minutes = 1; $minutes <= 12; $minutes++) {
            $alarms .= "BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT{$minutes}M\r\nEND:VALARM\r\n";
        }
        // Duplicate of the 5m alarm must collapse to a single entry.
        $alarms .= "BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT5M\r\nEND:VALARM\r\n";

        $event = $this->event("DTSTART:20260920T120000Z\r\n".$alarms);

        // The ten offsets CLOSEST to the anchor survive (1m..10m), stored
        // descending: the 11m and 12m alarms are furthest out and get dropped.
        $this->assertSame(
            [600, 540, 480, 420, 360, 300, 240, 180, 120, 60],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_todo_trigger_is_measured_against_due(): void
    {
        $calendar = Reader::read(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\nUID:todo@example.com\r\n"
            ."DUE:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT10M\r\nEND:VALARM\r\n"
            ."END:VTODO\r\nEND:VCALENDAR\r\n"
        );
        $todo = $calendar->VTODO;

        $this->assertSame(
            [600],
            ExternalReminderParser::forVTodo($todo, null, $todo->DUE->getDateTime())
        );
    }

    public function test_todo_start_trigger_anchors_on_dtstart_not_due(): void
    {
        $calendar = Reader::read(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\nUID:todo@example.com\r\n"
            ."DTSTART:20260920T090000Z\r\nDUE:20260920T170000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT30M\r\nEND:VALARM\r\n"
            ."END:VTODO\r\nEND:VCALENDAR\r\n"
        );
        $todo = $calendar->VTODO;

        // Fires at 08:30 against DTSTART; the stored value is seconds before
        // the client anchor DUE (17:00), i.e. 8h30m.
        $this->assertSame(
            [30600],
            ExternalReminderParser::forVTodo($todo, $todo->DTSTART->getDateTime(), $todo->DUE->getDateTime())
        );
    }

    public function test_todo_related_end_anchors_on_due(): void
    {
        $calendar = Reader::read(
            "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\nUID:todo@example.com\r\n"
            ."DUE:20260920T170000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;RELATED=END:-PT10M\r\nEND:VALARM\r\n"
            ."END:VTODO\r\nEND:VCALENDAR\r\n"
        );
        $todo = $calendar->VTODO;

        $this->assertSame(
            [600],
            ExternalReminderParser::forVTodo($todo, null, $todo->DUE->getDateTime())
        );
    }

    public function test_absolute_related_end_trigger_without_dtend_is_kept(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\n"
            ."TRIGGER;VALUE=DATE-TIME;RELATED=END:20260920T114500Z\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [900],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }

    public function test_malformed_and_empty_triggers_are_skipped(): void
    {
        $event = $this->event(
            "DTSTART:20260920T120000Z\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-P1M\r\nEND:VALARM\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:\r\nEND:VALARM\r\n"
        );

        $this->assertSame(
            [],
            ExternalReminderParser::forVEvent($event, $event->DTSTART->getDateTime(), null)
        );
    }
}
