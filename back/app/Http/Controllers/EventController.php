<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;

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
}
