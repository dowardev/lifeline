<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Models\Calendar;
use App\Models\CalendarSource;
use App\Models\Event;
use App\Models\User;
use App\Services\DefaultCalendarService;
use Dowardev\SsoServer\Client\SsoServerClient;
use Dowardev\SsoServer\Types\SsoUser;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

if (! class_exists('TuOrg\SsoServer\Client\SsoServerClient')) {
    class_alias(SsoServerClient::class, 'TuOrg\SsoServer\Client\SsoServerClient');
}

/**
 * LBDS-292 - "every event must belong to a calendar".
 *
 *   S1 - a default calendar always exists and is provisioned automatically.
 *   S2 - an event never exists without a calendar (`events.calendar_id` is
 *        NOT NULL; a missing calendar resolves to the default).
 *   S3 - the default calendar is protected: it can neither be renamed nor
 *        deleted.
 *   S4 - deleting a calendar the user created offers exactly two options
 *        (destroy it with its events, or move its events to another local
 *        calendar) and never leaves an event without a calendar.
 */
class Lbds292DefaultCalendarTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsSsoUser(string $sub, ?string $email = null): void
    {
        $ssoUser = new SsoUser($sub, 'Owner', $email, 'owner');
        $sso = Mockery::mock(SsoServerClient::class);
        $sso->shouldReceive('authenticateRequest')->andReturn($ssoUser);
        $sso->shouldReceive('getId')->andReturn((string) $sub);
        $sso->shouldReceive('getUser')->andReturn($ssoUser);
        $this->app->instance(SsoServerClient::class, $sso);
        $this->app->instance('TuOrg\\SsoServer\\Client\\SsoServerClient', $sso);
    }

    private function makeUser(?string $ssoSub = null): User
    {
        $user = new User;
        $user->forceFill([
            'name' => 'Owner',
            'user' => 'owner'.uniqid(),
            'email' => 'owner+'.uniqid().'@example.com',
            'password' => bcrypt('secret'),
            'sso_sub' => $ssoSub ?? 'sso:owner:'.uniqid(),
        ])->save();

        return $user;
    }

    private function authHeaders(): array
    {
        return ['Authorization' => 'Bearer test-token'];
    }

    /**
     * A mirrored calendar (LBDS-305): the mirror row is created by the
     * observer when the source is saved.
     */
    private function makeMirror(User $user): Calendar
    {
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'type' => 'ics',
            'name' => 'Google',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => $user->id,
        ])->save();

        return Calendar::where('source_id', $source->id)->firstOrFail();
    }

    /**
     * The payload `POST /events` requires.
     */
    private function eventPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test event',
            'dateStart' => '2026-11-17 10:00:00',
            'dateEnd' => '2026-11-17 11:00:00',
            'timeZone' => 'UTC',
            'availability' => 'busy',
        ], $overrides);
    }

    // ---------------------------------------------------------------- S1

    public function test_a_new_account_gets_its_default_calendar_on_first_login(): void
    {
        $sub = 'sso:new-account';

        $this->actingAsSsoUser($sub, 'new-'.uniqid().'@example.com');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->getJson('/api/v1/calendars');

        $response->assertOk();

        $user = User::where('sso_sub', $sub)->first();
        $this->assertNotNull($user, 'The account must be provisioned by the middleware.');

        $default = DefaultCalendarService::defaultFor($user);
        $this->assertNotNull($default, 'A new account must own a default calendar.');
        $this->assertSame('Personal', $default->name);
        $this->assertTrue((bool) $default->default);
        $this->assertNull($default->source_id, 'The default calendar is local.');
    }

    public function test_listing_calendars_provisions_the_default_for_an_account_without_one(): void
    {
        $user = $this->makeUser('sso:lazy-default');
        $this->actingAsSsoUser($user->sso_sub);

        $this->assertNull(DefaultCalendarService::defaultFor($user));

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->getJson('/api/v1/calendars');

        $response->assertOk();
        $this->assertNotNull(DefaultCalendarService::defaultFor($user));
        $this->assertTrue($response->json('data.0.protected'));
    }

    public function test_the_default_calendar_is_not_created_twice(): void
    {
        $user = $this->makeUser('sso:idempotent');
        $this->actingAsSsoUser($user->sso_sub);

        $this->withHeader('Authorization', 'Bearer test-token')->getJson('/api/v1/calendars');
        $this->withHeader('Authorization', 'Bearer test-token')->getJson('/api/v1/calendars');

        $this->assertSame(
            1,
            Calendar::where('user_id', $user->id)->where('default', true)->count(),
            'The default calendar is provisioned exactly once.'
        );
    }

    public function test_the_protected_default_is_always_a_local_calendar(): void
    {
        // LBDS-305 gave the default slot to the first connected source
        // when the account had no default yet. The protected default has
        // to be LOCAL: it is the anchor every event falls back to and the
        // destination a "move" can use, and a mirror is neither.
        $user = $this->makeUser('sso:mirror-default');
        $this->actingAsSsoUser($user->sso_sub);

        $mirror = $this->makeMirror($user);
        $mirror->forceFill(['default' => true])->save();

        $default = DefaultCalendarService::ensureForUser($user);

        $this->assertNotSame($mirror->id, $default->id, 'A mirror is never the protected default.');
        $this->assertNull($default->source_id, 'The protected default is a local calendar.');
        $this->assertTrue((bool) $default->default, 'The local calendar holds the default slot.');
        $this->assertSame('Personal', $default->name);
        $this->assertFalse(
            (bool) $mirror->fresh()->default,
            'The mirror gives the default slot up.'
        );
    }

    public function test_a_soft_deleted_default_is_restored_instead_of_blocking_the_account(): void
    {
        // The generated `default_user_id` column does not look at
        // `deleted_at`, so a trashed default still holds the unique slot
        // and the index would reject a second active default. The default
        // is a protected element that can never be deleted, so it is
        // restored: the account keeps its default AND the events that
        // point at that row keep their calendar.
        $user = $this->makeUser('sso:soft-deleted-default');
        $this->actingAsSsoUser($user->sso_sub);

        $default = DefaultCalendarService::ensureForUser($user);
        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload())
            ->json('event.id');

        // A soft delete that bypasses the protected delete path.
        $default->delete();

        $this->assertNull(DefaultCalendarService::defaultFor($user), 'The trashed row is hidden.');

        $restored = DefaultCalendarService::ensureForUser($user);

        $this->assertNotNull($restored, 'The account must get its default back.');
        $this->assertSame($default->id, $restored->id, 'The same row is restored.');
        $this->assertNull($restored->deleted_at);
        $this->assertSame($default->id, Event::find($eventId)->calendar_id);
    }

    public function test_an_event_cannot_be_attached_to_a_disconnected_mirror(): void
    {
        // LBDS-292 - a mirror whose source was disconnected is hidden by
        // the picker, so an event attached to it would be an event without
        // a usable calendar.
        $user = $this->makeUser('sso:archived');
        $this->actingAsSsoUser($user->sso_sub);

        DefaultCalendarService::ensureForUser($user);
        $mirror = $this->makeMirror($user);
        $mirror->forceFill(['archived_at' => now()])->save();

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $mirror->id]));

        $response->assertStatus(422);
        $this->assertSame(0, Event::count());
    }

    public function test_an_event_that_already_lives_in_a_disconnected_mirror_can_still_be_updated(): void
    {
        // LBDS-292 - disconnecting a source archives its mirror but the
        // events keep pointing at it (LBDS-305). The widget re-sends the
        // event's calendar on every drag, resize or rename, so rejecting
        // the archived calendar would make those events uneditable
        // forever.
        $user = $this->makeUser('sso:archived-edit');
        $this->actingAsSsoUser($user->sso_sub);

        DefaultCalendarService::ensureForUser($user);
        $mirror = $this->makeMirror($user);

        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $mirror->id]))
            ->json('event.id');

        // The source is disconnected: the mirror is archived and the event
        // still points at it.
        $mirror->forceFill(['archived_at' => now()])->save();

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->putJson('/api/v1/events/'.$eventId, [
                'calendar_id' => $mirror->id,
                'name' => 'Moved event',
            ]);

        $response->assertOk();
        $this->assertSame($mirror->id, Event::find($eventId)->calendar_id);
        $this->assertSame('Moved event', Event::find($eventId)->title);
    }

    // ---------------------------------------------------------------- S2

    public function test_creating_an_event_without_a_calendar_lands_it_in_the_default(): void
    {
        $user = $this->makeUser('sso:event-default');
        $this->actingAsSsoUser($user->sso_sub);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload());

        $response->assertCreated();

        $event = Event::first();
        $this->assertNotNull($event);
        $default = DefaultCalendarService::defaultFor($user);
        $this->assertNotNull($default);
        $this->assertSame($default->id, $event->calendar_id);
    }

    public function test_creating_an_event_with_an_explicit_null_calendar_lands_it_in_the_default(): void
    {
        $user = $this->makeUser('sso:event-null');
        $this->actingAsSsoUser($user->sso_sub);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => null]));

        $response->assertCreated();

        $default = DefaultCalendarService::defaultFor($user);
        $this->assertSame($default->id, Event::first()->calendar_id);
    }

    public function test_creating_an_event_with_a_foreign_calendar_is_rejected(): void
    {
        $this->makeUser('sso:owner');
        $this->actingAsSsoUser('sso:owner');

        $other = $this->makeUser('sso:other');
        $foreign = Calendar::create([
            'name' => 'Other',
            'user_id' => $other->id,
            'default' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $foreign->id]));

        $response->assertNotFound();
        $this->assertSame(0, Event::count());
    }

    public function test_updating_an_event_with_a_null_calendar_resolves_the_default_instead_of_clearing_it(): void
    {
        $user = $this->makeUser('sso:update-null');
        $this->actingAsSsoUser($user->sso_sub);

        $created = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload());
        $created->assertCreated();
        $eventId = $created->json('event.id');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->putJson('/api/v1/events/'.$eventId, ['calendar_id' => null]);

        $response->assertOk();

        $default = DefaultCalendarService::defaultFor($user);
        $this->assertSame($default->id, Event::find($eventId)->calendar_id);
    }

    public function test_updating_an_event_with_a_foreign_calendar_is_rejected(): void
    {
        $this->makeUser('sso:owner');
        $this->actingAsSsoUser('sso:owner');

        $created = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload());
        $created->assertCreated();
        $eventId = $created->json('event.id');

        $other = $this->makeUser('sso:other');
        $foreign = Calendar::create([
            'name' => 'Other',
            'user_id' => $other->id,
            'default' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->putJson('/api/v1/events/'.$eventId, ['calendar_id' => $foreign->id]);

        $response->assertNotFound();
    }

    public function test_the_database_rejects_an_event_without_a_calendar(): void
    {
        $user = $this->makeUser('sso:not-null');

        $this->expectException(QueryException::class);

        DB::table('events')->insert([
            'title' => 'Orphan',
            'user_id' => $user->id,
            'calendar_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_the_migration_moves_a_calendar_less_event_under_the_default(): void
    {
        $user = $this->makeUser('sso:migration');

        // Reproduce the pre-LBDS-292 shape: the column is nullable again
        // and the event has no calendar.
        Schema::table('events', function ($table) {
            $table->unsignedInteger('calendar_id')->nullable(true)->default(null)->change();
        });

        $eventId = DB::table('events')->insertGetId([
            'title' => 'Orphan',
            'user_id' => $user->id,
            'calendar_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_11_17_000001_enforce_event_calendar_required.php');
        $migration->up();

        $default = DefaultCalendarService::defaultFor($user);
        $this->assertNotNull($default, 'The migration provisions the default calendar.');
        $this->assertSame(
            $default->id,
            DB::table('events')->where('id', $eventId)->value('calendar_id'),
            'The calendar-less event is moved under the default calendar.'
        );

        // The schema change this test made is not rolled back with the
        // test transaction (DDL is not transactional in MySQL), so it is
        // restored here: the column has to be NOT NULL again for the rest
        // of the test process.
        $this->restoreRequiredCalendarId();
    }

    /**
     * Puts `events.calendar_id` back to NOT NULL.
     */
    private function restoreRequiredCalendarId(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `events` MODIFY `calendar_id` INT UNSIGNED NOT NULL');

            return;
        }

        Schema::table('events', function ($table) {
            $table->unsignedInteger('calendar_id')->nullable(false)->change();
        });
    }
}
