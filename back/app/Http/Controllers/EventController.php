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
      'title' => 'required|string',
    ]);

    $dateTimeStart = null;
    $dateTimeEnd = null;
    if ($request->dateTime) {
      $dateTimeStart =
        $request->dateTime['start']['date'] .
        ' ' .
        $request->dateTime['start']['time'];
      $dateTimeEnd =
        $request->dateTime['end']['date'] .
        ' ' .
        $request->dateTime['end']['time'];
    }

    $event = new Event([
      'title' => $request->title,
      'time_start' => $dateTimeStart,
      'time_end' => $dateTimeEnd,
      'reminders' => serialize($request->reminders),
      'repeats' => serialize($request->repeats),
      'calendar' => $request->calendar,
      'notes' => $request->notes,
      'tags' => serialize($request->tags),
      'tasks' => serialize($request->tasks),
      'khanban' => serialize($request->khanban),
    ]);
    $event->save();
    return response()->json('Success', 200);
  }
  public function getEvents(Request $request)
  {
    $dateStart = $request->dateStart;
    $dateEnd = $request->dateEnd;
    $events = [];
    $result = DB::table('events')
      ->select(
        'id',
        'title',
        'time_start',
        'time_end',
        'repeats',
        'reminders',
        'calendar',
        'notes',
        'tags',
        'tasks',
        'khanban'
      )
      ->where('time_start', '>=', $dateStart)
      ->where('time_start', '<=', $dateEnd)
      ->get();

    foreach ($result as $key => $value) {
      $value->reminders = unserialize($value->reminders);
      $value->repeats = unserialize($value->repeats);
      $value->tags = unserialize($value->tags);
      $value->tasks = unserialize($value->tasks);
      $value->khanban = unserialize($value->khanban);
    }
    return $result;
  }
}
