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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

if (! class_exists('TuOrg\SsoServer\Client\SsoServerClient')) {
    class_alias(SsoServerClient::class, 'TuOrg\SsoServer\Client\SsoServerClient');
}

/**
 * LBDS-292 - the protected default calendar and the two ways out of a
 * calendar the user created.
 *
 *   S3 - the default calendar is protected: it can neither be renamed nor
 *        deleted. A mirrored calendar cannot be deleted through this API
 *        either (LBDS-305 owns its lifecycle).
 *   S4 - deleting a calendar the user created offers exactly two options
 *        (destroy it with its events, or move its events to another local
 *        calendar) and never leaves an event without a calendar.
 */
class Lbds292ProtectedCalendarTest extends TestCase
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

    // ---------------------------------------------------------------- S3

    public function test_the_default_calendar_cannot_be_renamed(): void
    {
        $user = $this->makeUser('sso:protected');
        $this->actingAsSsoUser($user->sso_sub);

        $this->withHeader('Authorization', 'Bearer test-token')->getJson('/api/v1/calendars');

        $default = DefaultCalendarService::defaultFor($user);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->putJson('/api/v1/calendars/'.$default->id, ['name' => 'Renamed']);

        $response->assertForbidden();
        $this->assertSame('Personal', $default->fresh()->name);
    }

    public function test_the_default_calendar_cannot_be_deleted(): void
    {
        $user = $this->makeUser('sso:protected-delete');
        $this->actingAsSsoUser($user->sso_sub);

        $this->withHeader('Authorization', 'Bearer test-token')->getJson('/api/v1/calendars');

        $default = DefaultCalendarService::defaultFor($user);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$default->id);

        $response->assertForbidden();
        $this->assertNotNull(Calendar::find($default->id));
    }

    public function test_a_mirrored_calendar_cannot_be_deleted_through_the_calendar_api(): void
    {
        $user = $this->makeUser('sso:mirror');
        $this->actingAsSsoUser($user->sso_sub);

        // The account owns its default first, so the mirror does not take
        // the default slot (that is a different protection).
        DefaultCalendarService::ensureForUser($user);
        $mirror = $this->makeMirror($user);
        $this->assertFalse((bool) $mirror->default);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$mirror->id);

        $response->assertForbidden();
        $this->assertNotNull(Calendar::find($mirror->id));
    }

    // ---------------------------------------------------------------- S4

    public function test_deleting_a_calendar_without_a_strategy_is_rejected(): void
    {
        // LBDS-292 - the strategy is REQUIRED. A DELETE body can be
        // stripped by a proxy or a CDN: with an implicit default the
        // request would destroy the events instead of moving them. The
        // explicit contract turns that into a 422.
        $user = $this->makeUser('sso:no-strategy');
        $this->actingAsSsoUser($user->sso_sub);

        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => $user->id,
            'default' => false,
        ]);

        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $calendar->id]))
            ->json('event.id');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id);

        $response->assertStatus(422);
        $this->assertNotNull(Calendar::find($calendar->id));
        $this->assertNotNull(Event::find($eventId), 'The events are untouched.');
    }

    public function test_deleting_a_calendar_with_its_events_leaves_no_orphan(): void
    {
        $user = $this->makeUser('sso:delete-events');
        $this->actingAsSsoUser($user->sso_sub);

        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => $user->id,
            'default' => false,
        ]);

        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $calendar->id]))
            ->json('event.id');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id, ['strategy' => 'delete_events']);

        $response->assertOk();
        $this->assertNull(Calendar::find($calendar->id));
        $this->assertNull(Event::find($eventId), 'The events are destroyed with the calendar.');
        $this->assertSame(0, Event::whereNull('calendar_id')->count());
    }

    public function test_deleting_a_calendar_moves_its_events_to_the_destination(): void
    {
        $user = $this->makeUser('sso:move');
        $this->actingAsSsoUser($user->sso_sub);

        $default = DefaultCalendarService::ensureForUser($user);
        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => $user->id,
            'default' => false,
        ]);

        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $calendar->id]))
            ->json('event.id');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id, [
                'strategy' => 'move',
                'destination_calendar_id' => $default->id,
            ]);

        $response->assertOk();
        $this->assertNull(Calendar::find($calendar->id));
        $this->assertSame($default->id, Event::find($eventId)->calendar_id);
    }

    public function test_moving_the_events_without_a_destination_uses_the_default_calendar(): void
    {
        $user = $this->makeUser('sso:move-default');
        $this->actingAsSsoUser($user->sso_sub);

        $default = DefaultCalendarService::ensureForUser($user);
        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => $user->id,
            'default' => false,
        ]);

        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $calendar->id]))
            ->json('event.id');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id, ['strategy' => 'move']);

        $response->assertOk();
        $this->assertSame($default->id, Event::find($eventId)->calendar_id);
    }

    public function test_moving_the_events_to_a_mirrored_calendar_is_rejected(): void
    {
        $user = $this->makeUser('sso:move-mirror');
        $this->actingAsSsoUser($user->sso_sub);

        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => $user->id,
            'default' => false,
        ]);
        $mirror = $this->makeMirror($user);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id, [
                'strategy' => 'move',
                'destination_calendar_id' => $mirror->id,
            ]);

        $response->assertStatus(422);
        $this->assertNotNull(Calendar::find($calendar->id));
    }

    public function test_a_failed_move_leaves_the_calendar_and_its_events_untouched(): void
    {
        // The deletion runs in one transaction: a rejected destination
        // rolls the whole thing back, so the calendar survives WITH its
        // events still bound to it (no half-applied move).
        $user = $this->makeUser('sso:atomic');
        $this->actingAsSsoUser($user->sso_sub);

        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => $user->id,
            'default' => false,
        ]);

        $eventId = $this->withHeader('Authorization', 'Bearer test-token')
            ->postJson('/api/v1/events', $this->eventPayload(['calendar_id' => $calendar->id]))
            ->json('event.id');

        $other = $this->makeUser('sso:other');
        $foreign = Calendar::create([
            'name' => 'Other',
            'user_id' => $other->id,
            'default' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id, [
                'strategy' => 'move',
                'destination_calendar_id' => $foreign->id,
            ]);

        $response->assertStatus(422);
        $this->assertNotNull(Calendar::find($calendar->id), 'The calendar survives the failed move.');
        $this->assertSame(
            $calendar->id,
            Event::find($eventId)->calendar_id,
            'The event keeps its calendar: the move was rolled back.'
        );
    }

    public function test_moving_the_events_to_a_foreign_calendar_is_rejected(): void
    {
        $this->makeUser('sso:owner');
        $this->actingAsSsoUser('sso:owner');

        $calendar = Calendar::create([
            'name' => 'Work',
            'user_id' => User::where('sso_sub', 'sso:owner')->first()->id,
            'default' => false,
        ]);

        $other = $this->makeUser('sso:other');
        $foreign = Calendar::create([
            'name' => 'Other',
            'user_id' => $other->id,
            'default' => true,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->deleteJson('/api/v1/calendars/'.$calendar->id, [
                'strategy' => 'move',
                'destination_calendar_id' => $foreign->id,
            ]);

        $response->assertStatus(422);
        $this->assertNotNull(Calendar::find($calendar->id));
    }
}
