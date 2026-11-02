<?php

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Calendar;
use App\Models\Event;
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
            'calendar_id' => 'integer|nullable',
            'notifications' => 'nullable|array',
            'repeat' => 'nullable|array',
            'guests' => 'nullable|array|max:50',
            'id_reminders' => 'nullable|array',
            'id_reminders.*' => 'integer',
            'description' => 'nullable|string|max:65535',
        ]);

        if ($request->calendar_id) {
            $calendar = Calendar::where('id', $request->calendar_id)
                ->where('user_id', $request->user()->id)
                ->first();
            if (! $calendar) {
                return response()->json(['message' => 'Calendar not found'], 404);
            }
        }

        $event = new Event([
            'title' => $request->name,
            'calendar_id' => $request->calendar_id,
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
            'calendar_id' => 'sometimes|integer|nullable',
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
            $updates['calendar_id'] = $request->calendar_id;
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
}
