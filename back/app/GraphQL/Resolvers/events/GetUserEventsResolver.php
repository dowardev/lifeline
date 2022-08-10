<?php

namespace App\GraphQL\Resolvers\events;

use App\Models\Event;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

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

    $date = date_time_set(date_create($args['date']), 00, 00, 00);
    $result = Event::where('time_start', '<=', $date)
      ->where('time_end', '>=', $date)
      ->get();

    foreach ($result as $key => $value) {
      $value->reminders = unserialize($value->reminders);
      $value->repeats = unserialize($value->repeats);
      $value->guests = unserialize($value->guests);
      $value->calendar = Event::find($result[0]->id)->calendar;
      $value->time_start = date('c', strtotime($value->time_start));
      $value->time_end = date('c', strtotime($value->time_end));
    }

    // $events = [];
    // foreach ($result as $key => $value) {
    //   $value->tags = Event::find($value->id)->tags;
    // }
    return ['events' => $result];
  }
}
