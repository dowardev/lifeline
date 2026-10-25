<?php
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>


namespace App\Http\Controllers;

use App\Http\Resources\CalendarResource;
use App\Models\Calendar;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 50);

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
        $request->validate(['name' => 'required|string|max:255']);
        $calendar->update(['name' => $request->name]);

        return response()->json(['calendar' => new CalendarResource($calendar)]);
    }

    public function destroy(Request $request, $id)
    {
        $calendar = Calendar::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        $calendar->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
