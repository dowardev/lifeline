<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Unit;

use App\Http\Resources\CalendarResource;
use App\Models\Calendar;
use App\Models\CalendarSource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * LBDS-305 - the picker contract. Every field the frontend reads
 * from `GET /calendars` is defined here, so this test pins the
 * response shape that `AddEventCompoenent.vue` (and the future
 * `CalendarSourceController` callers) depend on.
 *
 * We exercise the resource directly with an in-memory request
 * because the route is behind `calendar.owner` SSO middleware that
 * is out of scope for this ticket; the resource itself is what the
 * frontend binds to.
 */
class CalendarResourceTest extends TestCase
{
    use RefreshDatabase;

    public function testLegacyLocalRowHasNullSourceAndIsSelectable(): void
    {
        $user = User::factory()->create();

        $calendar = new Calendar;
        $calendar->forceFill([
            'user_id' => $user->id,
            'name' => 'Personal',
            'default' => true,
        ])->save();

        $payload = (new CalendarResource($calendar))->toArray(new Request);

        $this->assertSame($calendar->id, $payload['id']);
        $this->assertSame('Personal', $payload['name']);
        $this->assertTrue($payload['default']);
        $this->assertNull($payload['source_id']);
        $this->assertNull($payload['source']);
        $this->assertNull($payload['archived_at']);
        $this->assertTrue($payload['selectable']);
    }

    public function testMirrorRowEmbedsSourceBlockWithKindMetadata(): void
    {
        $user = User::factory()->create();

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'user_id' => $user->id,
            'type' => 'caldav',
            'name' => 'My CalDAV',
            'url' => encrypt('https://cal.example.com/dav'),
            'username' => 'me@example.com',
            'color' => '#ff8800',
        ])->save();

        $mirror = Calendar::where('source_id', $source->id)->firstOrFail();
        $payload = (new CalendarResource($mirror->load('source')))
            ->toArray(new Request);

        $this->assertSame($mirror->id, $payload['id']);
        $this->assertSame($source->id, $payload['source_id']);
        $this->assertNotNull($payload['source']);
        $this->assertSame($source->id, $payload['source']['id']);
        $this->assertSame('caldav', $payload['source']['type']);
        $this->assertSame('My CalDAV', $payload['source']['name']);
        $this->assertSame('me@example.com', $payload['source']['username']);
        $this->assertSame('#ff8800', $payload['source']['color']);
        $this->assertTrue($payload['selectable']);
        $this->assertNull($payload['archived_at']);
    }

    public function testArchivedMirrorIsNotSelectableAndKeepsTheOriginalName(): void
    {
        $user = User::factory()->create();

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'user_id' => $user->id,
            'type' => 'ics',
            'name' => 'Soon to be gone',
            'url' => encrypt('https://cal.example.com/feed.ics'),
        ])->save();

        $mirrorId = Calendar::where('source_id', $source->id)->value('id');
        $source->delete();

        $mirror = Calendar::withTrashed()->findOrFail($mirrorId);
        // The mirror was never soft-deleted; only its source went away.
        $this->assertNull($mirror->deleted_at);

        $payload = (new CalendarResource($mirror->fresh()->load('source')))
            ->toArray(new Request);

        $this->assertSame($mirrorId, $payload['id']);
        $this->assertNull($payload['source_id'], 'FK ON DELETE SET NULL should have nulled source_id.');
        $this->assertNull($payload['source'], 'No source block when source_id is null.');
        $this->assertFalse($payload['selectable'], 'Picker must skip archived rows.');
        $this->assertNotNull($payload['archived_at']);
    }

    public function testGoogleSourceExposesTypeAndUsernameForTheBadge(): void
    {
        $user = User::factory()->create();

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'user_id' => $user->id,
            'type' => 'google',
            'name' => 'Personal',
            'url' => encrypt('https://www.googleapis.com/calendar/v3'),
            'username' => 'alice@gmail.com',
            'color' => '#4285f4',
        ])->save();

        $mirror = Calendar::where('source_id', $source->id)->firstOrFail();
        $payload = (new CalendarResource($mirror->load('source')))
            ->toArray(new Request);

        // Two Google accounts with overlapping calendar names appear
        // as two distinct rows distinguished by the account email in
        // the badge. The badge reads `type` (icon) and `username`
        // (disambiguation label).
        $this->assertSame('google', $payload['source']['type']);
        $this->assertSame('alice@gmail.com', $payload['source']['username']);
        $this->assertSame('Personal', $payload['source']['name']);
    }

    public function testMirrorRowEmbedsSourceBlockWithoutEagerLoad(): void
    {
        // F4 - the resource must never return `source: null` when
        // `source_id` is set, even if the caller forgets `with('source')`.
        // Laravel lazy-loads the relation when `$this->source` is accessed.
        $user = User::factory()->create();

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'user_id' => $user->id,
            'type' => 'ics',
            'name' => 'Subscription',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'username' => 'sub@example.com',
            'color' => '#ff00ff',
        ])->save();

        $mirror = Calendar::where('source_id', $source->id)->firstOrFail();
        // Deliberately NOT calling ->load('source')
        $payload = (new CalendarResource($mirror))->toArray(new Request);

        $this->assertSame($source->id, $payload['source_id']);
        $this->assertNotNull($payload['source'], 'Source block must be present via lazy load.');
        $this->assertSame('ics', $payload['source']['type']);
        $this->assertSame('Subscription', $payload['source']['name']);
        $this->assertSame('sub@example.com', $payload['source']['username']);
        $this->assertSame('#ff00ff', $payload['source']['color']);
    }

    public function testSourceColorAndUsernameChangeReflectedInResource(): void
    {
        // F6 - the mirror only denormalizes `name`. When the source's
        // `color` or `username` changes, the resource must reflect the
        // new values because it reads the live `source` relation.
        $user = User::factory()->create();

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'user_id' => $user->id,
            'type' => 'google',
            'name' => 'Personal',
            'url' => encrypt('https://www.googleapis.com/calendar/v3'),
            'username' => 'old@gmail.com',
            'color' => '#4285f4',
        ])->save();

        $mirror = Calendar::where('source_id', $source->id)->firstOrFail();
        $payloadBefore = (new CalendarResource($mirror->load('source')))
            ->toArray(new Request);
        $this->assertSame('#4285f4', $payloadBefore['source']['color']);
        $this->assertSame('old@gmail.com', $payloadBefore['source']['username']);

        // Update the source's color and username
        $source->color = '#ff0000';
        $source->username = 'new@gmail.com';
        $source->save();

        // Resource reads live source relation - no eager load needed
        $payloadAfter = (new CalendarResource($mirror->fresh()))
            ->toArray(new Request);
        $this->assertSame('#ff0000', $payloadAfter['source']['color'], 'Color change must be reflected.');
        $this->assertSame('new@gmail.com', $payloadAfter['source']['username'], 'Username change must be reflected.');
        // Name is denormalized on the mirror and synced by observer
        $this->assertSame('Personal', $payloadAfter['source']['name']);
    }
}
