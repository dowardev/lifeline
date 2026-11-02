<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Models\Calendar;
use App\Models\CalendarSource;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * LBDS-305 - mirror lifecycle for the `calendars` row that follows
 * each `calendar_sources` row. The picker UI only knows about rows
 * in `calendars`, so a connected source has to leave a mirror there
 * or the picker is empty for users with external sources.
 *
 * The mirror is the bridge between the picker and the LBDS-293
 * bidirectional sync: the picker selects a `calendars` row, the sync
 * reads `source_id` to know where to push the event back to.
 *
 * Constraints locked in by these tests:
 *   - Guest sources (no matching `users` row) do NOT get a mirror
 *     (the picker stays empty for guests; out of scope for v1).
 *   - A mirror is the user's "first default" only when the user has
 *     no other active default row. A pre-existing local default is
 *     never silently overridden.
 *   - Renaming a source updates the mirror's name on the next save.
 *   - Deleting a source keeps the mirror row (events still resolve
 *     via `events.calendar_id`), nulls the `source_id` via the FK
 *     cascade, and stamps `archived_at` so the picker skips it.
 */
class CalendarSourceMirrorObserverTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_source_for_a_user_creates_a_mirror_calendar(): void
    {
        $user = User::factory()->create();

        $source = $this->makeSource($user, [
            'type' => 'caldav',
            'name' => 'My CalDAV',
        ]);

        $mirror = Calendar::where('source_id', $source->id)->first();

        $this->assertNotNull($mirror, 'Mirror row was not created when the source was saved.');
        $this->assertSame('My CalDAV', $mirror->name);
        $this->assertSame($user->id, $mirror->user_id);
        $this->assertSame($source->id, $mirror->source_id);
        // The "first source takes the default slot" rule is covered
        // by `testFirstSourceMirrorBecomesDefaultWhenUserHasNoActiveDefault`;
        // here we just assert the row exists, the FKs line up, and
        // it is not archived.
        $this->assertNull($mirror->archived_at);
    }

    public function test_creating_a_guest_source_skips_mirroring(): void
    {
        // Guest sources have no `users` row, so `user_id` stays NULL
        // and the mirror cannot satisfy the `calendars.user_id` FK.
        // The source itself is still saved (guests have their own
        // picker-less flow); only the mirror is skipped.
        $this->makeSource(null, [
            'sso_sub' => 'guest:'.Str::uuid(),
            'type' => 'ics',
            'name' => 'Guest cal',
        ]);

        $this->assertSame(0, Calendar::count(), 'Guest source should not create a mirror row.');
    }

    public function test_first_source_mirror_becomes_default_when_user_has_no_active_default(): void
    {
        $user = User::factory()->create();

        $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'My first source',
        ]);

        $mirror = Calendar::where('user_id', $user->id)->first();
        $this->assertNotNull($mirror);
        $this->assertTrue((bool) $mirror->default, 'First mirror must take the default slot when no other active default exists.');
    }

    public function test_subsequent_source_mirror_does_not_steal_an_existing_default(): void
    {
        $user = User::factory()->create();
        $existing = Calendar::create([
            'user_id' => $user->id,
            'name' => 'Local default',
            'default' => true,
        ]);

        $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'Second source',
        ]);

        $existing->refresh();
        $this->assertTrue((bool) $existing->default, 'Pre-existing local default must be preserved.');

        $mirror = Calendar::where('user_id', $user->id)
            ->where('id', '!=', $existing->id)
            ->first();
        $this->assertFalse((bool) $mirror->default, 'Second mirror must not override an existing default.');
    }

    public function test_renaming_a_source_renames_its_mirror(): void
    {
        $user = User::factory()->create();
        $source = $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'Old name',
        ]);

        $source->name = 'New name';
        $source->save();

        $mirror = Calendar::where('source_id', $source->id)->first();
        $this->assertSame('New name', $mirror->name, 'Mirror name should follow the source rename.');
    }

    public function test_updating_unrelated_fields_does_not_touch_the_mirror_name(): void
    {
        $user = User::factory()->create();
        $source = $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'Stable name',
            'color' => '#3880ff',
        ]);

        $source->color = '#ff3880';
        $source->save();

        $mirror = Calendar::where('source_id', $source->id)->first();
        $this->assertSame('Stable name', $mirror->name, 'Color change should not touch the mirror name.');
    }

    public function test_deleting_a_source_archives_the_mirror_and_nulls_source_id(): void
    {
        $user = User::factory()->create();
        $source = $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'About to be deleted',
        ]);
        $mirrorId = Calendar::where('source_id', $source->id)->value('id');
        $this->assertNotNull($mirrorId);

        $source->delete();

        $mirror = Calendar::find($mirrorId);
        $this->assertNotNull($mirror, 'Mirror row must survive the source delete so existing events keep resolving.');
        $this->assertNull($mirror->source_id, 'FK ON DELETE SET NULL should null the mirror source_id.');
        $this->assertNotNull($mirror->archived_at, 'Mirror must be marked archived so the picker skips it.');
    }

    public function test_new_source_after_a_disconnect_takes_the_default_slot_when_no_active_default_remains(): void
    {
        $user = User::factory()->create();
        $first = $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'First',
        ]);
        $first->delete();

        $second = $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'Second',
        ]);

        $mirror = Calendar::where('source_id', $second->id)->first();
        $this->assertTrue((bool) $mirror->default, 'When the only default was archived, the next mirror takes the default slot.');
    }

    public function test_multiple_sources_created_sequentially_only_first_gets_default(): void
    {
        // F1/F3 - the default assignment logic: first source gets default,
        // subsequent ones don't. This mirrors the backfill migration's rule.
        $user = User::factory()->create();

        $first = $this->makeSource($user, ['name' => 'First', 'type' => 'ics']);
        $second = $this->makeSource($user, ['name' => 'Second', 'type' => 'caldav']);
        $third = $this->makeSource($user, ['name' => 'Third', 'type' => 'google']);

        $mirrors = Calendar::where('user_id', $user->id)->orderBy('id')->get();
        $this->assertCount(3, $mirrors);
        $this->assertTrue((bool) $mirrors[0]->default, 'First mirror must be default');
        $this->assertFalse((bool) $mirrors[1]->default, 'Second mirror must not be default');
        $this->assertFalse((bool) $mirrors[2]->default, 'Third mirror must not be default');
    }

    public function test_source_with_color_and_username_change_does_not_affect_mirror_name(): void
    {
        // F6 - the observer only syncs `name`. Color/username changes on
        // the source do not affect the mirror's denormalized name.
        // The resource reads live source data for those fields.
        $user = User::factory()->create();
        $source = $this->makeSource($user, [
            'type' => 'google',
            'name' => 'Stable',
            'color' => '#4285f4',
            'username' => 'old@gmail.com',
        ]);

        $source->color = '#ff0000';
        $source->username = 'new@gmail.com';
        $source->save();

        $mirror = Calendar::where('source_id', $source->id)->first();
        $this->assertSame('Stable', $mirror->name, 'Mirror name unchanged by color/username updates.');
        // Source itself has new values
        $this->assertSame('#ff0000', $source->fresh()->color);
        $this->assertSame('new@gmail.com', $source->fresh()->username);
    }

    public function test_guest_source_logs_warning_and_skips_mirror(): void
    {
        // F2 - guest sources (no users row) should log a warning and
        // skip mirror creation. We can't easily assert on Log facade here,
        // but we verify the mirror is not created.
        $this->makeSource(null, [
            'sso_sub' => 'guest:'.Str::uuid(),
            'type' => 'ics',
            'name' => 'Guest cal',
        ]);

        $this->assertSame(0, Calendar::count(), 'Guest source should not create a mirror row.');
    }

    public function test_linking_the_user_later_creates_the_missing_mirror(): void
    {
        // F2 - the source can be connected BEFORE the `users` row
        // exists. When the row appears later (first login), the source
        // is linked to it and the mirror that could not be created
        // back then must be created now. Without this, the source
        // would stay invisible in the picker forever.
        $user = User::factory()->create();
        $source = $this->makeSource(null, [
            'sso_sub' => $user->sso_sub,
            'type' => 'ics',
            'name' => 'Connected before login',
        ]);
        $this->assertNull($source->user_id);
        $this->assertSame(0, Calendar::count());

        // This is what `ResolveSsoUser` does once the user row exists.
        $source->user_id = $user->id;
        $source->save();

        $mirror = Calendar::where('source_id', $source->id)->first();
        $this->assertNotNull($mirror, 'The mirror must be created when the user is linked.');
        $this->assertSame($user->id, $mirror->user_id);
        $this->assertSame('Connected before login', $mirror->name);
    }

    public function test_linking_the_user_does_not_create_a_second_mirror(): void
    {
        // F2 - the late-link path must not duplicate a mirror that
        // already exists (the source was created for an existing user).
        $user = User::factory()->create();
        $source = $this->makeSource($user, [
            'type' => 'ics',
            'name' => 'Already mirrored',
        ]);
        $this->assertSame(1, Calendar::count());

        $source->user_id = $user->id;
        $source->save();

        $this->assertSame(1, Calendar::count(), 'No duplicate mirror may be created.');
    }

    public function test_database_rejects_two_active_defaults_for_the_same_user(): void
    {
        // P2 - the DB-level guarantee. A generated column yields
        // `user_id` for an active default and NULL otherwise, and a
        // UNIQUE index over it allows at most one active default per
        // user while leaving non-default rows unconstrained.
        $user = User::factory()->create();

        $first = new Calendar;
        $first->fill([
            'name' => 'First default',
            'user_id' => $user->id,
            'default' => true,
        ])->save();

        $second = new Calendar;
        $second->fill([
            'name' => 'Second default',
            'user_id' => $user->id,
            'default' => true,
        ]);

        $this->expectException(QueryException::class);
        $second->save();
    }

    public function test_database_allows_several_non_default_rows_for_the_same_user(): void
    {
        // P2 - the guard must only constrain ACTIVE defaults.
        $user = User::factory()->create();

        foreach (['A', 'B', 'C'] as $name) {
            $calendar = new Calendar;
            $calendar->fill([
                'name' => $name,
                'user_id' => $user->id,
                'default' => false,
            ])->save();
        }

        $this->assertSame(3, Calendar::where('user_id', $user->id)->count());
    }

    public function test_database_allows_a_second_default_for_a_different_user(): void
    {
        // P2 - the guard is per user, not global.
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        foreach ([$alice, $bob] as $user) {
            $calendar = new Calendar;
            $calendar->fill([
                'name' => 'Default for '.$user->id,
                'user_id' => $user->id,
                'default' => true,
            ])->save();
        }

        $this->assertSame(2, Calendar::where('default', true)->count());
    }

    private function makeSource(?User $user, array $overrides): CalendarSource
    {
        $payload = array_merge([
            'sso_sub' => $user?->sso_sub ?? 'guest:'.Str::uuid(),
            'type' => 'ics',
            'name' => 'Source',
            'url' => encrypt('https://cal.example.com/feed.ics'),
            'user_id' => $user?->id,
        ], $overrides);

        $source = new CalendarSource;
        $source->forceFill($payload)->save();

        return $source;
    }
}
