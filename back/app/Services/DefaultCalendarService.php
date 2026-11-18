<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Services;

use App\Models\Calendar;
use App\Models\User;
use Illuminate\Database\QueryException;
use RuntimeException;

/**
 * LBDS-292 - the "protected default calendar" invariant.
 *
 * Every account owns exactly one active default calendar (`default = 1`,
 * `archived_at IS NULL`). It is provisioned automatically, it is local (it
 * does not mirror an external source) and it can neither be renamed nor
 * deleted: it is the anchor every event falls back to.
 *
 * The "at most one default per user" half of the invariant is enforced by
 * the DATABASE (`calendars_default_user_id_unique` over the generated
 * `default_user_id` column, LBDS-305). This service owns the "at least one"
 * half, and it does so without holding a row lock: when two requests race to
 * provision the default, the second INSERT is rejected by that index and the
 * loser simply reads the winner's row.
 */
class DefaultCalendarService
{
    /**
     * The name of the auto-provisioned default calendar. It is the same
     * name Google Calendar and Outlook use for the primary calendar, and it
     * is what the existing seeded calendar in this repo is called.
     */
    public const DEFAULT_NAME = 'Personal';

    /**
     * How many times a provisioning INSERT is retried when the database
     * reports a TRANSIENT failure (a deadlock or a lock wait timeout).
     *
     * Three attempts is the usual balance: enough to ride out a short
     * contention window, few enough that a real outage still surfaces
     * quickly instead of holding the request open.
     *
     * Those failures say nothing about the invariant: the row was never
     * written, so the request can simply try again. Everything else (a
     * unique violation, a truncated value, a dead connection) is a real
     * error and has to surface.
     */
    private const TRANSIENT_ATTEMPTS = 3;

    /**
     * How many times the provisioning reads the default slot and tries to
     * take it before it gives up and returns the winner's row.
     *
     * Three passes is enough for the realistic race: pass one loses the
     * index to a concurrent request, pass two finds that winner and, if
     * it turned out to be a MIRROR, gives the slot up, and pass three
     * creates the account's own local default.
     */
    private const COLLISION_PASSES = 3;

    /**
     * The user's active default calendar, or null when they have none.
     *
     * Soft-deleted rows are excluded by the model's global scope and
     * archived mirrors are excluded explicitly: an archived row no longer
     * occupies the default slot (the generated `default_user_id` column is
     * NULL for it), so it must not be handed out as the default either.
     */
    public static function defaultFor(User $user): ?Calendar
    {
        return Calendar::where('user_id', $user->id)
            ->where('default', true)
            ->whereNull('archived_at')
            ->first();
    }

    /**
     * The user's active default calendar, provisioning it when missing.
     *
     * Idempotent: calling it twice returns the same row. Safe under
     * concurrency: the unique index over the generated `default_user_id`
     * column rejects a second active default, and the loser re-reads the
     * winner's row instead of failing the request.
     */
    public static function ensureForUser(User $user): Calendar
    {
        // The whole provisioning sequence (the SELECT that reads the
        // current default, the UPDATE that gives the slot up and the
        // INSERT that creates the row) can hit a TRANSIENT database
        // failure - a deadlock or a lock wait timeout - while another
        // request is working on the same rows. Those failures say nothing
        // about the invariant: nothing was written, so the whole sequence
        // is simply attempted again, re-reading the state each time.
        //
        // Every OTHER error (a unique violation, a truncated value, a dead
        // connection) is a real fault and surfaces untouched.
        for ($attempt = 1; ; $attempt++) {
            try {
                return self::ensureLocalDefault($user);
            } catch (QueryException $e) {
                if ($attempt >= self::TRANSIENT_ATTEMPTS || ! self::isTransientDatabaseError($e)) {
                    throw $e;
                }

                // A short, growing pause before the next attempt: the
                // competing transaction needs the lock it is holding.
                usleep(20_000 * $attempt);
            }
        }
    }

    /**
     * The provisioning sequence itself, without the transient retry.
     */
    private static function ensureLocalDefault(User $user): Calendar
    {
        $lastCollision = null;

        // A pass resolves the default slot: it reads the current holder,
        // gives the slot up when a MIRROR holds it, restores a soft
        // deleted default and otherwise inserts the account's own local
        // default. When the INSERT loses the race against another
        // request, the next pass re-reads the state and tries again: the
        // winner may be a mirror, and a mirror has to give the slot up.
        for ($pass = 1; $pass <= self::COLLISION_PASSES; $pass++) {
            $existing = self::defaultFor($user);
            if ($existing !== null && $existing->source_id === null) {
                return $existing;
            }

            // A MIRROR is holding the default slot (LBDS-305 gave it to the
            // first source when the account had no default yet). The
            // protected default has to be a LOCAL calendar - it is the
            // anchor every event falls back to and the destination a
            // "move" can use - so the mirror gives the slot up.
            if ($existing !== null) {
                $existing->forceFill(['default' => false])->save();
            }

            // A SOFT-DELETED default may still be holding the unique slot: the
            // generated `default_user_id` column does not look at `deleted_at`,
            // so the index rejects a second active default for that account
            // even though the row is trashed. The default is a protected
            // element that can never be deleted, so it is RESTORED instead of
            // replaced (replacing it would cascade the account's events away,
            // because they still point at that row).
            $trashed = self::trashedDefaultFor($user);
            if ($trashed !== null) {
                $trashed->restore();

                return $trashed->fresh();
            }

            try {
                return self::createDefaultCalendar($user);
            } catch (QueryException $e) {
                // Another concurrent request won the default slot. The row
                // still exists (that request created it), so the loser
                // reads it instead of failing the request.
                //
                // Only the unique index over the generated
                // `default_user_id` column is a race worth retrying: any
                // other database error (a deadlock, a lock wait timeout, a
                // truncated value) has to surface instead of being masked
                // as "someone else won".
                if (! self::isDefaultSlotCollision($e)) {
                    throw $e;
                }

                // The next pass re-reads the state and tries again.
                $lastCollision = $e;
            }
        }

        // Every pass lost the race. The winner's row is the account's
        // default: it is local (a mirror would have given the slot up on
        // the previous pass), so it can be returned as is.
        $winner = self::defaultFor($user);
        if ($winner !== null && $winner->source_id === null) {
            return $winner;
        }

        throw $lastCollision ?? new RuntimeException('The default calendar slot could not be resolved');
    }

    /**
     * Insert the account's default calendar.
     *
     * The INSERT is the only write that can hit the unique index over the
     * generated `default_user_id` column; the caller turns that
     * collision into "read the winner's row" instead of a failure.
     */
    private static function createDefaultCalendar(User $user): Calendar
    {
        $calendar = new Calendar;
        $calendar->fill([
            'name' => self::DEFAULT_NAME,
            'default' => true,
            'user_id' => $user->id,
        ])->save();

        return $calendar;
    }

    /**
     * True when the failure is a transient database contention error
     * (MySQL deadlock 1213 or lock wait timeout 1205, SQLSTATE 40001).
     */
    private static function isTransientDatabaseError(QueryException $e): bool
    {
        $errorInfo = $e->errorInfo ?? [];
        $driverCode = (int) ($errorInfo[1] ?? 0);
        $sqlState = (string) ($errorInfo[0] ?? '');

        if (in_array($driverCode, [1205, 1213], true) || $sqlState === '40001') {
            return true;
        }

        $message = strtolower($e->getMessage());

        return str_contains($message, 'deadlock')
            || str_contains($message, 'lock wait timeout')
            || str_contains($message, 'lock timeout');
    }

    /**
     * True when the failure is the unique index over the generated
     * `default_user_id` column rejecting a second active default for the
     * same user (as opposed to any other database error).
     */
    private static function isDefaultSlotCollision(QueryException $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'calendars_default_user_id_unique')
            || str_contains($message, 'default_user_id');
    }

    /**
     * The user's soft-deleted default calendar, when there is one.
     *
     * Only a LOCAL row qualifies: restoring a MIRROR as the default would
     * put an external calendar in the protected slot, and the default has
     * to be the local anchor every event falls back to.
     */
    private static function trashedDefaultFor(User $user): ?Calendar
    {
        return Calendar::withTrashed()
            ->where('user_id', $user->id)
            ->where('default', true)
            ->whereNull('source_id')
            ->whereNull('archived_at')
            ->whereNotNull('deleted_at')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * True when the calendar is the user's default: the protected element
     * that can neither be edited nor deleted (LBDS-292, S3).
     */
    public static function isProtected(Calendar $calendar): bool
    {
        return (bool) $calendar->default && $calendar->archived_at === null;
    }
}
