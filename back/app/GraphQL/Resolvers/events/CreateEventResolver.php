<?php

namespace App\GraphQL\Resolvers\events;

use App\Models\AdminTag;
use App\Models\Calendar;
use App\Models\Event;
use App\Models\Tag;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CreateEventResolver
{
  public function resolve(
    $rootValue,
    array $args,
    GraphQLContext $context = null,
    ResolveInfo $resolveInfo
  ) {
    $user = Auth::guard('api')->user();
    if ($user == null) {
      return Error::createLocatedError('Unauthorized');
    }

    $title = 'no title';
    if (array_key_exists('title', $args) && $args['title'] != '') {
      $title = $args['title'];
    }

    $calendar_id = DB::table('calendars')
      ->where('default', true)
      ->get()[0]->id;
    if (array_key_exists('calendar', $args)) {
      $calendar_exists = Calendar::find($args['calendar']);
      if ($calendar_exists) {
        $calendar_id = $args['calendar'];
      }
    }

    $dateTimeStart = $this->formatDate('022-07-25T00:00:00-00:00');
    $dateTimeEnd = $this->formatDate('022-07-25T00:00:00-00:00');
    if (array_key_exists('time_start', $args)) {
      $dateTimeStart = $this->formatDate($args['time_start']);
      $dateTimeEnd = $this->formatDate($args['time_end']);
    }

    $reminders = [];
    if (array_key_exists('reminders', $args)) {
      $reminders = $args['reminders'];
    }

    $repeats = [];
    if (array_key_exists('repeats', $args)) {
      $repeats = $args['repeats'];
    }

    $guests = [];
    if (array_key_exists('guests', $args)) {
      $guests = $args['guests'];
    }

    $notes = '';
    if (array_key_exists('notes', $args)) {
      $notes = $args['notes'];
    }

    $notes = '';
    if (array_key_exists('notes', $args)) {
      $notes = $args['notes'];
    }

    $time_zone = '';
    if (array_key_exists('timeZone', $args)) {
      $time_zone = $args['timeZone'];
    }

    $event = Event::create([
      'title' => $title,
      'calendar_id' => $calendar_id,
      'time_start' => $dateTimeStart,
      'time_end' => $dateTimeEnd,
      'reminders' => serialize($reminders),
      'repeats' => serialize($repeats),
      'guests' => serialize($guests),
      'notes' => $notes,
      'time_zone' => $time_zone,
      'user_id' => Auth::user()->id,
    ]);
    $eventId = $event->id;

    if (array_key_exists('tags', $args)) {
      $tags = json_decode($args['tags']);
      $this->createTagsEvent($tags, $eventId);
    }
  }

  public function formatDate($date)
  {
    return date_time_set(date_create($date), 00, 00, 00);
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
}
