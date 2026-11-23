<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Http\Middleware\ResolveCalendarOwner;
use App\Models\CalendarSource;
use App\Models\ExternalTask;
use App\Services\CalendarSyncService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * LBDS-269 / R6 — `external_tasks.due_at` lost its timezone.
 *
 * The column stores a wall clock; the zone that wall clock belongs to was
 * dropped on the way in, so two tasks due at "09:00" in different zones were
 * the same value.
 */
class Lbds269TaskTimezoneTest extends TestCase
{
    use RefreshDatabase;

    private const OWNER = 'test:sub';

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

    private function tasksMultistatus(string $ics): string
    {
        return '<?xml version="1.0" encoding="utf-8"?>'
            .'<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">'
            .'<D:response><D:href>/calendars/user/tasks/todo.ics</D:href>'
            .'<D:propstat><D:prop><C:calendar-data><![CDATA['.$ics.']]></C:calendar-data></D:prop>'
            .'<D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'
            .'</D:multistatus>';
    }

    public function test_caldav_task_keeps_the_timezone_of_its_due_date(): void
    {
        $source = $this->makeCaldavTasksSource();
        $ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VTODO\r\nUID:todo-tz@example.com\r\n"
            ."DUE;TZID=America/New_York:20260115T090000\r\nSUMMARY:Task\r\n"
            ."END:VTODO\r\nEND:VCALENDAR\r\n";

        $result = $this->serviceWithIcs($this->tasksMultistatus($ics))->syncSource($source);

        $this->assertTrue($result['ok'], (string) json_encode($result));
        $task = ExternalTask::where('title', 'Task')->firstOrFail();
        $this->assertSame('America/New_York', $task->time_zone);
        $this->assertSame('2026-01-15 09:00:00', $task->getRawOriginal('due_at'));
        // The instant is the wall clock read in its own zone.
        $this->assertSame(
            '2026-01-15T09:00:00-05:00',
            $task->dueAtInTimezone()?->toIso8601String()
        );
    }

    public function test_google_due_date_is_split_into_wall_clock_and_zone(): void
    {
        $service = new CalendarSyncService;
        $method = new \ReflectionMethod($service, 'dueParts');
        $method->setAccessible(true);

        $this->assertSame(
            ['2026-01-15 23:59:00', '-03:00'],
            $method->invoke($service, '2026-01-15T23:59:00-03:00')
        );
        $this->assertSame(
            ['2026-01-15 23:59:00', 'UTC'],
            $method->invoke($service, '2026-01-15T23:59:00Z')
        );
        $this->assertSame([null, null], $method->invoke($service, null));
    }

    public function test_api_returns_a_timezone_aware_due_date(): void
    {
        $source = $this->makeCaldavTasksSource();
        ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'task-tz',
            'title' => 'Task',
            'due_at' => '2026-01-15 09:00:00',
            'time_zone' => 'America/New_York',
        ]);

        $tasks = $this->withoutMiddleware(ResolveCalendarOwner::class)
            ->getJson('/api/v1/external-tasks?calendar_owner='.self::OWNER);

        $tasks->assertOk()
            ->assertJsonPath('tasks.0.due_at', '2026-01-15T09:00:00-05:00')
            ->assertJsonPath('tasks.0.time_zone', 'America/New_York');
    }

    public function test_rows_written_without_a_zone_fall_back_to_the_app_timezone(): void
    {
        $source = $this->makeCaldavTasksSource();
        ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'task-legacy',
            'title' => 'Task',
            'due_at' => '2026-01-15 09:00:00',
        ]);

        $tasks = $this->withoutMiddleware(ResolveCalendarOwner::class)
            ->getJson('/api/v1/external-tasks?calendar_owner='.self::OWNER);

        $tasks->assertOk()
            ->assertJsonPath('tasks.0.due_at', '2026-01-15T09:00:00+00:00')
            ->assertJsonPath('tasks.0.time_zone', 'UTC');
    }

    public function test_legacy_rows_are_anchored_to_the_app_timezone(): void
    {
        $source = $this->makeCaldavTasksSource();
        // A row written before the migration: the wall clock is there, the
        // zone is not.
        DB::table('external_tasks')->insert([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => null,
            'external_uid' => 'task-legacy-row',
            'title' => 'Task',
            'due_at' => '2026-01-15 09:00:00',
            'time_zone' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_11_22_000001_add_time_zone_to_external_tasks_table.php');
        $migration->up();

        $this->assertSame(
            'UTC',
            DB::table('external_tasks')->where('external_uid', 'task-legacy-row')->value('time_zone')
        );
    }
}
