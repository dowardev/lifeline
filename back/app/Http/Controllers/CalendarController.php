<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Http\Controllers;

use App\Http\Resources\CalendarResource;
use App\Models\Calendar;
use App\Models\Event;
use App\Services\DefaultCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 50);

        // LBDS-292 - the default calendar is provisioned lazily here as
        // well: an account that predates this rule (or that was created by
        // a path that does not provision it) must still end up with its
        // protected default the first time it lists its calendars.
        DefaultCalendarService::ensureForUser($request->user());

        // LBDS-305 - `with('source')` so the resource can embed the
        // source block (type / username / color) in one round-trip.
        // Without eager-loading, every row in the picker would issue
        // a separate SELECT against `calendar_sources`. The relation
        // is `belongsTo`, so missing sources (legacy local rows) come
        // back as null and the resource renders `source: null`.
        $calendars = Calendar::where('user_id', $request->user()->id)
            ->with('source:id,type,name,color,username')
            ->paginate($perPage);

        return CalendarResource::collection($calendars);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $calendar = new Calendar([
            'name' => $request->name,
            'default' => 0,
        ]);
        $calendar->user_id = $request->user()->id;
        $calendar->save();

        return response()->json(['calendar' => new CalendarResource($calendar)], 201);
    }

    public function update(Request $request, $id)
    {
        $calendar = Calendar::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        // LBDS-292 - the default calendar is a protected element: its name
        // (the only editable field `calendars` has) is not editable.
        if (DefaultCalendarService::isProtected($calendar)) {
            return response()->json([
                'message' => 'The default calendar cannot be edited',
            ], 403);
        }

        $request->validate(['name' => 'required|string|max:255']);
        $calendar->update(['name' => $request->name]);

        return response()->json(['calendar' => new CalendarResource($calendar)]);
    }

    /**
     * LBDS-292 - deletes a calendar the user owns.
     *
     * The default calendar can never be deleted, and neither can a mirror
     * of an external source (those are managed by the `calendar_sources`
     * lifecycle, LBDS-305).
     *
     * A calendar the user created offers exactly two ways out, and both
     * end with the calendar gone:
     *
     *   - `strategy=delete_events` (the default): the calendar and its
     *     events are destroyed together.
     *   - `strategy=move&destination_calendar_id=<id>`: the events are
     *     moved to another LOCAL calendar of the same account and the
     *     source calendar is deleted.
     *
     * There is no third way: no event is ever left without a calendar.
     */
    public function destroy(Request $request, $id)
    {
        $calendar = Calendar::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        if (DefaultCalendarService::isProtected($calendar)) {
            return response()->json([
                'message' => 'The default calendar cannot be deleted',
            ], 403);
        }

        if ($calendar->source_id !== null) {
            return response()->json([
                'message' => 'This calendar comes from a connected account and cannot be deleted here',
            ], 403);
        }

        // LBDS-292 - the strategy is REQUIRED, never implicit. A DELETE
        // body can be stripped by a proxy or a CDN; with an implicit
        // default the request would then destroy the events instead of
        // moving them. An explicit contract turns that into a 422
        // instead of silent data loss.
        $request->validate([
            'strategy' => 'required|in:delete_events,move',
            'destination_calendar_id' => 'nullable|integer',
        ]);

        $strategy = $request->input('strategy');

        // The whole deletion is one transaction: the events move (or go)
        // and the calendar disappears together. A partial failure would
        // otherwise destroy the events of a calendar that stays alive, or
        // move the events and leave the source calendar behind.
        //
        // The transaction is retried (up to three attempts) when the
        // database reports a CONCURRENCY failure - a deadlock or a lock
        // wait timeout: the transaction rolls back whole, so a retry
        // starts from the same state and never leaves a half-deleted
        // calendar behind.
        DB::transaction(function () use ($request, $calendar, $strategy) {
            $this->deleteCalendarWithStrategy($request, $calendar, $strategy);
        }, 3);

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Applies the deletion strategy: the events are moved to the
     * destination or destroyed with the calendar, and the calendar
     * disappears. Never leaves an event without a calendar.
     */
    private function deleteCalendarWithStrategy(Request $request, Calendar $calendar, string $strategy): void
    {
        // The rows involved are locked for the rest of the transaction:
        // a concurrent deletion of the source (or of the destination)
        // cannot interleave with this one, so no event can be moved into
        // a calendar that is being deleted underneath it.
        Calendar::where('id', $calendar->id)->lockForUpdate()->first();

        if ($strategy === 'move') {
            $destination = $this->resolveMoveDestination($request, $calendar);

            // The destination is locked before a single event is moved
            // into it. If it was deleted in the meantime, the request
            // fails instead of leaving the events on a calendar that is
            // gone.
            $locked = Calendar::where('id', $destination->id)->lockForUpdate()->first();

            if (! $locked) {
                abort(422, 'Destination calendar must be a local calendar of the account');
            }

            // The events move first: the calendar is deleted afterwards, so
            // no event is ever left pointing at a calendar that is gone.
            Event::where('calendar_id', $calendar->id)
                ->where('user_id', $request->user()->id)
                ->update(['calendar_id' => $destination->id]);
        } else {
            // The events are destroyed with the calendar. `forceDelete`
            // (not the soft delete) is what keeps the invariant: a
            // soft-deleted event would keep pointing at a trashed
            // calendar, which is the "event without a calendar" state the
            // rule forbids.
            Event::where('calendar_id', $calendar->id)
                ->where('user_id', $request->user()->id)
                ->forceDelete();
        }

        $calendar->forceDelete();
    }

    /**
     * The destination of a "move" must be a LOCAL calendar owned by the
     * same account: a mirror of an external source cannot host a local
     * event, and the default calendar is the natural fallback when the
     * client does not pick one.
     */
    private function resolveMoveDestination(Request $request, Calendar $calendar): Calendar
    {
        $destinationId = $request->input('destination_calendar_id');

        if ($destinationId === null) {
            $default = DefaultCalendarService::ensureForUser($request->user());

            if ($default->source_id !== null) {
                abort(422, 'Destination calendar must be a local calendar of the account');
            }

            return $default;
        }

        $destination = Calendar::where('id', $destinationId)
            ->where('user_id', $request->user()->id)
            ->whereNull('archived_at')
            ->whereNull('source_id')
            ->first();

        if (! $destination) {
            abort(422, 'Destination calendar must be a local calendar of the account');
        }

        if ($destination->id === $calendar->id) {
            abort(422, 'Destination calendar must be different from the deleted one');
        }

        return $destination;
    }
}
