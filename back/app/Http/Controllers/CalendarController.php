<?php

namespace App\Http\Controllers;

use App\Http\Resources\CalendarResource;
use Illuminate\Http\Request;
use App\Models\Calendar;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $perPage = $request->input('per_page', 50);

        $calendars = Calendar::where('user_id', $request->user()->id)
            ->select('id', 'name', 'default')
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
