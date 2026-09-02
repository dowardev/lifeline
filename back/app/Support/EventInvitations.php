<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Support;

use App\Mail\EventInvitation;
use App\Models\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Normalization and best-effort sending of event guest invitation emails.
 * Sending is fail-open (FR-42): persistence/response must never be blocked by
 * a mail transport failure, so any transport exception is swallowed and logged.
 */
class EventInvitations
{
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
            $raw = is_string($guest) ? $guest : (is_array($guest) ? ($guest['email'] ?? null) : null);
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
     * Send invitation emails to (net-new) event guests, synchronously, best-effort.
     *
     * On create the previous list is empty so every normalized guest is sent to.
     * On update only guests not present in the persisted pre-update list receive an
     * invitation. Each send is wrapped in try/catch so a transport failure can never
     * block the create/update transaction; every skipped invalid/empty/duplicate and
     * every send failure is logged.
     *
     * @param  string[]  $previousEmails  normalized email addresses from before the update
     */
    public static function sendInvitationsFor(Event $event, array $previousEmails, bool $isCreate): void
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
            foreach ($previousEmails as $email) {
                if (is_string($email) && trim($email) !== '') {
                    $previous[strtolower(trim($email))] = true;
                }
            }
        }

        foreach ($current as $email) {
            if (isset($previous[$email])) {
                continue;
            }

            try {
                Mail::to($email)->send(new EventInvitation($event));
            } catch (\Throwable $e) {
                Log::warning("Event invitation send failed for {$email} (event id {$event->id}): {$e->getMessage()}");
            }
        }
    }
}