<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace Tests\Feature;

use App\Models\CalendarSource;
use App\Models\ExternalEvent;
use App\Services\CalendarSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guard against silent full-wipe prunes (LBDS-264 finding #1).
 *
 * A CalDAV fetch failure must never produce an empty $seen that pruneUnseen()
 * then treats as "everything is stale".
 */
class CalendarSyncPruneGuardTest extends TestCase
{
    use RefreshDatabase;

    private const HREF = '/calendars/user/work/';

    private function makeSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => 'test:sub',
            'type' => 'caldav',
            'name' => 'Work',
            'url' => 'https://cal.example.com/remote.php/dav',
        ])->save();

        ExternalEvent::create([
            'sso_sub' => 'test:sub',
            'calendar_source_id' => $source->id,
            'collection_href' => self::HREF,
            'external_uid' => 'stale-uid-1',
            'title' => 'Stale event',
            'date_start' => now(),
            'date_end' => now()->addHour(),
        ]);

        return $source;
    }

    private function callPrivate(object $target, string $method, array $args): mixed
    {
        $ref = new \ReflectionMethod($target, $method);
        $ref->setAccessible(true);

        return $ref->invokeArgs($target, $args);
    }

    public function testExtractCalendarDataThrowsOnGarbage(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->callPrivate(new CalendarSyncService, 'extractCalendarData', ['not xml at all {{{']);
    }

    public function testExtractCalendarDataReturnsEmptyForValidEmptyMultistatus(): void
    {
        $xml = '<?xml version="1.0" encoding="utf-8"?>'
            . '<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"></D:multistatus>';

        $this->assertSame([], $this->callPrivate(new CalendarSyncService, 'extractCalendarData', [$xml]));
    }

    public function testPruneUnseenSkipsUnconfirmedCollection(): void
    {
        $source = $this->makeSource();

        $pruned = $this->callPrivate(
            new CalendarSyncService, 'pruneUnseen', [$source, [self::HREF => []], []]
        );

        $this->assertSame(0, $pruned);
        $this->assertSame(1, ExternalEvent::where('calendar_source_id', $source->id)->count());
    }

    public function testPruneUnseenDeletesStaleRowForConfirmedCollection(): void
    {
        $source = $this->makeSource();

        $pruned = $this->callPrivate(
            new CalendarSyncService, 'pruneUnseen', [$source, [self::HREF => []], [self::HREF]]
        );

        $this->assertSame(1, $pruned);
        $this->assertSame(0, ExternalEvent::where('calendar_source_id', $source->id)->count());
    }
}
