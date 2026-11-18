<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace Tests\Feature;

use App\Mail\EventInvitation;
use App\Models\Calendar;
use App\Models\Event;
use App\Models\User;
use App\Support\EventInvitations;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * At-most-once delivery guarantees for guest invitation emails, backed by the
 * persistent event_invitation_sends journal (LBDS-220).
 */
class EventInvitationsDedupTest extends TestCase
{
    use RefreshDatabase;

    private function makeEvent(array $guests): Event
    {
        $user = new User;
        $user->forceFill([
            'name' => 'Test User',
            'user' => 'testuser',
            'email' => 'owner@example.com',
            'password' => bcrypt('secret'),
        ])->save();

        $event = new Event([
            'title' => 'Test event',
            'date_start' => now(),
            'date_end' => now()->addHour(),
            'time_zone' => 'UTC',
            'availability' => 'busy',
            'guests' => $guests,
            // LBDS-292 - an event always belongs to a calendar.
            'calendar_id' => Calendar::create([
                'name' => 'Personal',
                'user_id' => $user->id,
                'default' => true,
            ])->id,
        ]);
        $event->user_id = $user->id;
        $event->save();

        return $event;
    }

    public function test_create_sends_exactly_one_mail_per_guest(): void
    {
        Mail::fake();

        $event = $this->makeEvent(['a@example.com', 'b@example.com', 'A@example.com']);

        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);

        Mail::assertSent(EventInvitation::class, 2);

        $this->assertSame(
            ['a@example.com', 'b@example.com'],
            DB::table('event_invitation_sends')->where('event_id', $event->id)->orderBy('email')->pluck('email')->all()
        );
        $sentAts = DB::table('event_invitation_sends')->where('event_id', $event->id)->pluck('sent_at');
        $this->assertCount(2, $sentAts);
        foreach ($sentAts as $sentAt) {
            $this->assertNotNull($sentAt);
        }
    }

    public function test_retry_sends_no_additional_mails(): void
    {
        Mail::fake();

        $event = $this->makeEvent(['a@example.com', 'b@example.com']);

        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);
        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);
        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);

        Mail::assertSent(EventInvitation::class, 2);
        $this->assertSame(2, DB::table('event_invitation_sends')->where('event_id', $event->id)->count());
    }

    public function test_update_sends_only_to_new_guests_and_re_save_sends_nothing(): void
    {
        Mail::fake();

        $event = $this->makeEvent(['a@example.com']);
        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);
        Mail::assertSent(EventInvitation::class, 1);

        $previous = $event->guests;
        $event->update(['guests' => ['a@example.com', 'b@example.com']]);
        EventInvitations::sendInvitationsFor($event, $previous, false, $event->user_id);

        Mail::assertSent(EventInvitation::class, 2);

        // Re-saving with no guest changes sends nothing (even if previous list is stale).
        EventInvitations::sendInvitationsFor($event, [], false, $event->user_id);

        Mail::assertSent(EventInvitation::class, 2);
    }

    public function test_deleting_and_readding_guest_does_not_resend(): void
    {
        Mail::fake();

        $event = $this->makeEvent(['a@example.com', 'b@example.com']);
        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);
        Mail::assertSent(EventInvitation::class, 2);

        // Remove b@example.com.
        $previous = $event->guests;
        $event->update(['guests' => ['a@example.com']]);
        EventInvitations::sendInvitationsFor($event, $previous, false, $event->user_id);

        // Re-add b@example.com later: journal row still exists, so no resend.
        $previous = $event->fresh()->guests;
        $event->update(['guests' => ['a@example.com', 'b@example.com']]);
        EventInvitations::sendInvitationsFor($event, $previous, false, $event->user_id);

        Mail::assertSent(EventInvitation::class, 2);
    }

    public function test_legacy_object_shaped_previous_guests_do_not_resend(): void
    {
        Mail::fake();

        $event = $this->makeEvent(['a@example.com', 'b@example.com']);
        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);
        Mail::assertSent(EventInvitation::class, 2);

        // First update after deploy: legacy events may persist guests as
        // objects like { email: '...' }; no invitation may be re-sent.
        $previous = [['email' => 'A@example.com'], ['email' => 'b@example.com']];
        $event->update(['guests' => ['a@example.com', 'b@example.com', 'c@example.com']]);
        EventInvitations::sendInvitationsFor($event, $previous, false, $event->user_id);

        Mail::assertSent(EventInvitation::class, 3);
    }

    public function test_rate_limit_stops_further_sends_and_leaves_guests_unclaimed(): void
    {
        Mail::fake();

        $event = $this->makeEvent(['a@example.com', 'b@example.com']);

        $key = "invitations:{$event->user_id}";
        for ($i = 0; $i < EventInvitations::MAX_SENDS_PER_USER_HOUR; $i++) {
            RateLimiter::hit($key, 3600);
        }

        EventInvitations::sendInvitationsFor($event, [], true, $event->user_id);

        Mail::assertNothingSent();
        $this->assertSame(0, DB::table('event_invitation_sends')->where('event_id', $event->id)->count());
    }
}
