<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Support;

use App\Mail\EventInvitation;
use App\Models\Event;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Normalization and best-effort sending of event guest invitation emails.
 * Sending is fail-open (FR-42): persistence/response must never be blocked by
 * a mail transport failure, so any transport exception is swallowed and logged.
 * Journal (event_invitation_sends) failures are likewise fail-open: on a DB
 * error the affected guest is skipped (at-most-once wins over best-effort) and
 * the event save/response is never blocked.
 */
class EventInvitations
{
    /** Max invitation sends per user per hour (abuse limit). */
    public const MAX_SENDS_PER_USER_HOUR = 100;

    private const SECONDS_PER_HOUR = 3600;

    /**
     * Normalize a raw guest list into a deduped array of valid, lowercase emails.
     * Null/empty/invalid/duplicate entries are dropped.
     *
     * @param  array  $guests
     * @return string[]
     */
    public static function normalizeGuests(array $guests): array
    {
        $emails = [];

        foreach ($guests as $guest) {
            // Accept both plain email strings and objects shaped { email: '...' }.
            $raw = self::extractEmail($guest);
            if (! is_string($raw) || trim($raw) === '') {
                continue;
            }

            $email = strtolower(trim($raw));

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                continue;
            }

            $emails[$email] = $email;
        }

        return array_values($emails);
    }

    /**
     * Extract an email string from a guest entry, accepting both plain strings
     * and legacy objects shaped { email: '...' }.
     */
    private static function extractEmail(mixed $guest): ?string
    {
        return is_string($guest) ? $guest : (is_array($guest) ? ($guest['email'] ?? null) : null);
    }

    /**
     * Send invitation emails to (net-new) event guests, synchronously, best-effort.
     *
     * On create the previous list is empty so every normalized guest is sent to.
     * On update only guests not present in the persisted pre-update list receive an
     * invitation. Each send is wrapped in try/catch so a transport failure can never
     * block the create/update transaction; every skipped invalid/empty/duplicate and
     * every send failure is logged.
     *
     * Delivery is additionally hardened by a persistent journal
     * (event_invitation_sends): before sending, each (event, email) pair is
     * claimed atomically via a UNIQUE-key insertOrIgnore, so at most one
     * invitation is ever sent to a given guest for a given event, even under
     * retries or concurrent requests. Deleting and re-adding a guest does not
     * resend, because the journal row survives the guest removal.
     *
     * A per-user rate limit (100 invitations/hour) is enforced through
     * RateLimiter; when the limiter is exhausted the call stops sending and
     * warns once, leaving the remaining guests unclaimed.
     *
     * @param  string[]  $previousEmails  pre-update guests (plain emails or legacy { email } shapes)
     */
    public static function sendInvitationsFor(Event $event, array $previousEmails, bool $isCreate, int $userId): void
    {
        $current = [];

        foreach ((array) $event->guests as $guest) {
            if (! is_string($guest) || trim($guest) === '') {
                Log::warning("Event invitation skipped (empty guest) for event id {$event->id}");

                continue;
            }

            $email = strtolower(trim($guest));

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Event invitation skipped (invalid email: {$guest}) for event id {$event->id}");

                continue;
            }

            if (isset($current[$email])) {
                Log::warning("Event invitation skipped (duplicate email: {$email}) for event id {$event->id}");

                continue;
            }

            $current[$email] = $email;
        }

        $previous = [];
        if (! $isCreate) {
            foreach ($previousEmails as $guest) {
                $email = self::extractEmail($guest);
                if (is_string($email) && trim($email) !== '') {
                    $previous[strtolower(trim($email))] = true;
                }
            }
        }

        $limiterKey = "invitations:{$userId}";
        $limitWarned = false;

        foreach ($current as $email) {
            if (isset($previous[$email])) {
                continue;
            }

            if (RateLimiter::tooManyAttempts($limiterKey, self::MAX_SENDS_PER_USER_HOUR)) {
                if (! $limitWarned) {
                    Log::warning("Event invitation rate limit reached for user {$userId} (event id {$event->id}); remaining guests not claimed");
                    $limitWarned = true;
                }

                break;
            }

            try {
                // Claim the send atomically; only the caller that wins the insert
                // is allowed to send the email. Note: insertOrIgnore also swallows
                // non-duplicate DB errors as a non-claim; either way the result is
                // "do not send", which is accepted for dedup.
                $now = now();
                $claimed = DB::table('event_invitation_sends')->insertOrIgnore([
                    'event_id' => $event->id,
                    'email' => $email,
                    'sent_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } catch (\Throwable $e) {
                // Journal failure is fail-open: at-most-once wins, so skip this
                // guest without sending, and never block the event save/response.
                Log::warning("Event invitation journal claim failed for {$email} (event id {$event->id}): {$e->getMessage()}");

                continue;
            }

            if ($claimed === 0) {
                continue;
            }

            // Charge the limiter only for won claims; already-journaled guests
            // must not consume quota.
            RateLimiter::hit($limiterKey, self::SECONDS_PER_HOUR);

            try {
                Mail::to($email)->send(new EventInvitation($event));

                DB::table('event_invitation_sends')
                    ->where('event_id', $event->id)
                    ->where('email', $email)
                    ->update(['sent_at' => now()]);
            } catch (\Throwable $e) {
                // At-most-one guarantee wins: the claim row is kept even on
                // failure, so this guest will simply never receive the invite.
                Log::warning("Event invitation send failed for {$email} (event id {$event->id}): {$e->getMessage()}");
            }
        }
    }
}