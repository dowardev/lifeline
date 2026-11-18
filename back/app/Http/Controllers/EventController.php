<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Calendar;
use App\Models\Event;
use App\Services\DefaultCalendarService;
use App\Support\EventInvitations;
use App\Support\ReminderOffsets;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'dateStart' => 'required|date',
            'dateEnd' => 'required|date',
            'timeZone' => 'required|string|max:100',
            'availability' => 'required|string|max:65535',
            'calendar_id' => 'nullable|integer',
            'notifications' => 'nullable|array',
            'repeat' => 'nullable|array',
            'guests' => 'nullable|array|max:50',
            'id_reminders' => 'nullable|array',
            'id_reminders.*' => 'integer',
            'description' => 'nullable|string|max:65535',
        ]);

        // LBDS-292 - an event never exists without a calendar. A request
        // without `calendar_id` (or with an explicit null) resolves to the
        // account's protected default calendar instead of persisting NULL.
        $calendar = $this->resolveCalendar($request);

        $event = new Event([
            'title' => $request->name,
            'calendar_id' => $calendar->id,
            'date_start' => Carbon::parse($request->dateStart),
            'date_end' => Carbon::parse($request->dateEnd),
            'time_zone' => $request->timeZone,
            'availability' => $request->availability,
            'notifications' => $request->notifications !== null ? ReminderOffsets::normalize($request->notifications ?? []) : null,
            'repeat' => $request->repeat,
            'guests' => EventInvitations::normalizeGuests($request->guests ?? []),
            'id_reminders' => $request->id_reminders,
            'description' => $request->description,
        ]);
        $event->user_id = $request->user()->id;
        $event->save();

        EventInvitations::sendInvitationsFor($event, [], true, $request->user()->id);

        return response()->json(['event' => new EventResource($event)], 201);
    }

    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 15);

        $events = Event::where('user_id', $request->user()->id)
            ->orderBy('date_start', 'desc')
            ->paginate($perPage);

        return EventResource::collection($events);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'dateStart' => 'sometimes|required|date',
            'dateEnd' => 'sometimes|required|date',
            'timeZone' => 'sometimes|string|max:100',
            'availability' => 'sometimes|string|max:65535',
            'calendar_id' => 'sometimes|nullable|integer',
            'notifications' => 'sometimes|nullable|array',
            'repeat' => 'sometimes|nullable|array',
            'guests' => 'sometimes|nullable|array|max:50',
            'id_reminders' => 'sometimes|nullable|array',
            'id_reminders.*' => 'integer',
            'description' => 'sometimes|nullable|string|max:65535',
        ]);

        $event = Event::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        $previousGuests = $event->guests ?? [];

        if ($request->has('calendar_id') && $request->calendar_id) {
            $calendar = Calendar::where('id', $request->calendar_id)
                ->where('user_id', $request->user()->id)
                ->first();
            if (! $calendar) {
                return response()->json(['message' => 'Calendar not found'], 404);
            }
        }

        $updates = [];
        if ($request->has('name')) {
            $updates['title'] = $request->name;
        }
        if ($request->has('guests')) {
            $updates['guests'] = EventInvitations::normalizeGuests($request->guests ?? []);
        }
        if ($request->has('timeZone')) {
            $updates['time_zone'] = $request->timeZone;
        }
        if ($request->has('description')) {
            $updates['description'] = $request->description;
        }
        if ($request->has('availability')) {
            $updates['availability'] = $request->availability;
        }
        if ($request->has('dateStart')) {
            $updates['date_start'] = Carbon::parse($request->dateStart);
        }
        if ($request->has('dateEnd')) {
            $updates['date_end'] = Carbon::parse($request->dateEnd);
        }
        if ($request->has('notifications')) {
            $updates['notifications'] = $request->notifications !== null ? ReminderOffsets::normalize($request->notifications ?? []) : null;
        }
        if ($request->has('repeat')) {
            $updates['repeat'] = $request->repeat;
        }
        if ($request->has('id_reminders')) {
            $updates['id_reminders'] = $request->id_reminders;
        }
        if ($request->has('calendar_id')) {
            // LBDS-292 - clearing the calendar is not a state the product
            // supports: an explicit null resolves to the account's default
            // calendar (the same rule as the create path) instead of
            // detaching the event from every calendar.
            $updates['calendar_id'] = $this->resolveCalendar($request, $event)->id;
        }

        $event->update($updates);

        EventInvitations::sendInvitationsFor($event, $previousGuests, false, $request->user()->id);

        return response()->json(['event' => new EventResource($event)]);
    }

    public function destroy(Request $request, $id)
    {
        $event = Event::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        $event->delete();

        return response()->json(['state' => true]);
    }

    /**
     * LBDS-292 - resolves the calendar an event belongs to.
     *
     * A `calendar_id` in the request must be a calendar owned by the
     * account; anything else is a 404. A missing (or explicitly null)
     * `calendar_id` resolves to the account's protected default calendar,
     * provisioning it when the account does not have one yet.
     *
     * The current event, when there is one, is what tells an ARCHIVED
     * calendar apart from a calendar the client is attaching the event
     * to: an event that already lives in a disconnected mirror KEEPS it
     * (the client re-sends the event's calendar on every drag, resize or
     * rename, and refusing it would make those events uneditable
     * forever), while moving an event INTO an archived calendar is
     * rejected.
     */
    private function resolveCalendar(Request $request, ?Event $event = null): Calendar
    {
        if ($request->calendar_id !== null) {
            $calendar = Calendar::where('id', $request->calendar_id)
                ->where('user_id', $request->user()->id)
                ->first();

            if (! $calendar) {
                abort(404, 'Calendar not found');
            }

            // LBDS-292 - a MIRROR whose source was disconnected is not a
            // calendar an event may belong to: the picker hides it, so
            // attaching an event to it would create a calendar-less event
            // by another name. An event that already lives there is left
            // alone: it keeps its calendar until the user moves it.
            if ($calendar->archived_at !== null
                && ($event === null || $event->calendar_id !== $calendar->id)) {
                abort(422, 'This calendar is no longer available');
            }

            return $calendar;
        }

        return DefaultCalendarService::ensureForUser($request->user());
    }
}
