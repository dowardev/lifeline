<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\DB;
use App\Models\Tag;
use App\Models\AdminTag;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
  public function createEvent(Request $request)
  {
    $request->validate([
      'title' => 'required|string',
    ]);

    $dateTimeStart = $this->formatDate(json_decode($request->dateTime)->start);
    $dateTimeEnd = $this->formatDate(json_decode($request->dateTime)->end);

    $event = Event::create([
      'title' => $request->title,
      'calendar_id' => $request->calendar,
      'time_start' => $dateTimeStart,
      'time_end' => $dateTimeEnd,
      'reminders' => serialize($request->reminders),
      'repeats' => serialize($request->repeats),
      'guests' => serialize($request->guests),
      'notes' => $request->notes,
      'time_zone' => $request->timeZone,
      'user_id' => Auth::user()->id,
    ]);
    $eventId = $event->id;
    if (json_decode($request->tags)) {
      $tags = json_decode($request->tags);
      $this->createTagsEvent($tags, $eventId);
    }

    return response()->json('Success', 200);
  }
  function createTagsEvent($tags, $eventId)
  {
    $tagsDB = Event::join('tags', 'events.id', '=', 'event_id')
      ->join('admin_tags', 'admin_tags.id', '=', 'tag_id')
      ->join('users', 'users.id', '=', 'events.user_id')
      ->groupBy('admin_tags.id', 'admin_tags.name')
      ->get(['admin_tags.id', 'admin_tags.name']);

    $tagIndex = [];
    if (count($tagsDB) > 0) {
      foreach ($tags as $key => $value) {
        $result = $this->searchExistsTag($value, $tagsDB);
        if ($result[0]) {
          array_push($tagIndex, $result[1]);
        } else {
          $tag = AdminTag::create([
            'name' => $value,
          ]);
          array_push($tagIndex, $tag->id);
        }
      }
    } else {
      foreach ($tags as $key1 => $value1) {
        $tag = AdminTag::create([
          'name' => $value1,
        ]);
        array_push($tagIndex, $tag->id);
      }
    }
    foreach ($tagIndex as $key) {
      Tag::create([
        'event_id' => $eventId,
        'tag_id' => $key,
      ]);
    }
  }
  public function searchExistsTag($element, $array)
  {
    foreach ($array as $key => $value) {
      if ($value->name == $element) {
        return [true, $value->id];
      }
    }
    return [false, 0];
  }
  public function formatDate($date)
  {
    return date('Y-m-d H:i', strtotime($date));
  }
  public function getEvents(Request $request)
  {
    $dateStart = $request->dateStart;
    $dateEnd = $request->dateEnd;
    $result = Event::whereDate('time_start', '>=', $dateStart)
      ->whereDate('time_start', '<=', $dateEnd)
      ->get();

    foreach ($result as $key => $value) {
      $value->reminders = unserialize($value->reminders);
      $value->repeats = unserialize($value->repeats);
      $value->guests = unserialize($value->guests);
      $value->calendar = Event::find($result[0]->id)->calendar;
    }

    $events = [];
    foreach ($result as $key => $value) {
      $value->tags = Event::find($value->id)->tags;
    }
    return response()->json($result, 200);
  }
  public function updateEvent(Request $request)
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

    Event::where('id', $request->id)->update([
      'title' => $request->title,
      'calendar_id' => $request->calendar,
      'time_start' => $dateTimeStart,
      'time_end' => $dateTimeEnd,
      'reminders' => serialize($request->reminders),
      'repeats' => serialize($request->repeats),
      'guests' => serialize($request->guests),
      'notes' => $request->notes,
      'time_zone' => $request->timeZone,
    ]);

    // $removeTags = [];
    // $newTags = [];
    // foreach (Event::find($request->id)->tags as $key => $value1) {
    //   foreach (json_decode($request->tags) as $key => $value2) {
    //     if ($value1['name'] == $value2) {
    //       array_push($newTags, $value2);
    //     } else {
    //       array_push($removeTags, $value2);
    //     }
    //   }
    // }
    // return $removeTags;
    return response()->json('Success', 200);
  }
  public function removeEvent(Request $request)
  {
    Event::find($request->id)->delete();
    return response()->json('Success', 200);
  }
}
