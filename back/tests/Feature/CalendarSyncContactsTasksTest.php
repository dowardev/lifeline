<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Models\CalendarSource;
use App\Models\ExternalContact;
use App\Models\ExternalTask;
use App\Services\CalendarSyncService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Prune guard (LBDS-264) for the new LBDS-266 kinds: contacts + tasks.
 */
class CalendarSyncContactsTasksTest extends TestCase
{
    use RefreshDatabase;

    private const HREF = '/addressbooks/user/default/';

    private function makeSource(): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => 'test:sub',
            'type' => 'caldav',
            'name' => 'Work',
            'url' => encrypt('https://cal.example.com/remote.php/dav'),
        ])->save();

        ExternalContact::create([
            'sso_sub' => 'test:sub',
            'calendar_source_id' => $source->id,
            'collection_href' => self::HREF,
            'external_uid' => 'contact-1',
            'display_name' => 'Ada',
        ]);
        ExternalTask::create([
            'sso_sub' => 'test:sub',
            'calendar_source_id' => $source->id,
            'collection_href' => self::HREF,
            'external_uid' => 'task-1',
            'title' => 'Todo',
        ]);

        return $source;
    }

    private function callPrivate(object $target, string $method, array $args): mixed
    {
        $ref = new \ReflectionMethod($target, $method);
        $ref->setAccessible(true);

        return $ref->invokeArgs($target, $args);
    }

    /**
     * A CalendarSyncService whose HTTP layer replays canned responses, so a
     * 207 Multi-Status can be exercised without touching the network.
     */
    private function serviceWithResponses(array $responses): CalendarSyncService
    {
        $client = new Client(['handler' => new MockHandler($responses)]);

        return new class($client) extends CalendarSyncService
        {
            public function __construct(private readonly Client $forcedClient) {}

            protected function httpClient(): Client
            {
                return $this->forcedClient;
            }
        };
    }

    private function subscribeContacts(CalendarSource $source): void
    {
        $source->forceFill(['collections' => [
            [
                'href' => self::HREF,
                'name' => 'Contacts',
                'type' => 'contacts',
                'subscribed' => true,
                'hidden' => false,
            ],
        ]])->save();
    }

    private function resourceErrorMultistatus(string $statusLine): string
    {
        return '<?xml version="1.0" encoding="utf-8"?>'
            .'<D:multistatus xmlns:D="DAV:">'
            .'<D:response><D:href>'.self::HREF.'ada.vcf</D:href>'
            .'<D:status>'.$statusLine.'</D:status></D:response>'
            .'</D:multistatus>';
    }

    private function addressbookMultistatus(string $fn): string
    {
        $vcard = "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:".$fn."\r\nEND:VCARD";

        return '<?xml version="1.0" encoding="utf-8"?>'
            .'<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">'
            .'<D:response><D:href>/addressbooks/user/default/ada.vcf</D:href>'
            .'<D:propstat><D:prop><C:address-data><![CDATA['.$vcard.']]></C:address-data></D:prop>'
            .'<D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>'
            .'</D:multistatus>';
    }

    public function test_contacts_prune_skips_unconfirmed_collection(): void
    {
        $source = $this->makeSource();

        $pruned = $this->callPrivate(
            new CalendarSyncService, 'pruneUnseenFor',
            [ExternalContact::class, $source, [self::HREF => []], []]
        );

        $this->assertSame(0, $pruned);
        $this->assertSame(1, ExternalContact::where('calendar_source_id', $source->id)->count());
    }

    public function test_contacts_prune_deletes_stale_row_for_confirmed_collection(): void
    {
        $source = $this->makeSource();

        $pruned = $this->callPrivate(
            new CalendarSyncService, 'pruneUnseenFor',
            [ExternalContact::class, $source, [self::HREF => []], [self::HREF]]
        );

        $this->assertSame(1, $pruned);
        $this->assertSame(0, ExternalContact::where('calendar_source_id', $source->id)->count());
    }

    public function test_tasks_prune_skips_unconfirmed_collection(): void
    {
        $source = $this->makeSource();

        $pruned = $this->callPrivate(
            new CalendarSyncService, 'pruneUnseenFor',
            [ExternalTask::class, $source, [self::HREF => []], []]
        );

        $this->assertSame(0, $pruned);
        $this->assertSame(1, ExternalTask::where('calendar_source_id', $source->id)->count());
    }

    public function test_tasks_prune_deletes_stale_row_for_confirmed_collection(): void
    {
        $source = $this->makeSource();

        $pruned = $this->callPrivate(
            new CalendarSyncService, 'pruneUnseenFor',
            [ExternalTask::class, $source, [self::HREF => []], [self::HREF]]
        );

        $this->assertSame(1, $pruned);
        $this->assertSame(0, ExternalTask::where('calendar_source_id', $source->id)->count());
    }

    public function test_extract_calendar_data_throws_when_resource_status_is_error(): void
    {
        $xml = $this->resourceErrorMultistatus('HTTP/1.1 403 Forbidden');

        try {
            $this->callPrivate(new CalendarSyncService, 'extractCalendarData', [$xml]);
            $this->fail('A resource-level 403 inside a 207 must throw.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('403', $e->getMessage());
        }
    }

    public function test_extract_address_data_throws_when_resource_status_is_error(): void
    {
        $xml = $this->resourceErrorMultistatus('HTTP/1.1 500 Internal Server Error');

        try {
            $this->callPrivate(new CalendarSyncService, 'extractAddressData', [$xml]);
            $this->fail('A resource-level 500 inside a 207 must throw.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('500', $e->getMessage());
        }
    }

    public function test_multistatus_with_error_resource_status_keeps_stored_rows_intact(): void
    {
        $source = $this->makeSource();
        $this->subscribeContacts($source);

        // A 207 whose only resource reports 403 and carries no data used to
        // look like a confirmed empty collection, so pruneUnseenFor wiped
        // every stored row. It must instead leave the collection unconfirmed.
        $service = $this->serviceWithResponses([
            new Response(207, [], $this->resourceErrorMultistatus('HTTP/1.1 403 Forbidden')),
        ]);
        $result = $service->syncSource($source);

        $this->assertFalse($result['ok']);
        $this->assertStringContainsString('403', (string) $result['message']);
        $this->assertSame(1, ExternalContact::where('calendar_source_id', $source->id)->count());
        $this->assertSame(1, ExternalTask::where('calendar_source_id', $source->id)->count());
    }

    public function test_uid_less_vcards_keep_stable_identity_across_syncs(): void
    {
        $source = $this->makeSource();
        $this->subscribeContacts($source);

        $first = $this->serviceWithResponses([
            new Response(207, [], $this->addressbookMultistatus('Ada')),
        ]);
        $result = $first->syncSource($source->fresh());
        $this->assertTrue($result['ok'], (string) json_encode($result));
        $this->assertSame(1, ExternalContact::where('calendar_source_id', $source->id)->count());
        $uid = ExternalContact::where('calendar_source_id', $source->id)->value('external_uid');

        // Same href, edited card content: the identity must not move.
        $second = $this->serviceWithResponses([
            new Response(207, [], $this->addressbookMultistatus('Ada Lovelace')),
        ]);
        $result = $second->syncSource($source->fresh());
        $this->assertTrue($result['ok'], (string) json_encode($result));

        $this->assertSame(1, ExternalContact::where('calendar_source_id', $source->id)->count());
        $this->assertSame(
            $uid,
            ExternalContact::where('calendar_source_id', $source->id)->value('external_uid')
        );
        $this->assertSame(
            'Ada Lovelace',
            ExternalContact::where('calendar_source_id', $source->id)->value('display_name')
        );
    }
}
