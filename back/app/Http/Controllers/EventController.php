<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Calendar;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class EventController extends Controller
{
    public function createEvent(Request $request)
    {
        $user = Auth::guard('api')->user();
        if ($user == null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'name' => 'required|string',
            'dateStart' => 'required|string',
            'dateEnd' => 'required|string',
            'timeZone' => 'required|string',
            'availability' => 'required|string',
            'calendar_id' => 'required|integer',
        ]);

        $user_id = $user->id;

        $event = new Event();
        $event->user_id = $user_id;
        $event->title = $request->name;
        $event->guests = $request->guests;
        $event->time_zone = $request->timeZone;
        $event->description = $request->description;
        $event->availability = $request->availability;
        $event->date_start = Carbon::createFromFormat('Y-m-d\TH:i:s.u\Z', $request->dateStart);
        $event->date_end = Carbon::createFromFormat('Y-m-d\TH:i:s.u\Z', $request->dateEnd);
        $event->notifications = $request->notifications;
        $event->repeat = $request->repeat;

        $calendar = Calendar::where('id', $request->calendar_id)
            ->where('user_id', $user->id)
            ->first();
        if (!$calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }
        $event->calendar_id = $calendar->id;

        $event->save();

        return response()->json(['id' => $event->id], 201);
    }

    public function getEvents(Request $request)
    {
        $user = Auth::guard('api')->user();
        if ($user == null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user_id = $user->id;
        $eventsData = Event::where('user_id', $user_id)->get();

        foreach ($eventsData as $event) {
            if ($event->date_start) {
                $event->date_start = Carbon::createFromFormat(
                    'Y-m-d H:i:s', $event->date_start
                )->format('Y-m-d\TH:i:s.u\Z');
            }
            if ($event->date_end) {
                $event->date_end = Carbon::createFromFormat(
                    'Y-m-d H:i:s', $event->date_end
                )->format('Y-m-d\TH:i:s.u\Z');
            }
        }

        return response()->json(['events' => $eventsData]);
    }

    public function updateEvent(Request $request)
    {
        $user = Auth::guard('api')->user();
        if ($user == null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'id' => 'required',
            'name' => 'required|string',
            'dateStart' => 'required|string',
            'dateEnd' => 'required|string',
        ]);

        $event = Event::find($request->id);
        if (!$event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        if ($event->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $event->title = $request->name;
        $event->guests = $request->guests;
        $event->time_zone = $request->timeZone;
        $event->description = $request->description;
        $event->availability = $request->availability;
        $event->date_start = Carbon::createFromFormat('Y-m-d\TH:i:s.u\Z', $request->dateStart);
        $event->date_end = Carbon::createFromFormat('Y-m-d\TH:i:s.u\Z', $request->dateEnd);
        $event->notifications = $request->notifications;
        $event->repeat = $request->repeat;
        $event->save();

        return response()->json(['state' => true]);
    }

    public function removeEvent(Request $request)
    {
        $user = Auth::guard('api')->user();
        if ($user == null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate(['id' => 'required']);

        $event = Event::find($request->id);
        if (!$event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        if ($event->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $event->delete();

        return response()->json(['state' => true]);
    }


}
