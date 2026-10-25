<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Http\Middleware\ResolveCalendarOwner;
use App\Models\Calendar;
use App\Models\CalendarSource;
use App\Models\User;
use Dowardev\SsoServer\Client\SsoServerClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Mockery;
use Tests\TestCase;

// The ResolveSsoUser middleware type-hints a legacy TuOrg\... class name;
// alias the shipped Dowardev\... class so the container can resolve the
// mocked client under both names (same pattern as InvitationRoutesTest).
if (! class_exists('TuOrg\SsoServer\Client\SsoServerClient')) {
    class_alias(SsoServerClient::class, 'TuOrg\SsoServer\Client\SsoServerClient');
}

/**
 * LBDS-305 - the seams the fix round of the pre-merge review closed.
 *
 * Each test names the review finding it locks down:
 *   F3 - a source connected before the `users` row existed shows up in
 *        the picker on the very same request that resolves the user.
 *   F5 - `GET /calendars` does not degrade into an N+1 when the
 *        resource lazy-loads the `source` relation.
 *   F6 - the data migration's `down()` only removes mirrors; a local
 *        calendar survives it.
 *   F7 - the schema migration's `down()` is idempotent: running it
 *        twice does not fail.
 */
class CalendarMirrorSeamsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Authenticates with the given SSO sub through the real SSO
     * middleware stack. When `$sub` has no `users` row yet, the
     * middleware provisions it (that is the "first login" path).
     */
    private function actingAsSsoUser(string $sub, ?string $email = null): void
    {
        $ssoUser = new \Dowardev\SsoServer\Types\SsoUser($sub, 'Owner', $email, 'owner');
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
            'user' => 'owner' . uniqid(),
            'email' => 'owner+' . uniqid() . '@example.com',
            'password' => bcrypt('secret'),
            'sso_sub' => $ssoSub ?? 'sso:owner:' . uniqid(),
        ])->save();

        return $user;
    }

    public function testLateLinkedSourceAppearsInThePickerOnTheSameRequest(): void
    {
        // F3 - the source was connected while the account had no local
        // `users` row yet, so it could not get a mirror. The request
        // that provisions the user must link it AND expose it in the
        // picker payload of that very same request (the middleware
        // runs before the controller).
        $sub = 'sso:late-link';

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $sub,
            'type' => 'ics',
            'name' => 'Connected before the account existed',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => null,
        ])->save();

        $this->assertNull($source->user_id);
        $this->assertSame(0, Calendar::count(), 'No mirror can exist before the user is resolvable.');
        $this->assertNull(User::where('sso_sub', $sub)->first(), 'The account does not exist yet.');

        $this->actingAsSsoUser($sub, 'late-' . uniqid() . '@example.com');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->getJson('/api/v1/calendars');

        $response->assertOk();

        $user = User::where('sso_sub', $sub)->first();
        $this->assertNotNull($user, 'The account must be provisioned by the middleware.');

        $mirror = Calendar::where('source_id', $source->id)->first();
        $this->assertNotNull($mirror, 'The mirror must exist once the user is resolved.');
        $this->assertSame($user->id, $mirror->user_id);

        $rows = $response->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame($source->id, $rows[0]['source_id']);
        $this->assertSame('ics', $rows[0]['source']['type']);
        $this->assertTrue($rows[0]['selectable']);
    }

    public function testResolvingAnExistingUserDoesNotRunTheSourceLinking(): void
    {
        // F2 - the linking must NOT run on every authenticated request.
        // With the user already resolvable, the source linking is
        // unnecessary, so the observer must not fire and no mirror may
        // appear out of nowhere.
        $user = $this->makeUser('sso:existing');
        $this->actingAsSsoUser($user->sso_sub);

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'type' => 'ics',
            'name' => 'Already linked',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => $user->id,
        ])->save();

        $this->assertSame(1, Calendar::count(), 'The mirror was created when the source was saved.');

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->getJson('/api/v1/calendars');

        $response->assertOk();
        $this->assertSame(1, Calendar::count(), 'No extra mirror may be created.');
    }

    public function testIndexDoesNotRunOneQueryPerMirrorRow(): void
    {
        // F5 - the resource lazy-loads `source`, so the controller MUST
        // eager-load it. This test pins the query count: one query for
        // the calendars and one for the sources, regardless of how many
        // mirror rows there are.
        $user = $this->makeUser('sso:n-plus-one');
        $this->actingAsSsoUser($user->sso_sub);

        foreach (['One', 'Two', 'Three', 'Four'] as $index => $name) {
            $source = new CalendarSource;
            $source->forceFill([
                'sso_sub' => $user->sso_sub,
                'type' => 'caldav',
                'name' => $name,
                'url' => encrypt('https://cal.example.com/dav'),
                'user_id' => $user->id,
            ])->save();
        }

        $this->assertSame(4, Calendar::count());

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->getJson('/api/v1/calendars');

        $response->assertOk();
        $this->assertCount(4, $response->json('data'));

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $sourceQueries = array_filter(
            $queries,
            fn (array $q): bool => str_contains(strtolower($q['query']), 'from "calendar_sources"')
                || str_contains(strtolower($q['query']), 'from `calendar_sources`'),
        );

        $this->assertLessThanOrEqual(
            1,
            count($sourceQueries),
            'The source relation must be eager-loaded, not lazy-loaded per row. Queries: '
                . implode(' | ', array_column($queries, 'query')),
        );
    }

    public function testDataMigrationDownKeepsLocalCalendars(): void
    {
        // F6 - the backfill's `down()` removes the mirror rows. A local
        // calendar (no `source_id`) must survive it.
        $user = $this->makeUser('sso:local-survives');

        $local = new Calendar;
        $local->fill([
            'name' => 'Personal',
            'user_id' => $user->id,
            'default' => true,
        ])->save();

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'type' => 'ics',
            'name' => 'Mirror to remove',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => $user->id,
        ])->save();

        $this->assertSame(2, Calendar::count());

        $migration = require database_path(
            'migrations/2026_10_19_000003_backfill_mirror_calendars_for_existing_sources.php'
        );
        $migration->down();

        $this->assertNotNull(Calendar::find($local->id), 'A local calendar must survive the rollback.');
        $this->assertNull(
            Calendar::where('source_id', $source->id)->first(),
            'The mirror row must be gone after the rollback.',
        );
    }

    public function testSchemaMigrationDownIsIdempotent(): void
    {
        // F7 - the `down()` guards the generated column and its index,
        // so running it twice must not fail.
        $migration = require database_path(
            'migrations/2026_10_19_000002_add_source_id_to_calendars_table.php'
        );

        $migration->down();
        $migration->down();

        $this->assertTrue(true, 'The down() ran twice without throwing.');
    }

    public function testSourceIdIsUniqueAcrossMirrors(): void
    {
        // F4 - one source may have at most one mirror row. The unique
        // index over `source_id` is the backstop for the observer.
        $user = $this->makeUser('sso:unique-source');

        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => $user->sso_sub,
            'type' => 'ics',
            'name' => 'Only one mirror',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => $user->id,
        ])->save();

        $duplicate = new Calendar;
        $duplicate->fill([
            'name' => 'Duplicate mirror',
            'user_id' => $user->id,
            'source_id' => $source->id,
            'default' => false,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);
        $duplicate->save();
    }

    public function testGuestSourcesAreNeverMirrored(): void
    {
        // F3/F4 - a guest has no `users` row, so no mirror can be
        // created, and the guest flow stays on the documented path.
        $source = new CalendarSource;
        $source->forceFill([
            'sso_sub' => 'guest:' . \Illuminate\Support\Str::uuid(),
            'type' => 'ics',
            'name' => 'Guest cal',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => null,
        ])->save();

        $this->assertSame(0, Calendar::count());
        $this->assertSame(0, Calendar::withTrashed()->count());
    }
}
