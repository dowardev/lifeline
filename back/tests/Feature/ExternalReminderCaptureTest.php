<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Http\Middleware\ResolveCalendarOwner;
use App\Models\CalendarSource;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use App\Services\CalendarSyncService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * LBDS-268 phase 1: external reminder capture, persistence and API exposure.
 */
class ExternalReminderCaptureTest extends TestCase
{
    use RefreshDatabase;

    private const OWNER = 'test:sub';

    private function makeIcsSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'ics',
            'name' => 'Feed',
            'url' => encrypt('https://cal.example.com/feed.ics'),
        ])->save();

        return $source;
    }

    /**
     * A CalendarSyncService whose HTTP layer replays a canned ICS body.
     */
    private function serviceWithIcs(string $ics): CalendarSyncService
    {
        $client = new Client(['handler' => new MockHandler([new Response(200, [], $ics)])]);

        return new class($client) extends CalendarSyncService
        {
            public function __construct(private readonly Client $forcedClient) {}

            protected function httpClient(): Client
            {
                return $this->forcedClient;
            }
        };
    }

    public function test_ics_sync_persists_reminder_offsets(): void
    {
        $source = $this->makeIcsSource();
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"
            ."BEGIN:VEVENT\r\nUID:evt-1@example.com\r\n"
            ."DTSTART:20260920T120000Z\r\nDTEND:20260920T130000Z\r\n"
            ."SUMMARY:Standup\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT15M\r\nEND:VALARM\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT45M\r\nEND:VALARM\r\n"
            ."BEGIN:VALARM\r\nACTION:EMAIL\r\nTRIGGER:-P1D\r\nEND:VALARM\r\n"
            ."END:VEVENT\r\nEND:VCALENDAR\r\n";

        $result = $this->serviceWithIcs($ics)->syncSource($source);

        $this->assertTrue($result['ok'], (string) json_encode($result));
        $event = ExternalEvent::where('title', 'Standup')->firstOrFail();
        $this->assertSame([2700, 900], $event->reminder_offsets_seconds);
    }

    public function test_event_end_derived_from_duration_is_used_for_related_end(): void
    {
        $source = $this->makeIcsSource();
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"
            ."BEGIN:VEVENT\r\nUID:evt-duration@example.com\r\n"
            ."DTSTART:20260920T120000Z\r\nDURATION:PT2H\r\n"
            ."SUMMARY:Workshop\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;RELATED=END:-PT30M\r\nEND:VALARM\r\n"
            ."END:VEVENT\r\nEND:VCALENDAR\r\n";

        $result = $this->serviceWithIcs($ics)->syncSource($source);

        $this->assertTrue($result['ok'], (string) json_encode($result));
        $event = ExternalEvent::where('title', 'Workshop')->firstOrFail();
        // DURATION:PT2H ends at 14:00, so the alarm fires at 13:30, which is
        // 5400s after the 12:00 anchor (negative).
        $this->assertSame([-5400], $event->reminder_offsets_seconds);
    }

    private function makeCaldavTasksSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'caldav',
            'name' => 'Tasks',
            'url' => encrypt('https://cal.example.com/remote.php/dav'),
            'collections' => [[
                'href' => '/calendars/user/tasks/',
                'name' => 'Tasks',
                'type' => 'tasks',
                'subscribed' => true,
                'hidden' => false,
            ]],
        ])->save();

        return $source;
    }

    private function tasksMultistatus(string $ics): string
    {
        return '<?xml version="1.0" encoding="utf-8"?>'
            .'<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            .'<D:response><D:href>/calendars/user/tasks/todo.ics</D:href>'
            .'<D:propstat><D:prop><C:calendar-data><![CDATA['.$ics.']]></C:calendar-data></D:prop>'
            .'<D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'
            .'</D:multistatus>';
    }

    public function test_caldav_todo_start_trigger_uses_dtstart_and_stores_seconds_before_due(): void
    {
        $source = $this->makeCaldavTasksSource();
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\nUID:todo-1@example.com\r\n"
            ."DTSTART:20260920T090000Z\r\nDUE:20260920T170000Z\r\nSUMMARY:Task\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT30M\r\nEND:VALARM\r\n"
            ."END:VTODO\r\nEND:VCALENDAR\r\n";

        $result = $this->serviceWithIcs($this->tasksMultistatus($ics))->syncSource($source);

        $this->assertTrue($result['ok'], (string) json_encode($result));
        $task = ExternalTask::where('title', 'Task')->firstOrFail();
        $this->assertSame([30600], $task->reminder_offsets_seconds);
    }

    public function test_caldav_todo_related_end_trigger_is_kept_and_measured_against_due(): void
    {
        $source = $this->makeCaldavTasksSource();
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\nUID:todo-2@example.com\r\n"
            ."DUE:20260920T170000Z\r\nSUMMARY:Task\r\n"
            ."BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER;RELATED=END:-PT10M\r\nEND:VALARM\r\n"
            ."END:VTODO\r\nEND:VCALENDAR\r\n";

        $result = $this->serviceWithIcs($this->tasksMultistatus($ics))->syncSource($source);

        $this->assertTrue($result['ok'], (string) json_encode($result));
        $task = ExternalTask::where('title', 'Task')->firstOrFail();
        $this->assertSame([600], $task->reminder_offsets_seconds);
    }

    public function test_api_exposes_raw_offsets_and_derived_codes(): void
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'ics',
            'name' => 'Feed',
            'url' => encrypt('https://cal.example.com/feed.ics'),
        ])->save();

        ExternalEvent::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'with-reminders',
            'title' => 'With reminders',
            'date_start' => '2026-09-20 12:00:00',
            'reminder_offsets_seconds' => [2700, 900, 3600],
        ]);
        ExternalEvent::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'without-reminders',
            'title' => 'Without reminders',
            'date_start' => '2026-09-21 12:00:00',
        ]);
        ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'task-1',
            'title' => 'Task',
            'due_at' => '2026-09-20 12:00:00',
            'reminder_offsets_seconds' => [600],
        ]);

        // No test authenticates these routes with real SSO; the existing
        // pattern (CalendarSourceCollectionsUpdateTest) bypasses the owner
        // middleware and passes the owner explicitly.
        $events = $this->withoutMiddleware(ResolveCalendarOwner::class)
            ->getJson('/api/v1/external-events?calendar_owner='.self::OWNER);
        $events->assertOk()
            ->assertJsonPath('events.0.reminder_offsets_seconds', [2700, 900, 3600])
            ->assertJsonPath('events.0.reminders', ['15m', '1h'])
            ->assertJsonPath('events.1.reminder_offsets_seconds', [])
            ->assertJsonPath('events.1.reminders', []);

        $tasks = $this->withoutMiddleware(ResolveCalendarOwner::class)
            ->getJson('/api/v1/external-tasks?calendar_owner='.self::OWNER);
        $tasks->assertOk()
            ->assertJsonPath('tasks.0.reminder_offsets_seconds', [600])
            ->assertJsonPath('tasks.0.reminders', ['10m']);
    }
}
