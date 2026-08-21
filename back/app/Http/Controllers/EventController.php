<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Calendar;
use App\Models\Event;
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
            'guests' => 'nullable|array',
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
            'notifications' => $request->notifications,
            'repeat' => $request->repeat,
            'guests' => $request->guests,
            'description' => $request->description,
        ]);
        $event->user_id = $request->user()->id;
        $event->save();

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
            'guests' => 'sometimes|nullable|array',
            'description' => 'sometimes|nullable|string|max:65535',
        ]);

        $event = Event::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

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
            $updates['guests'] = $request->guests;
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
            $updates['notifications'] = $request->notifications;
        }
        if ($request->has('repeat')) {
            $updates['repeat'] = $request->repeat;
        }
        if ($request->has('calendar_id')) {
            $updates['calendar_id'] = $request->calendar_id;
        }

        $event->update($updates);

        return response()->json(['event' => new EventResource($event)]);
    }

    public function destroy(Request $request, $id)
    {
        $event = Event::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        $event->delete();

        return response()->json(['state' => true]);
    }
}
