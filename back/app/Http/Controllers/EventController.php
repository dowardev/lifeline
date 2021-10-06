<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function createEvent(Request $request)
    {
        $request->validate([
            "title" => "required|string",
            "time" => "required|array",
            "reminders" => "required|array",
            "repeats" => "required|array",
            "calendar" => "required|string",
            "notes" => "string",
        ]);
        //      return $request->repeats;
        $event = new Event([
            "title" => $request->title,
            "time_start" => $request->time["startDate"],
            "time_end" => $request->time["endDate"],
            "reminders" => serialize($request->reminders),
            "repeats" => serialize($request->repeats),
            "calendar" => $request->calendar,
            "notes" => $request->notes,
        ]);
        $event->save();
    }
    public function getEvents()
    {
        $events = [];
        $result = DB::table("events")
            ->select(
                "id",
                "title",
                "time_start",
                "time_end",
                "repeats",
                "reminders",
                "calendar",
                "notes"
            )
            ->get();

        foreach ($result as $key => $value) {
            $value->reminders = unserialize($value->reminders);
            $value->repeats = unserialize($value->repeats);
        }
        return $result;
    }
}
