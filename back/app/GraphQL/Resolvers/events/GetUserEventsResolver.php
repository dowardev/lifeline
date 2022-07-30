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

class GetUserEventsResolver
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
    $dateStart = $args['dateStart'];
    $dateEnd = $args['dateEnd'];
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
    return ['events' => $result];
  }
}
