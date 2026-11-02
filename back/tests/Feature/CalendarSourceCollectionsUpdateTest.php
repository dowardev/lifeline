<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Http\Middleware\ResolveCalendarOwner;
use App\Models\CalendarSource;
use App\Models\ExternalContact;
use App\Models\ExternalEvent;
use App\Models\ExternalTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unsubscribing a collection drops the rows already synced for it, and only
 * for a real subscribed -> unsubscribed transition. A save that merely
 * carries an already-unsubscribed collection must not issue destructive
 * writes for collections it is not changing.
 */
class CalendarSourceCollectionsUpdateTest extends TestCase
{
    use RefreshDatabase;

    private const OWNER = 'test:sub';

    private const WORK = '/calendars/user/work/';

    private const TASKS = '/calendars/user/tasks/';

    private function makeSource(array $collections): CalendarSource
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => self::OWNER,
            'type' => 'caldav',
            'name' => 'Work',
            'url' => encrypt('https://cal.example.com/remote.php/dav'),
            'collections' => $collections,
        ])->save();

        return $source;
    }

    private function seedRows(CalendarSource $source, string $href): void
    {
        ExternalEvent::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => $href,
            'external_uid' => 'event-1',
            'title' => 'Event',
            'date_start' => now(),
            'date_end' => now()->addHour(),
        ]);
        ExternalContact::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => $href,
            'external_uid' => 'contact-1',
            'display_name' => 'Ada',
        ]);
        ExternalTask::create([
            'sso_sub' => self::OWNER,
            'calendar_source_id' => $source->id,
            'collection_href' => $href,
            'external_uid' => 'task-1',
            'title' => 'Task',
        ]);
    }

    private function putCollections(CalendarSource $source, array $collections)
    {
        return $this->withoutMiddleware(ResolveCalendarOwner::class)->putJson(
            '/api/v1/calendar-sources/'.$source->id.'?calendar_owner='.self::OWNER,
            ['collections' => $collections]
        );
    }

    public function test_unsubscribe_deletes_rows_for_that_collection_only(): void
    {
        $source = $this->makeSource([
            ['href' => self::WORK, 'name' => 'Work', 'type' => 'calendar', 'subscribed' => true, 'hidden' => false],
            ['href' => self::TASKS, 'name' => 'Tasks', 'type' => 'tasks', 'subscribed' => true, 'hidden' => false],
        ]);
        $this->seedRows($source, self::WORK);
        $this->seedRows($source, self::TASKS);

        $response = $this->putCollections($source, [
            ['href' => self::WORK, 'subscribed' => false],
            ['href' => self::TASKS, 'subscribed' => true],
        ]);

        $response->assertOk();
        $this->assertSame(0, ExternalEvent::where('collection_href', self::WORK)->count());
        $this->assertSame(0, ExternalContact::where('collection_href', self::WORK)->count());
        $this->assertSame(0, ExternalTask::where('collection_href', self::WORK)->count());
        // The untouched, still-subscribed collection keeps its rows.
        $this->assertSame(1, ExternalEvent::where('collection_href', self::TASKS)->count());
        $this->assertSame(1, ExternalContact::where('collection_href', self::TASKS)->count());
        $this->assertSame(1, ExternalTask::where('collection_href', self::TASKS)->count());
    }

    public function test_already_unsubscribed_collection_is_kept_untouched_on_unrelated_save(): void
    {
        // Both collections arrive unsubscribed but were already unsubscribed:
        // there is no transition, so no delete runs at all.
        $source = $this->makeSource([
            ['href' => self::WORK, 'name' => 'Work', 'type' => 'calendar', 'subscribed' => false, 'hidden' => false],
            ['href' => self::TASKS, 'name' => 'Tasks', 'type' => 'tasks', 'subscribed' => false, 'hidden' => false],
        ]);
        $this->seedRows($source, self::WORK);

        $response = $this->putCollections($source, [
            ['href' => self::WORK, 'subscribed' => false],
            ['href' => self::TASKS, 'subscribed' => false],
        ]);

        $response->assertOk();
        $this->assertSame(1, ExternalEvent::where('collection_href', self::WORK)->count());
        $this->assertSame(1, ExternalContact::where('collection_href', self::WORK)->count());
        $this->assertSame(1, ExternalTask::where('collection_href', self::WORK)->count());
    }

    public function test_hidden_toggle_does_not_delete_rows(): void
    {
        $source = $this->makeSource([
            ['href' => self::WORK, 'name' => 'Work', 'type' => 'calendar', 'subscribed' => true, 'hidden' => false],
        ]);
        $this->seedRows($source, self::WORK);

        $response = $this->putCollections($source, [
            ['href' => self::WORK, 'subscribed' => true, 'hidden' => true],
        ]);

        $response->assertOk();
        $this->assertSame(1, ExternalEvent::where('collection_href', self::WORK)->count());
        $this->assertSame(1, ExternalContact::where('collection_href', self::WORK)->count());
        $this->assertSame(1, ExternalTask::where('collection_href', self::WORK)->count());
        $this->assertTrue((bool) $source->fresh()->collections[0]['hidden']);
    }

    public function test_kinds_and_flags_survive_the_round_trip(): void
    {
        $source = $this->makeSource([
            ['href' => self::WORK, 'name' => 'Work', 'type' => 'calendar', 'subscribed' => true, 'hidden' => false],
        ]);

        $response = $this->putCollections($source, [
            ['href' => self::WORK, 'subscribed' => false],
            ['href' => '/addressbooks/user/contacts/', 'name' => 'Contacts', 'type' => 'contacts', 'subscribed' => true],
        ]);

        $response->assertOk();
        $stored = $source->fresh()->collections;
        $contacts = collect($stored)->firstWhere('href', '/addressbooks/user/contacts/');
        $this->assertSame('contacts', $contacts['type']);
        $this->assertTrue($contacts['subscribed']);
    }
}
