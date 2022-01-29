<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\DB;
use App\Models\Tag;
use App\Models\AdminTag;

class EventController extends Controller
{
  public function createEvent(Request $request)
  {
    $request->validate([
      'title' => 'required|string',
    ]);

    $dateTimeStart = date(
      'Y-m-d H:i',
      strtotime(json_decode($request->dateTime)->start)
    );
    $dateTimeEnd = date(
      'Y-m-d H:i',
      strtotime(json_decode($request->dateTime)->end)
    );

    $eventId = 0;
    $event = Event::create([
      'title' => $request->title,
      'time_start' => $dateTimeStart,
      'time_end' => $dateTimeEnd,
      'reminders' => serialize($request->reminders),
      'repeats' => serialize($request->repeats),
      'guest' => serialize($request->guest),
      'notes' => $request->notes,
    ]);
    $eventId = $event->id;

    $tagIndex = [];
    foreach (json_decode($request->tags) as $tag) {
      $tag = AdminTag::create([
        'name' => $tag,
      ]);
      array_push($tagIndex, $tag->id);
    }

    foreach ($tagIndex as $key) {
      Tag::create([
        'event_id' => $eventId,
        'tag_id' => $key,
      ]);
    }

    return response()->json('Success', 200);
  }
  public function getEvents(Request $request)
  {
    $dateStart = $request->dateStart;
    $dateEnd = $request->dateEnd;
    $result = DB::table('events')
      ->select(
        'id',
        'title',
        'time_start',
        'time_end',
        'repeats',
        'reminders',
        'notes',
        'guest'
      )
      ->whereDate('time_start', '>=', $dateStart)
      ->whereDate('time_start', '<=', $dateStart)
      ->get();

    foreach ($result as $key => $value) {
      $value->reminders = unserialize($value->reminders);
      $value->repeats = unserialize($value->repeats);
      $value->guest = unserialize($value->guest);
    }

    $events = [];
    foreach ($result as $key => $value) {
      $value->tags = Event::find($value->id)->tags;
    }
    return response()->json($result, 200);
  }
}
