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
            "dateTime" => "required|string",
            "calendar" => "required|string",
        ]);

        $dateTime = json_decode($request->dateTime, true);
        $dateTimeStart =
            $dateTime["start"]["date"] . " " . $dateTime["start"]["time"];
        $dateTimeEnd =
            $dateTime["end"]["date"] . " " . $dateTime["end"]["time"];

        $event = new Event([
            "title" => $request->title,
            "time_start" => $dateTimeStart,
            "time_end" => $dateTimeEnd,
            "reminders" => serialize($request->reminders),
            "repeats" => serialize($request->repeats),
            "calendar" => $request->calendar,
            "notes" => $request->notes,
        ]);
        $event->save();
        return response()->json("Success", 200);
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
