<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Models\CalendarSource;
use App\Services\GoogleCalendarService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * LBDS-268 phase 1: Google Calendar reminders. Only `popup` reminders become
 * local notifications; when an event relies on the calendar defaults the
 * defaults are fetched from the calendarList endpoint, cached per run, and a
 * failing defaults call never breaks the sync.
 */
class ExternalReminderGoogleTest extends TestCase
{
    use RefreshDatabase;

    private const OWNER = 'test:sub';

    private function makeGoogleSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'google',
            'name' => 'Google Calendar',
            'url' => encrypt('google-oauth'),
            'password' => encrypt('fake-access-token'),
            'token_expires_at' => now()->addHour(),
            'is_active' => true,
            'collections' => [],
        ])->save();

        return $source;
    }

    /**
     * A GoogleCalendarService whose HTTP layer replays canned responses.
     */
    private function serviceWithResponses(array $responses): GoogleCalendarService
    {
        $client = new Client(['handler' => new MockHandler($responses)]);

        return new class($client) extends GoogleCalendarService
        {
            public function __construct(private readonly Client $forcedClient) {}

            protected function httpClient(): Client
            {
                return $this->forcedClient;
            }
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function eventsBody(array $items): string
    {
        return (string) json_encode(['items' => $items]);
    }

    /**
     * @param  array<string, mixed>  $reminders
     * @return array<string, mixed>
     */
    private function event(array $reminders): array
    {
        return [
            'id' => 'evt-'.substr(md5((string) json_encode($reminders)), 0, 8),
            'summary' => 'Event',
            'start' => ['dateTime' => '2026-09-20T12:00:00Z'],
            'end' => ['dateTime' => '2026-09-20T13:00:00Z'],
            'reminders' => $reminders,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listEvents(GoogleCalendarService $service, CalendarSource $source): array
    {
        return $service->listEvents(
            $source,
            'cal-1',
            '2026-09-20T00:00:00Z',
            '2026-09-21T00:00:00Z'
        );
    }

    private function assertNoWarnings(callable $callback): mixed
    {
        set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
            throw new \ErrorException($message, 0, $severity, $file, $line);
        });

        try {
            return $callback();
        } finally {
            restore_error_handler();
        }
    }

    public function test_popup_overrides_become_seconds_before_start(): void
    {
        $source = $this->makeGoogleSource();
        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => false, 'overrides' => [
                    ['method' => 'popup', 'minutes' => 15],
                    ['method' => 'email', 'minutes' => 30],
                    ['method' => 'popup', 'minutes' => 45],
                ]]),
            ])),
        ]);

        $events = $this->listEvents($service, $source);

        $this->assertSame([2700, 900], $events[0]['reminders']);
    }

    public function test_non_popup_overrides_are_filtered_out(): void
    {
        $source = $this->makeGoogleSource();
        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => false, 'overrides' => [
                    ['method' => 'email', 'minutes' => 15],
                    ['method' => 'sms', 'minutes' => 30],
                ]]),
            ])),
        ]);

        $events = $this->listEvents($service, $source);

        $this->assertSame([], $events[0]['reminders']);
    }

    public function test_overrides_are_deduped_and_capped_to_the_closest_ten(): void
    {
        $source = $this->makeGoogleSource();
        $overrides = [];
        for ($minutes = 1; $minutes <= 12; $minutes++) {
            $overrides[] = ['method' => 'popup', 'minutes' => $minutes];
        }
        // Duplicate of the 5m override must collapse to a single entry.
        $overrides[] = ['method' => 'popup', 'minutes' => 5];

        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => false, 'overrides' => $overrides]),
            ])),
        ]);

        $events = $this->listEvents($service, $source);

        // The ten offsets closest to the anchor (1m..10m) survive, descending.
        $this->assertSame([600, 540, 480, 420, 360, 300, 240, 180, 120, 60], $events[0]['reminders']);
    }

    public function test_malformed_reminders_shape_does_not_warn_or_throw(): void
    {
        $source = $this->makeGoogleSource();
        $first = $this->event(['useDefault' => false, 'overrides' => 'not-an-array']);
        $first['id'] = 'scalar-overrides';
        $second = $this->event(['useDefault' => false]);
        $second['id'] = 'scalar-reminders';
        $second['reminders'] = 'not-an-array';

        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([$first, $second])),
        ]);

        $events = $this->assertNoWarnings(fn () => $this->listEvents($service, $source));

        $this->assertSame([], $events[0]['reminders']);
        $this->assertSame([], $events[1]['reminders']);
    }

    public function test_use_default_fetches_and_converts_calendar_defaults(): void
    {
        $source = $this->makeGoogleSource();
        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => true]),
            ])),
            new Response(200, [], (string) json_encode(['defaultReminders' => [
                ['method' => 'popup', 'minutes' => 10],
                ['method' => 'email', 'minutes' => 60],
                ['method' => 'popup', 'minutes' => 30],
            ]])),
        ]);

        $events = $this->listEvents($service, $source);

        $this->assertSame([1800, 600], $events[0]['reminders']);
    }

    public function test_use_default_is_ignored_when_popup_overrides_exist(): void
    {
        $source = $this->makeGoogleSource();
        // Only one canned response: if the defaults endpoint were consulted,
        // the MockHandler queue would be exhausted and the call would throw.
        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => true, 'overrides' => [
                    ['method' => 'popup', 'minutes' => 5],
                ]]),
            ])),
        ]);

        $events = $this->listEvents($service, $source);

        $this->assertSame([300], $events[0]['reminders']);
    }

    public function test_defaults_are_fetched_at_most_once_per_calendar_per_run(): void
    {
        $source = $this->makeGoogleSource();
        // Two useDefault events but a single calendarList response: a second
        // fetch would exhaust the MockHandler queue and fail the test.
        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => true]),
                array_merge($this->event(['useDefault' => true]), ['id' => 'second']),
            ])),
            new Response(200, [], (string) json_encode(['defaultReminders' => [
                ['method' => 'popup', 'minutes' => 10],
            ]])),
        ]);

        $events = $this->listEvents($service, $source);

        $this->assertSame([600], $events[0]['reminders']);
        $this->assertSame([600], $events[1]['reminders']);
    }

    public function test_defaults_call_failure_contributes_nothing_and_does_not_fail_sync(): void
    {
        $source = $this->makeGoogleSource();
        $service = $this->serviceWithResponses([
            new Response(200, [], $this->eventsBody([
                $this->event(['useDefault' => true]),
            ])),
            new Response(500, [], (string) json_encode(['error' => ['message' => 'boom']])),
        ]);

        $events = $this->listEvents($service, $source);

        $this->assertSame([], $events[0]['reminders']);
    }
}
