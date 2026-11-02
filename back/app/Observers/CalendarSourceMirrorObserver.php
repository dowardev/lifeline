<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Observers;

use App\Models\Calendar;
use App\Models\CalendarSource;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

/**
 * LBDS-305 - keeps a `calendars` row in sync with each
 * `CalendarSource` so the event modal's "Calendario" picker
 * (which only knows about `calendars`) can list external sources
 * alongside local calendars.
 *
 * Lifecycle:
 *   - `created`  -> insert a `calendars` row linked back to the
 *                   source. If the user has no other active default,
 *                   the new mirror takes the default slot.
 *   - `updated`  -> if the source was renamed, propagate the new
 *                   name to the (non-archived) mirror.
 *   - `deleting` -> archive the mirror BEFORE the source is deleted
 *                   (so we can still locate it by `source_id`); the
 *                   FK cascade nulls `source_id` once the DELETE
 *                   commits. Events bound to the mirror keep
 *                   resolving because they point at `calendars.id`,
 *                   not `calendar_sources.id`.
 *
 * Guest sources (no `user_id`, no `users` row) are skipped: a
 * `calendars` row needs a `user_id` (NOT NULL FK) and a guest has
 * no such row. The source itself is still created; the picker just
 * stays empty for guests in v1.
 */
class CalendarSourceMirrorObserver
{
    public function created(CalendarSource $source): void
    {
        if ($source->user_id === null) {
            $this->logSkippedMirror($source);

            return;
        }

        $this->createMirror($source);
    }

    public function updated(CalendarSource $source): void
    {
        // F2 - the `users` row can appear AFTER the source was created
        // (the source is connected before the user's local row exists
        // on first login). `ResolveSsoUser` links the source to its
        // user once that row exists, and the mirror that could not be
        // created back then is created now. Without this, the source
        // would stay invisible in the picker forever.
        if ($source->wasChanged('user_id') && $source->user_id !== null) {
            // F4 - look at EVERY row carrying this `source_id`, not
            // only the alive ones: a soft-deleted mirror is still
            // that source's mirror, and creating a second one would
            // duplicate the row. The unique index on
            // `calendars.source_id` is the backstop; this check keeps
            // the observer from tripping over it.
            $mirror = Calendar::withTrashed()->where('source_id', $source->id)->first();
            if ($mirror === null) {
                $this->createMirror($source);

                return;
            }
        }

        if (! $source->wasChanged('name')) {
            return;
        }
        // Only follow the rename on a still-alive mirror. An archived
        // mirror has no source (FK nulled) and the picker skips it
        // anyway; the new name belongs to the new mirror the next
        // time the user reconnects a same-name source.
        //
        // F6 - the mirror only denormalizes `name`. The frontend reads
        // `color`/`username`/`type` from the embedded `source` block,
        // which the resource (CalendarResource) now lazy-loads via the
        // `source` relation (see F4). No additional denormalization is
        // needed; the live source is always the source of truth for
        // those fields.
        Calendar::where('source_id', $source->id)
            ->whereNull('archived_at')
            ->update(['name' => $source->name]);
    }

    public function deleting(CalendarSource $source): void
    {
        // Locate by `source_id` BEFORE the DELETE commits (the FK
        // cascade has not nulled it yet). Stamping `archived_at` in
        // `deleting` (not `deleted`) is what makes the picker skip
        // the ghost row from the next modal open onwards.
        Calendar::where('source_id', $source->id)
            ->whereNull('archived_at')
            ->update(['archived_at' => now()]);
    }

    /**
     * Creates the `calendars` row that mirrors a source.
     *
     * F1 - the "one active default per user" invariant is enforced by
     * the DATABASE (the `calendars_default_user_id_unique` index over
     * a generated column), not by a row lock.
     *
     * A row lock would have to be held until the OUTERMOST transaction
     * commits (Laravel nested transactions only open a savepoint), so
     * an explicit `lockForUpdate()` here would keep the lock for the
     * whole of an enclosing transaction. Relying on the unique index
     * keeps the insert atomic and the lock scope local: if two
     * concurrent creations both believe they may claim the default
     * slot, the second INSERT is rejected by the index and retried
     * without the flag.
     */
    private function createMirror(CalendarSource $source): void
    {
        try {
            $this->insertMirror($source, claimDefault: true);
        } catch (QueryException $e) {
            if (! $this->isDefaultSlotCollision($e)) {
                throw $e;
            }
            // Another concurrent creation won the default slot. The
            // mirror still has to exist, just without the flag.
            $this->insertMirror($source, claimDefault: false);
        }
    }

    /**
     * Inserts the mirror row, optionally claiming the user's single
     * active default slot.
     */
    private function insertMirror(CalendarSource $source, bool $claimDefault): void
    {
        $hasActiveDefault = Calendar::where('user_id', $source->user_id)
            ->where('default', true)
            ->whereNull('archived_at')
            ->exists();

        $mirror = new Calendar;
        $mirror->fill([
            'name' => $source->name,
            'user_id' => $source->user_id,
            'source_id' => $source->id,
            'default' => $claimDefault && ! $hasActiveDefault,
        ])->save();
    }

    /**
     * True when the failure is the unique index over the generated
     * `default_user_id` column rejecting a second active default for
     * the same user (as opposed to any other database error).
     */
    private function isDefaultSlotCollision(QueryException $e): bool
    {
        $message = strtolower($e->getMessage());

        return str_contains($message, 'calendars_default_user_id_unique')
            || str_contains($message, 'default_user_id');
    }

    /**
     * F2 - the skip has to be observable, but a guest source is a
     * documented, expected case (no `users` row, so `calendars.user_id`
     * cannot be filled). A guest is logged as info; a real account that
     * could not be resolved is a warning.
     */
    private function logSkippedMirror(CalendarSource $source): void
    {
        $context = [
            'source_id' => $source->id,
            'sso_sub' => $source->sso_sub,
        ];

        if (str_starts_with((string) $source->sso_sub, 'guest:')) {
            Log::info('LBDS-305 no mirror for guest source (no users row to link)', $context);

            return;
        }

        Log::warning('LBDS-305 mirror skipped: source has no resolvable user_id', $context);
    }
}
